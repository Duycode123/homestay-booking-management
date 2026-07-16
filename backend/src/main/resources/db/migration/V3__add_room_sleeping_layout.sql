ALTER TABLE room
    ADD COLUMN IF NOT EXISTS bedroom_count INT NOT NULL DEFAULT 1;

ALTER TABLE room
    ADD COLUMN IF NOT EXISTS bed_count INT NOT NULL DEFAULT 1;

ALTER TABLE room
    DROP CONSTRAINT IF EXISTS chk_room_bedroom_count_range;

ALTER TABLE room
    DROP CONSTRAINT IF EXISTS chk_room_bed_count_range;

ALTER TABLE room
    DROP CONSTRAINT IF EXISTS chk_room_bed_count_not_less_than_bedrooms;

ALTER TABLE room
    ADD CONSTRAINT chk_room_bedroom_count_range CHECK (bedroom_count BETWEEN 1 AND 20);

ALTER TABLE room
    ADD CONSTRAINT chk_room_bed_count_range CHECK (bed_count BETWEEN 1 AND 50);

ALTER TABLE room
    ADD CONSTRAINT chk_room_bed_count_not_less_than_bedrooms CHECK (bed_count >= bedroom_count);
