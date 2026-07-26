ALTER TABLE room
    ALTER COLUMN accommodation_type SET DEFAULT 'HOMESTAY';

UPDATE room
SET accommodation_type = 'HOMESTAY';

WITH supported_locations(
    room_name,
    address_line,
    ward,
    district,
    city,
    latitude,
    longitude
) AS (
    VALUES
        ('Standard Garden 101', '54 Ngõ 82 Chùa Láng', 'Láng Thượng', 'Đống Đa', 'Hà Nội', 21.023700::numeric, 105.806900::numeric),
        ('Standard Garden 102', 'Đường Vườn Quốc Gia Ba Vì', 'Tản Lĩnh', 'Ba Vì', 'Hà Nội', 21.098700::numeric, 105.382600::numeric),
        ('Standard Courtyard 103', 'Thôn Lâm Trường', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.305500::numeric, 105.833900::numeric),
        ('Standard Quiet 104', 'Khu nghỉ dưỡng Đồng Mô', 'Sơn Đông', 'Sơn Tây', 'Hà Nội', 21.055500::numeric, 105.430500::numeric),
        ('Deluxe Balcony 201', '12 Phố Cát Linh', 'Cát Linh', 'Đống Đa', 'Hà Nội', 21.027400::numeric, 105.828000::numeric),
        ('Deluxe City View 202', '68 Phố Tây Sơn', 'Quang Trung', 'Đống Đa', 'Hà Nội', 21.010800::numeric, 105.825800::numeric),
        ('Deluxe Garden View 203', 'Thôn Mít Mái', 'Yên Bài', 'Ba Vì', 'Hà Nội', 21.030500::numeric, 105.362500::numeric),
        ('Deluxe Corner 204', 'Đường Thanh Vị', 'Sơn Lộc', 'Sơn Tây', 'Hà Nội', 21.137500::numeric, 105.504000::numeric),
        ('Family Suite 301', 'Thôn Muồng Cháu', 'Vân Hòa', 'Ba Vì', 'Hà Nội', 21.073800::numeric, 105.381800::numeric),
        ('Family Garden 302', 'Thôn Phú Ninh', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.316000::numeric, 105.834000::numeric),
        ('Family Loft 303', 'Khu sinh thái Đồng Mô', 'Sơn Đông', 'Sơn Tây', 'Hà Nội', 21.062500::numeric, 105.446500::numeric),
        ('Family Pool View 304', 'Thôn Lâm Trường', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.301000::numeric, 105.820500::numeric)
)
UPDATE room AS r
SET address_line = supported_locations.address_line,
    ward = supported_locations.ward,
    district = supported_locations.district,
    city = supported_locations.city,
    latitude = supported_locations.latitude,
    longitude = supported_locations.longitude
FROM supported_locations
WHERE r.name = supported_locations.room_name;

ALTER TABLE room
    DROP CONSTRAINT IF EXISTS chk_room_accommodation_type;

ALTER TABLE room
    ADD CONSTRAINT chk_room_accommodation_type
        CHECK (accommodation_type = 'HOMESTAY');

COMMENT ON COLUMN room.accommodation_type IS
    'This project manages homestays only. Room tiers describe Standard, Deluxe, or Family presentation without changing the accommodation type.';
COMMENT ON COLUMN room.district IS
    'Customer catalog scope: Đống Đa, Ba Vì, Sơn Tây, and Sóc Sơn in Hà Nội.';
