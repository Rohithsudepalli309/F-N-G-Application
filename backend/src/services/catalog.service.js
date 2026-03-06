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
      const { storeId, category, search, limit } = filters;

      // Use DISTINCT ON (name) when no specific store is requested to avoid
      // returning the same product multiple times (seeded across stores).
      const distinctOn = !storeId ? 'DISTINCT ON (LOWER(name)) ' : '';
      let query = `SELECT ${distinctOn}* FROM products`;
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

      // DISTINCT ON requires its expression first in ORDER BY
      query += distinctOn ? ' ORDER BY LOWER(name), id' : ' ORDER BY id';

      if (limit) {
        const n = parseInt(limit, 10);
        if (n > 0) {
          params.push(n);
          query += ` LIMIT $${params.length}`;
        }
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
