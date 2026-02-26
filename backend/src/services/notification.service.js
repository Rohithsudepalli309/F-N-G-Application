const db = require('../config/db');
const logger = require('../config/logger');

// Note: In a production environment, you would use 'firebase-admin'
// const admin = require('firebase-admin');

class NotificationService {
  /**
   * Send a push notification to a specific user.
   * @param {number} userId - The ID of the recipient user.
   * @param {object} payload - The notification data (title, body, data).
   */
  async sendToUser(userId, payload) {
    try {
      // 1. Fetch user's FCM token
      const result = await db.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
      const token = result.rows[0]?.fcm_token;

      if (!token) {
        logger.warn(`No FCM token found for user ${userId}. Skipping push notification.`);
        return false;
      }

      // 2. Prepare Payload
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        token: token,
      };

      // 3. Send (Mocked for now since keys are environment dependent)
      logger.info(`Sending Push Notification to User ${userId}: "${payload.title}"`);
      
      /* 
      // REAL FCM IMPLEMENTATION:
      try {
        await admin.messaging().send(message);
        return true;
      } catch (fcmErr) {
        logger.error('FCM Send Error:', fcmErr);
        return false;
      }
      */

      return true;
    } catch (err) {
      logger.error('Error in NotificationService.sendToUser:', err);
      return false;
    }
  }

  /**
   * Trigger local/socket alerts + push for order status changes.
   */
  async notifyOrderStatus(orderId, status) {
     try {
       // Fetch order details to find the customer
       const orderRes = await db.query('SELECT customer_id FROM orders WHERE id = $1', [orderId]);
       const customerId = orderRes.rows[0]?.customer_id;

       if (!customerId) return;

       const statusMessages = {
         'placed': { title: 'Order Placed! 🛍️', body: 'We have received your order.' },
         'preparing': { title: 'Preparing... 🍳', body: 'Your items are being packed.' },
         'ready': { title: 'Ready for Pickup! 📦', body: 'An F&G driver is on the way.' },
         'pickup': { title: 'Out for Delivery 🛵', body: 'Your F&G order is on the way!' },
         'delivered': { title: 'Delivered! ✅', body: 'Enjoy your products.' },
       };

       const msg = statusMessages[status];
       if (msg) {
         await this.sendToUser(customerId, {
           title: msg.title,
           body: msg.body,
           data: { orderId, status, type: 'ORDER_UPDATE' }
         });
       }
     } catch (err) {
       logger.error('Error in notifyOrderStatus:', err);
     }
  }
}

module.exports = new NotificationService();
