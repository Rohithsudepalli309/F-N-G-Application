-- Analytics & Loyalty Engine Schema
CREATE TABLE IF NOT EXISTS loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    points INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- earned, redeemed, expired
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchant_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id),
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    avg_prep_time INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    UNIQUE(store_id, date)
);

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_loyalty_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_store_date ON merchant_analytics_daily(store_id, date);
