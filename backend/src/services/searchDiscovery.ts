import pool from '../db';

export interface SearchResult {
  id: string;
  name: string;
  type: 'store' | 'product';
  category: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface SuggestionRow {
  name: string;
}

export class SearchDiscoveryEngine {
  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];
    const term = query.trim();

    const sql = `
      WITH product_matches AS (
        SELECT
          p.id::text AS id,
          p.name,
          'product'::text AS type,
          COALESCE(p.category, 'general') AS category,
          GREATEST(
            ts_rank_cd(
              to_tsvector('simple', p.name || ' ' || COALESCE(p.description, '')),
              plainto_tsquery('simple', $1)
            ),
            CASE WHEN p.name ILIKE '%' || $1 || '%' THEN 0.15 ELSE 0 END
          ) AS score,
          json_build_object(
            'price', p.price,
            'original_price', p.original_price,
            'image_url', p.image_url,
            'unit', p.unit,
            'store_id', p.store_id,
            'is_veg', p.is_veg
          ) AS metadata
        FROM products p
        WHERE p.is_available = TRUE
          AND (
            to_tsvector('simple', p.name || ' ' || COALESCE(p.description, '')) @@ plainto_tsquery('simple', $1)
            OR p.name ILIKE '%' || $1 || '%'
            OR COALESCE(p.category, '') ILIKE '%' || $1 || '%'
          )
      ),
      store_matches AS (
        SELECT
          s.id::text AS id,
          s.name,
          'store'::text AS type,
          COALESCE(s.store_type, 'store') AS category,
          GREATEST(
            ts_rank_cd(
              to_tsvector('simple', s.name || ' ' || COALESCE(s.description, '')),
              plainto_tsquery('simple', $1)
            ) * 1.2,
            CASE WHEN s.name ILIKE '%' || $1 || '%' THEN 0.2 ELSE 0 END
          ) AS score,
          json_build_object(
            'rating', s.rating,
            'address', s.address,
            'delivery_time_min', s.delivery_time_min,
            'image_url', s.image_url
          ) AS metadata
        FROM stores s
        WHERE s.is_active = TRUE
          AND (
            to_tsvector('simple', s.name || ' ' || COALESCE(s.description, '')) @@ plainto_tsquery('simple', $1)
            OR s.name ILIKE '%' || $1 || '%'
            OR array_to_string(COALESCE(s.cuisine_tags, '{}'), ' ') ILIKE '%' || $1 || '%'
          )
      )
      SELECT * FROM product_matches
      UNION ALL
      SELECT * FROM store_matches
      ORDER BY score DESC, name ASC
      LIMIT 20;
    `;

    try {
      const { rows } = await pool.query<SearchResult>(sql, [term]);
      return rows;
    } catch (err) {
      console.error('[Search] Query failed:', err);
      return [];
    }
  }

  async getSuggestions(partial: string): Promise<string[]> {
    if (!partial || partial.trim().length < 2) return [];
    const term = partial.trim();

    const sql = `
      SELECT DISTINCT name
      FROM (
        SELECT name FROM products WHERE name ILIKE $1
        UNION
        SELECT name FROM stores WHERE name ILIKE $1
      ) q
      ORDER BY name ASC
      LIMIT 8;
    `;

    try {
      const { rows } = await pool.query<SuggestionRow>(sql, [`%${term}%`]);
      return rows.map((row) => row.name);
    } catch {
      return [];
    }
  }
}

export const searchEngine = new SearchDiscoveryEngine();
