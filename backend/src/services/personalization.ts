import pool from '../db';
import { logger } from '../logger';

/**
 * PersonalizationService
 * 
 * Handles user-centric product recommendations based on purchase history.
 */
export class PersonalizationService {
  /**
   * getRecentlyBought
   * 
   * Fetches the top 10 most recently purchased products for a user.
   */
  static async getRecentlyBought(userId: number) {
    try {
      const query = `
        SELECT DISTINCT ON (p.id)
          p.id, 
          p.name, 
          p.brand,
          p.price, 
          p.original_price, 
          p.image_url, 
          p.unit,
          o.created_at as last_bought_at
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.customer_id = $1
          AND o.status = 'delivered'
        ORDER BY p.id, o.created_at DESC
        LIMIT 10;
      `;
      const { rows } = await pool.query(query, [userId]);
      return rows.sort((a, b) => b.last_bought_at.getTime() - a.last_bought_at.getTime());
    } catch (error) {
      logger.error('Error fetching recently bought items:', error);
      return [];
    }
  }

  /**
   * getFrequentlyBoughtTogether
   * 
   * Finds products that are commonly purchased in the same order as a given product.
   */
  static async getFrequentlyBoughtTogether(productId: number) {
    try {
      const query = `
        SELECT 
          p2.id,
          p2.name,
          p2.brand,
          p2.price,
          p2.original_price,
          p2.image_url,
          p2.unit,
          COUNT(*) as co_occurrence
        FROM order_items p1
        JOIN order_items p2 ON p1.order_id = p2.order_id
        JOIN products p2_meta ON p2.product_id = p2_meta.id
        JOIN products p2 ON p2_meta.id = p2.id
        WHERE p1.product_id = $1
          AND p2.product_id != $1
        GROUP BY p2.id
        ORDER BY co_occurrence DESC
        LIMIT 5;
      `;
      // Note: The above query was slightly redundant in joins for clarity, let's optimize:
      const optimizedQuery = `
        SELECT 
          p.id,
          p.name,
          p.brand,
          p.price,
          p.original_price,
          p.image_url,
          p.unit,
          COUNT(*) as co_occurrence
        FROM order_items oi1
        JOIN order_items oi2 ON oi1.order_id = oi2.order_id
        JOIN products p ON oi2.product_id = p.id
        WHERE oi1.product_id = $1
          AND oi2.product_id != $1
        GROUP BY p.id
        ORDER BY co_occurrence DESC
        LIMIT 5;
      `;
      const { rows } = await pool.query(optimizedQuery, [productId]);
      return rows;
    } catch (error) {
      logger.error('Error fetching frequently bought together items:', error);
      return [];
    }
  }

  /**
   * getBasketRecommendations
   * 
   * Combines recent history and co-occurrence for a comprehensive "Smart Basket".
   */
  static async getBasketRecommendations(userId: number) {
    const recent = await this.getRecentlyBought(userId);
    if (recent.length === 0) {
      // Return top selling products instead of empty if no history
      const { rows } = await pool.query(`
        SELECT p.* 
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY COUNT(*) DESC
        LIMIT 10;
      `);
      return rows;
    }
    return recent;
  }
}
