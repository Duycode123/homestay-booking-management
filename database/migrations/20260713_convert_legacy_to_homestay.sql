-- Convert legacy music-room reference data to homestay room data.
-- Run with psql/autocommit enabled because PostgreSQL requires new enum values
-- to be committed before they can be used in UPDATE statements.
ALTER TYPE equipment_type ADD VALUE IF NOT EXISTS 'WIFI';
ALTER TYPE equipment_type ADD VALUE IF NOT EXISTS 'AIR_CONDITIONER';
ALTER TYPE equipment_type ADD VALUE IF NOT EXISTS 'TV';
ALTER TYPE equipment_type ADD VALUE IF NOT EXISTS 'WATER_HEATER';

BEGIN;

UPDATE equipment
SET type = CASE type::text
    WHEN 'AMP' THEN 'AIR_CONDITIONER'::equipment_type
    WHEN 'MIXER' THEN 'TV'::equipment_type
    WHEN 'MIC' THEN 'WIFI'::equipment_type
    WHEN 'DRUM' THEN 'WATER_HEATER'::equipment_type
    WHEN 'GUITAR' THEN 'TV'::equipment_type
    WHEN 'KEYBOARD' THEN 'WIFI'::equipment_type
    ELSE 'OTHER'::equipment_type
END
WHERE type::text IN ('AMP', 'MIXER', 'MIC', 'DRUM', 'GUITAR', 'KEYBOARD');

WITH homestay_tiers(name, hourly_rate, description) AS (
    VALUES
        ('Standard', 350000::numeric, 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.'),
        ('Deluxe', 550000::numeric, 'Phòng rộng rãi, có ban công và tiện nghi nâng cấp.'),
        ('Family', 750000::numeric, 'Phòng gia đình có không gian sinh hoạt và sức chứa lớn.')
)
INSERT INTO room_tier (name, hourly_rate, description)
SELECT name, hourly_rate, description
FROM homestay_tiers
WHERE NOT EXISTS (SELECT 1 FROM room_tier WHERE room_tier.name = homestay_tiers.name);

UPDATE room
SET room_tier_id = target.id
FROM room_tier current_tier, room_tier target
WHERE room.room_tier_id = current_tier.id
  AND target.name = CASE current_tier.name
      WHEN 'Standard Practice' THEN 'Standard'
      WHEN 'Band Rehearsal' THEN 'Deluxe'
      WHEN 'Recording & Mixing' THEN 'Family'
      WHEN 'Premium Studio' THEN 'Family'
      ELSE current_tier.name
  END
  AND current_tier.name IN ('Standard Practice', 'Band Rehearsal', 'Recording & Mixing', 'Premium Studio');

UPDATE room
SET name = CASE name
    WHEN 'Practice Pod A' THEN 'Standard Garden 101'
    WHEN 'Practice Pod B' THEN 'Standard Garden 102'
    WHEN 'Studio A - Phong Do' THEN 'Deluxe Balcony 201'
    WHEN 'Studio B - Phong Xanh' THEN 'Deluxe City View 202'
    WHEN 'The Vault - Thu am' THEN 'Family Suite 301'
    WHEN 'Amber Live Room' THEN 'Family Garden 302'
    ELSE name
END
WHERE name IN ('Practice Pod A', 'Practice Pod B', 'Studio A - Phong Do', 'Studio B - Phong Xanh', 'The Vault - Thu am', 'Amber Live Room');

DELETE FROM room_tier
WHERE name IN ('Standard Practice', 'Band Rehearsal', 'Recording & Mixing', 'Premium Studio')
  AND NOT EXISTS (SELECT 1 FROM room WHERE room.room_tier_id = room_tier.id);

COMMIT;
