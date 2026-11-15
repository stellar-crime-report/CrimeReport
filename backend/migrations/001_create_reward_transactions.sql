-- Migration: Create reward_transactions table for Soroban ReportVerified payouts
CREATE TABLE IF NOT EXISTS reward_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id  UUID REFERENCES reports(id),
  wallet     VARCHAR(56),
  amount_xlm DECIMAL(18,7),
  tx_hash    VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_report_id
  ON reward_transactions(report_id);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_wallet
  ON reward_transactions(wallet);
