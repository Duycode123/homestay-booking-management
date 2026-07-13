ALTER TABLE room
    ADD COLUMN IF NOT EXISTS max_people INT;

UPDATE room r
SET max_people = CASE
    WHEN rt.name ILIKE '%premium%' THEN 12
    WHEN rt.name ILIKE '%band%' OR rt.name ILIKE '%lưu trú%' THEN 8
    WHEN rt.name ILIKE '%record%' OR rt.name ILIKE '%mix%' THEN 4
    ELSE 2
END
FROM room_tier rt
WHERE r.room_tier_id = rt.id
  AND r.max_people IS NULL;

UPDATE room
SET max_people = 2
WHERE max_people IS NULL;

ALTER TABLE room
    ALTER COLUMN max_people SET DEFAULT 2,
    ALTER COLUMN max_people SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'room'
          AND constraint_name = 'chk_room_max_people_range'
    ) THEN
        ALTER TABLE room
            ADD CONSTRAINT chk_room_max_people_range
            CHECK (max_people BETWEEN 1 AND 100);
    END IF;
END
$$;

ALTER TABLE room
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'room'
          AND constraint_name = 'chk_room_image_url_length'
    ) THEN
        ALTER TABLE room
            ADD CONSTRAINT chk_room_image_url_length
            CHECK (image_url IS NULL OR char_length(image_url) <= 500);
    END IF;
END
$$;
