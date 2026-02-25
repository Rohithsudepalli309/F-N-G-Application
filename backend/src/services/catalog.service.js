const db = require('../config/db');
const logger = require('../config/logger');

class CatalogService {
  async getStores(filters = {}) {
    try {
      const { type, region } = filters;
      let query = 'SELECT * FROM stores';
      const params = [];

      if (type || region) {
        query += ' WHERE';
        if (type) {
          params.push(type);
          query += ` store_type = $${params.length}`;
        }
        if (region) {
          if (params.length > 0) query += ' AND';
          params.push(region);
          query += ` region = $${params.length}`;
        }
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (err) {
      logger.error('Error in getStores:', err);
      throw err;
    }
  }

  async getProducts(filters = {}) {
    try {
      const { storeId, category, search } = filters;
      let query = 'SELECT * FROM products';
      const params = [];

      const conditions = [];
      if (storeId) {
        params.push(storeId);
        conditions.push(`store_id = $${params.length}`);
      }
      if (category) {
        params.push(category);
        conditions.push(`category = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(`name ILIKE $${params.length}`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (err) {
      logger.error('Error in getProducts:', err);
      throw err;
    }
  }
}

module.exports = new CatalogService();
