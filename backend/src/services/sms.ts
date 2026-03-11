/**
 * SMS service — abstracts OTP delivery behind a single `sendOtp()` call.
 *
 * Provider selection via SMS_PROVIDER env var:
 *   msg91   → MSG91 HTTP OTP API  (recommended for India)
 *   twilio  → Twilio Messages API (global)
 *   console → logs to stdout only (default / dev / test)
 *
 * Required env vars per provider:
 *   MSG91:  MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID (optional, default FNGAPP)
 *   Twilio: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

const OTP_MESSAGE = (otp: string) =>
  `${otp} is your F&G verification code. Valid for 10 minutes. Do not share with anyone.`;

// ── MSG91 ─────────────────────────────────────────────────────────────────────
async function sendViaMSG91(phone: string, otp: string): Promise<void> {
  const authKey    = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    throw new Error('MSG91_AUTH_KEY and MSG91_TEMPLATE_ID must be set.');
  }

  const res = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authkey': authKey,
    },
    body: JSON.stringify({
      template_id: templateId,
      mobile:      `91${phone}`,    // India country code prefix
      otp,
    }),
  });

  type MSG91Response = { type: string; message?: string };
  const json = await res.json() as MSG91Response;

  if (!res.ok || json.type !== 'success') {
    throw new Error(`MSG91 error: ${json.message ?? `HTTP ${res.status}`}`);
  }
}

// ── Twilio ────────────────────────────────────────────────────────────────────
async function sendViaTwilio(phone: string, otp: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const from       = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    throw new Error(
      'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER must be set.'
    );
  }

  const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const params    = new URLSearchParams({
    From: from,
    To:   `+91${phone}`,           // India country code prefix
    Body: OTP_MESSAGE(otp),
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization':  `Basic ${basicAuth}`,
        'Content-Type':   'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    }
  );

  if (!res.ok) {
    type TwilioError = { message?: string; code?: number };
    const err = await res.json() as TwilioError;
    throw new Error(`Twilio error: ${err.message ?? `HTTP ${res.status}`}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send an OTP to the given 10-digit Indian mobile number.
 * Throws if the chosen provider fails so the caller can return a 502.
 */
export async function sendOtp(phone: string, otp: string): Promise<void> {
  const provider = process.env.SMS_PROVIDER ?? 'console';

  // Always use console in test environment regardless of SMS_PROVIDER setting
  if (process.env.NODE_ENV === 'test' || provider === 'console') {
    console.log(`[SMS/console] OTP for ${phone}: ${otp}`);
    return;
  }

  if (provider === 'msg91') {
    await sendViaMSG91(phone, otp);
  } else if (provider === 'twilio') {
    await sendViaTwilio(phone, otp);
  } else {
    throw new Error(`Unknown SMS_PROVIDER value: "${provider}". Use msg91, twilio, or console.`);
  }

  console.log(`[SMS/${provider}] OTP delivered to ${phone}`);
}
