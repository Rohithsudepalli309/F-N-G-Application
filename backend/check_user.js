const db = require('./src/config/db');
async function checkUser() {
  try {
    const res = await db.query("SELECT * FROM users WHERE phone = '+917780740901'");
    console.log('USER_CHECK_RESULT:', JSON.stringify(res.rows));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
checkUser();
