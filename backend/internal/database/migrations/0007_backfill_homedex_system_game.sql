INSERT INTO games (collection_id, name, is_official, is_system, visible)
SELECT c.id, 'HomeDex', false, true, false
FROM collections c
WHERE NOT EXISTS (
    SELECT 1 FROM games g
    WHERE g.collection_id = c.id AND g.is_system
);
