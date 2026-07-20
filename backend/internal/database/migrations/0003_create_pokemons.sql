CREATE TABLE IF NOT EXISTS pokemons (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    collection_id bigint NOT NULL REFERENCES collections (id) ON DELETE CASCADE,
    game_id bigint NOT NULL REFERENCES games (id) ON DELETE RESTRICT,
    pokemon_name text NOT NULL,
    nickname text,
    is_shiny boolean NOT NULL DEFAULT false,
    gender text NOT NULL CHECK (gender IN ('male', 'female', 'genderless')),
    form text,
    box_number integer NOT NULL CHECK (box_number BETWEEN 1 AND 32),
    slot integer NOT NULL CHECK (slot BETWEEN 0 AND 29),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT pokemons_position_unique
        UNIQUE (collection_id, box_number, slot)
        DEFERRABLE INITIALLY IMMEDIATE
);
