CREATE TABLE IF NOT EXISTS collections (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code text NOT NULL UNIQUE,
    box_count integer NOT NULL DEFAULT 1 CHECK (box_count BETWEEN 1 AND 32),
    created_at timestamptz NOT NULL DEFAULT now()
);
