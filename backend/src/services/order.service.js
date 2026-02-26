const db = require('../config/db');
const logger = require('../config/logger');

class OrderService {
  async getOrdersByCustomer(customerId) {
    try {
      // 1. Fetch main order details
      const ordersResult = await db.query(
        'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
        [customerId]
      );
      const orders = ordersResult.rows;

      if (orders.length === 0) return [];

      // 2. For each order, fetch its items
      // (Using a loop for simplicity in this stage, can be optimized with JOINs)
      const enhancedOrders = await Promise.all(
        orders.map(async (order) => {
          const itemsResult = await db.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [order.id]
          );
          return {
            ...order,
            items: itemsResult.rows,
          };
        })
      );

      return enhancedOrders;
    } catch (err) {
      logger.error('Error in getOrdersByCustomer:', err);
      throw err;
    }
  }

  async createOrder(data, customerId) {
    const { id, storeId, items, totalAmount, address } = data;
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Insert into orders with 'pending' status (awaiting payment webhook)
      await client.query(
        `INSERT INTO orders (id, customer_id, store_id, total_amount, address, status) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, customerId, storeId, totalAmount, address, 'pending']
      );

      // 2. Insert order items & Deduct Stock Atomically
      for (const item of items) {
        // Attempt to deduct stock
        const stockResult = await client.query(
          `UPDATE products 
           SET stock = stock - $1 
           WHERE id = $2 AND stock >= $1 
           RETURNING stock`,
          [item.quantity, item.id]
        );

        if (stockResult.rows.length === 0) {
           throw new Error(`Insufficient stock for product: ${item.name}`);
        }

        // Insert into order_items
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, price, quantity) 
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.id, item.name, item.price, item.quantity]
        );
      }

      await client.query('COMMIT');
      logger.info(`Order ${id} created successfully (pending payment) for customer ${customerId}`);
      return { id, status: 'pending' };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Error in createOrder:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async markPaid(orderId, io) {
    try {
      await db.query(
        "UPDATE orders SET status = 'placed' WHERE id = $1",
        [orderId]
      );
      
      if (io) {
        // Notify the customer app specifically for this order
        io.to(`order:${orderId}`).emit('order.paid', { 
          orderId, 
          status: 'placed',
          message: 'Payment confirmed! Your order is being processed.' 
        });
      }
      
      logger.info(`Order ${orderId} marked as placed/paid.`);
      return true;
    } catch (err) {
      logger.error('Error in markPaid:', err);
      throw err;
    }
  }
}

module.exports = new OrderService();
