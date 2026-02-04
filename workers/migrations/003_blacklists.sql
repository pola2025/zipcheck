-- Blacklists table for IP blocking
CREATE TABLE IF NOT EXISTS blacklists (
  id SERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_blacklists_ip ON blacklists(ip_address);
CREATE INDEX IF NOT EXISTS idx_blacklists_expires ON blacklists(expires_at);
