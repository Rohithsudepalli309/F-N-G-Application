const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../src/config/db');

async function migrateNotifications() {
  try {
    console.log('Migrating users table to add fcm_token...');
    // Add fcm_token column to users
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS fcm_token TEXT;
    `);

    console.log('Notification migration successful!');
  } catch (err) {
    console.error('Notification migration failed:', err);
  } finally {
    await db.pool.end();
  }
}

migrateNotifications();
