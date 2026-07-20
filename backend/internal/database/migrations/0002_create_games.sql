CREATE TABLE IF NOT EXISTS games (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    collection_id bigint NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    name text NOT NULL,
    is_official boolean NOT NULL,
    visible boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS games_collection_name_unique
    ON games (collection_id, lower(name));
