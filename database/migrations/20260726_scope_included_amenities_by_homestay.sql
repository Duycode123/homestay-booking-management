BEGIN;

CREATE TABLE IF NOT EXISTS room_included_amenity (
    room_id INT NOT NULL REFERENCES room(id) ON DELETE CASCADE,
    amenity_id BIGINT NOT NULL REFERENCES common_amenity(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_room_included_amenity_amenity
    ON room_included_amenity (amenity_id, room_id);

-- Preserve the previous global behavior for existing data. Administrators can now
-- keep or remove each assignment independently for every homestay.
INSERT INTO room_included_amenity (room_id, amenity_id)
SELECT room.id, amenity.id
FROM room
CROSS JOIN common_amenity amenity
ON CONFLICT (room_id, amenity_id) DO NOTHING;

COMMENT ON TABLE room_included_amenity IS
    'Included amenities available at a specific homestay; room is the bookable whole-unit homestay in this project.';

COMMIT;
