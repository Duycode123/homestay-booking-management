ALTER TABLE room
    ADD COLUMN IF NOT EXISTS description VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS accommodation_type VARCHAR(30) NOT NULL DEFAULT 'VILLA',
    ADD COLUMN IF NOT EXISTS address_line VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ward VARCHAR(120),
    ADD COLUMN IF NOT EXISTS district VARCHAR(120),
    ADD COLUMN IF NOT EXISTS city VARCHAR(120) NOT NULL DEFAULT 'Hà Nội',
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6),
    ADD COLUMN IF NOT EXISTS check_in_radius_m INT NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS bathroom_count INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS base_nightly_rate NUMERIC(12,2);

UPDATE room AS r
SET description = COALESCE(r.description, rt.description),
    base_nightly_rate = COALESCE(r.base_nightly_rate, rt.hourly_rate * 22)
FROM room_tier AS rt
WHERE rt.id = r.room_tier_id;

WITH demo_locations(
    room_name,
    accommodation_type,
    address_line,
    ward,
    district,
    city,
    latitude,
    longitude,
    bathroom_count,
    nightly_rate
) AS (
    VALUES
        ('Standard Garden 101', 'APARTMENT', 'CT8B Khu Đô Thị Dương Nội, Yên Lộ', 'Dương Nội', 'Hà Đông', 'Hà Nội', 20.962536::numeric, 105.745203::numeric, 2, 2200000.00::numeric),
        ('Standard Garden 102', 'GARDEN_HOUSE', 'Đường Vườn Quốc Gia Ba Vì', 'Tản Lĩnh', 'Ba Vì', 'Hà Nội', 21.098700::numeric, 105.382600::numeric, 1, 2200000.00::numeric),
        ('Standard Courtyard 103', 'HOMESTAY', 'Thôn Lâm Trường', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.305500::numeric, 105.833900::numeric, 1, 2200000.00::numeric),
        ('Standard Quiet 104', 'APARTMENT', 'Phố Quảng Khánh', 'Quảng An', 'Tây Hồ', 'Hà Nội', 21.066200::numeric, 105.826300::numeric, 1, 2200000.00::numeric),
        ('Deluxe Balcony 201', 'APARTMENT', 'Đường Hồng Tiến', 'Bồ Đề', 'Long Biên', 'Hà Nội', 21.046600::numeric, 105.873600::numeric, 2, 3300000.00::numeric),
        ('Deluxe City View 202', 'APARTMENT', 'Phố Hàng Vôi', 'Lý Thái Tổ', 'Hoàn Kiếm', 'Hà Nội', 21.027800::numeric, 105.852300::numeric, 1, 3300000.00::numeric),
        ('Deluxe Garden View 203', 'GARDEN_HOUSE', 'Đường Đa Tốn', 'Đa Tốn', 'Gia Lâm', 'Hà Nội', 20.995800::numeric, 105.944600::numeric, 2, 3300000.00::numeric),
        ('Deluxe Corner 204', 'APARTMENT', 'Đường Võ Chí Công', 'Xuân La', 'Tây Hồ', 'Hà Nội', 21.066900::numeric, 105.802800::numeric, 2, 3300000.00::numeric),
        ('Family Suite 301', 'VILLA', 'Thôn Muồng Cháu', 'Vân Hòa', 'Ba Vì', 'Hà Nội', 21.073800::numeric, 105.381800::numeric, 3, 4400000.00::numeric),
        ('Family Garden 302', 'VILLA', 'Thôn Phú Ninh', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.316000::numeric, 105.834000::numeric, 3, 4400000.00::numeric),
        ('Family Loft 303', 'BUNGALOW', 'Khu sinh thái Đồng Mô', 'Sơn Đông', 'Sơn Tây', 'Hà Nội', 21.055500::numeric, 105.430500::numeric, 2, 4400000.00::numeric),
        ('Family Pool View 304', 'VILLA', 'Đường Võ Nguyên Giáp', 'Vĩnh Ngọc', 'Đông Anh', 'Hà Nội', 21.137000::numeric, 105.853000::numeric, 3, 4400000.00::numeric)
)
UPDATE room AS r
SET accommodation_type = demo_locations.accommodation_type,
    address_line = demo_locations.address_line,
    ward = demo_locations.ward,
    district = demo_locations.district,
    city = demo_locations.city,
    latitude = demo_locations.latitude,
    longitude = demo_locations.longitude,
    bathroom_count = demo_locations.bathroom_count,
    base_nightly_rate = demo_locations.nightly_rate
FROM demo_locations
WHERE r.name = demo_locations.room_name;

ALTER TABLE room
    ALTER COLUMN base_nightly_rate SET NOT NULL,
    DROP CONSTRAINT IF EXISTS chk_room_accommodation_type,
    DROP CONSTRAINT IF EXISTS chk_room_coordinate_pair,
    DROP CONSTRAINT IF EXISTS chk_room_latitude_range,
    DROP CONSTRAINT IF EXISTS chk_room_longitude_range,
    DROP CONSTRAINT IF EXISTS chk_room_check_in_radius_range,
    DROP CONSTRAINT IF EXISTS chk_room_bathroom_count_range,
    DROP CONSTRAINT IF EXISTS chk_room_base_nightly_rate_positive;

ALTER TABLE room
    ADD CONSTRAINT chk_room_accommodation_type
        CHECK (accommodation_type IN ('VILLA', 'GARDEN_HOUSE', 'BUNGALOW', 'APARTMENT', 'HOMESTAY')),
    ADD CONSTRAINT chk_room_coordinate_pair
        CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
    ADD CONSTRAINT chk_room_latitude_range
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    ADD CONSTRAINT chk_room_longitude_range
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    ADD CONSTRAINT chk_room_check_in_radius_range
        CHECK (check_in_radius_m BETWEEN 20 AND 1000),
    ADD CONSTRAINT chk_room_bathroom_count_range
        CHECK (bathroom_count BETWEEN 1 AND 20),
    ADD CONSTRAINT chk_room_base_nightly_rate_positive
        CHECK (base_nightly_rate > 0);

CREATE INDEX IF NOT EXISTS idx_room_district_status
    ON room (district, status);

CREATE INDEX IF NOT EXISTS idx_room_coordinates
    ON room (latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON TABLE room IS
    'Each row is one independently bookable whole accommodation at one physical location. Bedrooms are descriptive and are never booked separately.';
COMMENT ON COLUMN room.base_nightly_rate IS
    'Whole-unit price for one calendar night, from 14:00 check-in to 12:00 check-out the next day.';
COMMENT ON COLUMN room.check_in_radius_m IS
    'Allowed GPS distance from the accommodation marker for staff attendance.';
