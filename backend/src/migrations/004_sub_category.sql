-- ─── Step 18: Add sub_category column to products ────────────────────────────
-- Allows fine-grained filtering e.g. Fruits vs Vegetables under same category.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sub_category VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(category, sub_category);

COMMENT ON COLUMN products.sub_category IS
  'Optional sub-category for finer filtering (e.g. Fruits, Vegetables, Cold Drinks, etc.)';
