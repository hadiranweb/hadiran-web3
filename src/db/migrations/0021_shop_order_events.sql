CREATE TABLE IF NOT EXISTS shop_order_events (
  id SERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  actor_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL,
  kind TEXT NOT NULL,
  from_state TEXT,
  to_state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS shop_order_events_order_time_idx ON shop_order_events(order_id,created_at,id);
CREATE INDEX IF NOT EXISTS shop_orders_settled_time_idx ON shop_orders(settled_at,id) WHERE state='settled';
CREATE INDEX IF NOT EXISTS shop_orders_buyer_created_idx ON shop_orders(buyer_id,created_at,id);
-- Historical state transitions are unknown: no fabricated event backfill.
