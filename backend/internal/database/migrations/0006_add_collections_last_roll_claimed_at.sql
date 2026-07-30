ALTER TABLE collections ADD COLUMN IF NOT EXISTS last_roll_claimed_at timestamptz;
