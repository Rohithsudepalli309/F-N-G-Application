declare module 'react-native-razorpay' {
  interface RazorpayOptions {
    description: string;
    image: string;
    currency: string;
    key: string;
    amount: number | string;
    name: string;
    order_id: string;
    theme?: {
      color: string;
    };
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
  }

  interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayErrorResponse {
    code: number;
    description: string;
    source: string;
    step: string;
    reason: string;
  }

  export default class RazorpayCheckout {
    static open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>;
  }
}
