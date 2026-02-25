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

      // 1. Insert into orders
      await client.query(
        `INSERT INTO orders (id, customer_id, store_id, total_amount, address, status) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, customerId, storeId, totalAmount, address, 'Placed']
      );

      // 2. Insert order items
      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, price, quantity) 
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.id, item.name, item.price, item.quantity]
        );
      }

      await client.query('COMMIT');
      logger.info(`Order ${id} created successfully for customer ${customerId}`);
      return { id, status: 'Placed' };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Error in createOrder:', err);
      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = new OrderService();
