const db = require('../config/db');
const logger = require('../config/logger');

class AnalyticsService {
  /**
   * Returns coordinates of recent orders ('pending', 'placed', 'preparing')
   * for demand heatmap visualization.
   */
  async getOrderHeatmap() {
    try {
      const result = await db.query(`
        SELECT delivery_lat as lat, delivery_lng as lng
        FROM orders
        WHERE status IN ('pending', 'placed', 'preparing', 'ready')
          AND created_at > NOW() - INTERVAL '24 hours'
          AND delivery_lat IS NOT NULL
          AND delivery_lng IS NOT NULL
      `);
      return result.rows;
    } catch (err) {
      logger.error('Error fetching heatmap data:', err);
      throw err;
    }
  }

  /**
   * Returns current status and location of all drivers.
   */
  async getFleetStatus() {
    try {
      const result = await db.query(`
        SELECT 
          u.id, 
          u.name, 
          u.phone,
          u.is_online as "isOnline",
          d.status as "deliveryStatus",
          o.id as "activeOrderId",
          o.delivery_lat as "lastLat",
          o.delivery_lng as "lastLng"
        FROM users u
        LEFT JOIN deliveries d ON u.id = d.driver_id AND d.status NOT IN ('delivered', 'cancelled')
        LEFT JOIN orders o ON d.order_id = o.id
        WHERE u.role = 'driver'
      `);
      return result.rows;
    } catch (err) {
      logger.error('Error fetching fleet status:', err);
      throw err;
    }
  }

  /**
   * Returns high-level platform stats for the Dashboard KPIs.
   */
  async getPlatformStats() {
    try {
      const stats = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM orders) as "totalOrders",
          (SELECT COUNT(*) FROM orders WHERE status NOT IN ('delivered', 'cancelled')) as "activeOrders",
          (SELECT COUNT(*) FROM users WHERE role = 'driver' AND is_online = true) as "activeDrivers",
          (SELECT SUM(total_amount) FROM orders WHERE created_at > CURRENT_DATE) as "dailyRevenue"
      `);

      // Mock chart data for now based on actual totals
      const chartData = [
        { name: 'Mon', orders: 120, revenue: 48000 },
        { name: 'Tue', orders: 150, revenue: 62000 },
        { name: 'Wed', orders: 180, revenue: 74000 },
        { name: 'Thu', orders: 200, revenue: 89000 },
        { name: 'Fri', orders: 250, revenue: 110000 },
        { name: 'Sat', orders: 300, revenue: 145000 },
        { name: 'Sun', orders: 280, revenue: 126000 },
      ];

      return {
        ...stats.rows[0],
        totalOrders: parseInt(stats.rows[0].totalOrders) || 0,
        activeOrders: parseInt(stats.rows[0].activeOrders) || 0,
        activeDrivers: parseInt(stats.rows[0].activeDrivers) || 0,
        dailyRevenue: parseInt(stats.rows[0].dailyRevenue) || 0,
        chartData
      };
    } catch (err) {
      logger.error('Error fetching platform stats:', err);
      throw err;
    }
  }
}

module.exports = new AnalyticsService();
