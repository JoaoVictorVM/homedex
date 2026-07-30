ALTER TABLE games ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS games_collection_system_unique
    ON games (collection_id)
    WHERE is_system;
