BEGIN;

-- Dữ liệu mẫu cho hệ thống quản lý đặt phòng homestay.
-- Áp dụng migrations trước khi chạy file này.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room_tier')
       OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'room')
       OR NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'equipment') THEN
        RAISE EXCEPTION 'Missing room_tier, room, or equipment table. Apply database migrations first.';
    END IF;
END
$$;

WITH sample_room_tiers(name, hourly_rate, description) AS (
    VALUES
        ('Standard', 100000.00::numeric, 'Căn lưu trú ấm cúng cho 1-2 khách với đầy đủ tiện nghi thiết yếu.'),
        ('Deluxe', 150000.00::numeric, 'Căn rộng rãi cho 2-4 khách với không gian riêng, tầm nhìn đẹp và tiện nghi nâng cấp.'),
        ('Family', 200000.00::numeric, 'Căn nguyên căn cho 4-6 khách, có khu sinh hoạt chung và tiện nghi phù hợp lưu trú theo nhóm.')
)
UPDATE room_tier
SET hourly_rate = sample_room_tiers.hourly_rate,
    description = sample_room_tiers.description
FROM sample_room_tiers
WHERE room_tier.name = sample_room_tiers.name;

WITH sample_room_tiers(name, hourly_rate, description) AS (
    VALUES
        ('Standard', 100000.00::numeric, 'Căn lưu trú ấm cúng cho 1-2 khách với đầy đủ tiện nghi thiết yếu.'),
        ('Deluxe', 150000.00::numeric, 'Căn rộng rãi cho 2-4 khách với không gian riêng, tầm nhìn đẹp và tiện nghi nâng cấp.'),
        ('Family', 200000.00::numeric, 'Căn nguyên căn cho 4-6 khách, có khu sinh hoạt chung và tiện nghi phù hợp lưu trú theo nhóm.')
)
INSERT INTO room_tier (name, hourly_rate, description)
SELECT name, hourly_rate, description
FROM sample_room_tiers
WHERE NOT EXISTS (SELECT 1 FROM room_tier WHERE room_tier.name = sample_room_tiers.name);

WITH sample_rooms(name, tier_name, status, max_people) AS (
    VALUES
        ('Standard Garden 101', 'Standard', 'AVAILABLE', 2),
        ('Standard Garden 102', 'Standard', 'AVAILABLE', 2),
        ('Standard Courtyard 103', 'Standard', 'AVAILABLE', 2),
        ('Standard Quiet 104', 'Standard', 'AVAILABLE', 2),
        ('Deluxe Balcony 201', 'Deluxe', 'AVAILABLE', 3),
        ('Deluxe City View 202', 'Deluxe', 'IN_USE', 3),
        ('Deluxe Garden View 203', 'Deluxe', 'AVAILABLE', 3),
        ('Deluxe Corner 204', 'Deluxe', 'AVAILABLE', 4),
        ('Family Suite 301', 'Family', 'AVAILABLE', 6),
        ('Family Garden 302', 'Family', 'MAINTENANCE', 5),
        ('Family Loft 303', 'Family', 'AVAILABLE', 5),
        ('Family Pool View 304', 'Family', 'AVAILABLE', 6)
)
UPDATE room
SET room_tier_id = room_tier.id,
    status = sample_rooms.status::room_status,
    max_people = sample_rooms.max_people,
    base_nightly_rate = room_tier.hourly_rate * 22
FROM sample_rooms
JOIN room_tier ON room_tier.name = sample_rooms.tier_name
WHERE room.name = sample_rooms.name;

WITH sample_rooms(name, tier_name, status, max_people) AS (
    VALUES
        ('Standard Garden 101', 'Standard', 'AVAILABLE', 2),
        ('Standard Garden 102', 'Standard', 'AVAILABLE', 2),
        ('Standard Courtyard 103', 'Standard', 'AVAILABLE', 2),
        ('Standard Quiet 104', 'Standard', 'AVAILABLE', 2),
        ('Deluxe Balcony 201', 'Deluxe', 'AVAILABLE', 3),
        ('Deluxe City View 202', 'Deluxe', 'IN_USE', 3),
        ('Deluxe Garden View 203', 'Deluxe', 'AVAILABLE', 3),
        ('Deluxe Corner 204', 'Deluxe', 'AVAILABLE', 4),
        ('Family Suite 301', 'Family', 'AVAILABLE', 6),
        ('Family Garden 302', 'Family', 'MAINTENANCE', 5),
        ('Family Loft 303', 'Family', 'AVAILABLE', 5),
        ('Family Pool View 304', 'Family', 'AVAILABLE', 6)
)
INSERT INTO room (name, room_tier_id, status, max_people, base_nightly_rate)
SELECT sample_rooms.name,
       room_tier.id,
       sample_rooms.status::room_status,
       sample_rooms.max_people,
       room_tier.hourly_rate * 22
FROM sample_rooms
JOIN room_tier ON room_tier.name = sample_rooms.tier_name
WHERE NOT EXISTS (SELECT 1 FROM room WHERE room.name = sample_rooms.name);

WITH sample_locations(
    room_name,
    accommodation_type,
    address_line,
    ward,
    district,
    city,
    latitude,
    longitude,
    bedroom_count,
    bed_count,
    bathroom_count
) AS (
    VALUES
        ('Standard Garden 101', 'HOMESTAY', '54 Ngõ 82 Chùa Láng', 'Láng Thượng', 'Đống Đa', 'Hà Nội', 21.023700::numeric, 105.806900::numeric, 1, 1, 2),
        ('Standard Garden 102', 'HOMESTAY', 'Đường Vườn Quốc Gia Ba Vì', 'Tản Lĩnh', 'Ba Vì', 'Hà Nội', 21.098700::numeric, 105.382600::numeric, 1, 1, 1),
        ('Standard Courtyard 103', 'HOMESTAY', 'Thôn Lâm Trường', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.305500::numeric, 105.833900::numeric, 1, 1, 1),
        ('Standard Quiet 104', 'HOMESTAY', 'Khu nghỉ dưỡng Đồng Mô', 'Sơn Đông', 'Sơn Tây', 'Hà Nội', 21.055500::numeric, 105.430500::numeric, 1, 1, 1),
        ('Deluxe Balcony 201', 'HOMESTAY', '12 Phố Cát Linh', 'Cát Linh', 'Đống Đa', 'Hà Nội', 21.027400::numeric, 105.828000::numeric, 2, 2, 2),
        ('Deluxe City View 202', 'HOMESTAY', '68 Phố Tây Sơn', 'Quang Trung', 'Đống Đa', 'Hà Nội', 21.010800::numeric, 105.825800::numeric, 2, 2, 1),
        ('Deluxe Garden View 203', 'HOMESTAY', 'Thôn Mít Mái', 'Yên Bài', 'Ba Vì', 'Hà Nội', 21.030500::numeric, 105.362500::numeric, 2, 2, 2),
        ('Deluxe Corner 204', 'HOMESTAY', 'Đường Thanh Vị', 'Sơn Lộc', 'Sơn Tây', 'Hà Nội', 21.137500::numeric, 105.504000::numeric, 2, 2, 2),
        ('Family Suite 301', 'HOMESTAY', 'Thôn Muồng Cháu', 'Vân Hòa', 'Ba Vì', 'Hà Nội', 21.073800::numeric, 105.381800::numeric, 3, 3, 3),
        ('Family Garden 302', 'HOMESTAY', 'Thôn Phú Ninh', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.316000::numeric, 105.834000::numeric, 3, 3, 3),
        ('Family Loft 303', 'HOMESTAY', 'Khu sinh thái Đồng Mô', 'Sơn Đông', 'Sơn Tây', 'Hà Nội', 21.062500::numeric, 105.446500::numeric, 3, 3, 2),
        ('Family Pool View 304', 'HOMESTAY', 'Thôn Lâm Trường', 'Minh Phú', 'Sóc Sơn', 'Hà Nội', 21.301000::numeric, 105.820500::numeric, 3, 3, 3)
)
UPDATE room
SET accommodation_type = sample_locations.accommodation_type,
    address_line = sample_locations.address_line,
    ward = sample_locations.ward,
    district = sample_locations.district,
    city = sample_locations.city,
    latitude = sample_locations.latitude,
    longitude = sample_locations.longitude,
    bedroom_count = sample_locations.bedroom_count,
    bed_count = sample_locations.bed_count,
    bathroom_count = sample_locations.bathroom_count,
    check_in_radius_m = 100
FROM sample_locations
WHERE room.name = sample_locations.room_name;

WITH sample_amenities(room_name, type, name, status, notes) AS (
    VALUES
        ('Standard Garden 101', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Kết nối ổn định trong toàn bộ phòng.'),
        ('Standard Garden 101', 'AIR_CONDITIONER', 'Điều hòa Daikin', 'GOOD', 'Điều hòa hai chiều có điều khiển.'),
        ('Standard Garden 101', 'TV', 'Smart TV 43 inch', 'GOOD', 'Có YouTube và các ứng dụng giải trí.'),
        ('Standard Garden 101', 'WATER_HEATER', 'Máy nước nóng Ariston', 'GOOD', 'Máy nước nóng riêng trong phòng tắm.'),

        ('Standard Garden 102', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Mạng Wi-Fi dành riêng cho khách lưu trú.'),
        ('Standard Garden 102', 'AIR_CONDITIONER', 'Điều hòa Panasonic', 'GOOD', 'Làm lạnh nhanh và tiết kiệm điện.'),
        ('Standard Garden 102', 'TV', 'Smart TV 43 inch', 'GOOD', 'TV kết nối Internet.'),
        ('Standard Garden 102', 'WATER_HEATER', 'Máy nước nóng Ferroli', 'GOOD', 'Đã kiểm tra an toàn điện.'),

        ('Standard Courtyard 103', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Phủ sóng ổn định tới khu vực sân trong.'),
        ('Standard Courtyard 103', 'AIR_CONDITIONER', 'Điều hòa LG inverter', 'GOOD', 'Tiết kiệm điện và vận hành êm.'),
        ('Standard Courtyard 103', 'TV', 'Smart TV 43 inch', 'GOOD', 'Có sẵn các ứng dụng xem phim.'),
        ('Standard Courtyard 103', 'WATER_HEATER', 'Máy nước nóng Ariston', 'GOOD', 'Đã kiểm tra chống rò điện.'),

        ('Standard Quiet 104', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Đường truyền riêng ổn định.'),
        ('Standard Quiet 104', 'AIR_CONDITIONER', 'Điều hòa Panasonic inverter', 'GOOD', 'Độ ồn thấp, phù hợp nghỉ ngơi.'),
        ('Standard Quiet 104', 'TV', 'Smart TV 43 inch', 'GOOD', 'Hỗ trợ trình chiếu từ điện thoại.'),
        ('Standard Quiet 104', 'WATER_HEATER', 'Máy nước nóng Ferroli', 'GOOD', 'Cấp nước nóng nhanh.'),

        ('Deluxe Balcony 201', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Phù hợp làm việc từ xa.'),
        ('Deluxe Balcony 201', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Làm mát đều toàn phòng.'),
        ('Deluxe Balcony 201', 'TV', 'Smart TV 50 inch', 'GOOD', 'TV màn hình lớn đối diện giường.'),
        ('Deluxe Balcony 201', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Cấp nước nóng liên tục.'),

        ('Deluxe City View 202', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Tín hiệu mạnh tại bàn làm việc.'),
        ('Deluxe City View 202', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Vệ sinh định kỳ hàng tháng.'),
        ('Deluxe City View 202', 'TV', 'Smart TV 50 inch', 'GOOD', 'Hỗ trợ trình chiếu từ điện thoại.'),
        ('Deluxe City View 202', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Có chế độ chống giật.'),

        ('Deluxe Garden View 203', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Tín hiệu ổn định tại ban công và bàn làm việc.'),
        ('Deluxe Garden View 203', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Làm mát đều và vận hành êm.'),
        ('Deluxe Garden View 203', 'TV', 'Smart TV 50 inch', 'GOOD', 'Màn hình 4K kết nối Internet.'),
        ('Deluxe Garden View 203', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Có chế độ điều chỉnh nhiệt độ.'),

        ('Deluxe Corner 204', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Phù hợp làm việc và gọi video.'),
        ('Deluxe Corner 204', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Đã vệ sinh và bảo dưỡng định kỳ.'),
        ('Deluxe Corner 204', 'TV', 'Smart TV 50 inch', 'GOOD', 'Có Netflix và YouTube.'),
        ('Deluxe Corner 204', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Cấp nước nóng liên tục.'),

        ('Family Suite 301', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng cả phòng ngủ và phòng khách.'),
        ('Family Suite 301', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Điều hòa riêng cho hai khu vực.'),
        ('Family Suite 301', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực giải trí chung cho gia đình.'),
        ('Family Suite 301', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đủ nhu cầu cho nhóm khách gia đình.'),

        ('Family Garden 302', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Có bộ mở rộng sóng ra khu vườn.'),
        ('Family Garden 302', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'MAINTENANCE', 'Một thiết bị đang được bảo trì.'),
        ('Family Garden 302', 'TV', 'Smart TV 55 inch', 'GOOD', 'Có kho ứng dụng giải trí.'),
        ('Family Garden 302', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Bình nước nóng dung tích lớn.'),

        ('Family Loft 303', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng cả tầng dưới và gác lửng.'),
        ('Family Loft 303', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Điều hòa riêng cho phòng ngủ và phòng khách.'),
        ('Family Loft 303', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực xem phim chung cho gia đình.'),
        ('Family Loft 303', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đáp ứng nhóm tối đa 5 khách.'),

        ('Family Pool View 304', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Tín hiệu ổn định trong toàn bộ phòng.'),
        ('Family Pool View 304', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Làm mát độc lập cho hai khu vực.'),
        ('Family Pool View 304', 'TV', 'Smart TV 55 inch', 'GOOD', 'Hỗ trợ giải trí và trình chiếu.'),
        ('Family Pool View 304', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đủ nước nóng cho nhóm 6 khách.')
)
UPDATE equipment
SET type = sample_amenities.type::equipment_type,
    status = sample_amenities.status::equipment_status,
    notes = sample_amenities.notes
FROM sample_amenities
JOIN room ON room.name = sample_amenities.room_name
WHERE equipment.room_id = room.id
  AND equipment.name = sample_amenities.name;

WITH sample_amenities(room_name, type, name, status, notes) AS (
    VALUES
        ('Standard Garden 101', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Kết nối ổn định trong toàn bộ phòng.'),
        ('Standard Garden 101', 'AIR_CONDITIONER', 'Điều hòa Daikin', 'GOOD', 'Điều hòa hai chiều có điều khiển.'),
        ('Standard Garden 101', 'TV', 'Smart TV 43 inch', 'GOOD', 'Có YouTube và các ứng dụng giải trí.'),
        ('Standard Garden 101', 'WATER_HEATER', 'Máy nước nóng Ariston', 'GOOD', 'Máy nước nóng riêng trong phòng tắm.'),
        ('Standard Garden 102', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Mạng Wi-Fi dành riêng cho khách lưu trú.'),
        ('Standard Garden 102', 'AIR_CONDITIONER', 'Điều hòa Panasonic', 'GOOD', 'Làm lạnh nhanh và tiết kiệm điện.'),
        ('Standard Garden 102', 'TV', 'Smart TV 43 inch', 'GOOD', 'TV kết nối Internet.'),
        ('Standard Garden 102', 'WATER_HEATER', 'Máy nước nóng Ferroli', 'GOOD', 'Đã kiểm tra an toàn điện.'),
        ('Standard Courtyard 103', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Phủ sóng ổn định tới khu vực sân trong.'),
        ('Standard Courtyard 103', 'AIR_CONDITIONER', 'Điều hòa LG inverter', 'GOOD', 'Tiết kiệm điện và vận hành êm.'),
        ('Standard Courtyard 103', 'TV', 'Smart TV 43 inch', 'GOOD', 'Có sẵn các ứng dụng xem phim.'),
        ('Standard Courtyard 103', 'WATER_HEATER', 'Máy nước nóng Ariston', 'GOOD', 'Đã kiểm tra chống rò điện.'),
        ('Standard Quiet 104', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Đường truyền riêng ổn định.'),
        ('Standard Quiet 104', 'AIR_CONDITIONER', 'Điều hòa Panasonic inverter', 'GOOD', 'Độ ồn thấp, phù hợp nghỉ ngơi.'),
        ('Standard Quiet 104', 'TV', 'Smart TV 43 inch', 'GOOD', 'Hỗ trợ trình chiếu từ điện thoại.'),
        ('Standard Quiet 104', 'WATER_HEATER', 'Máy nước nóng Ferroli', 'GOOD', 'Cấp nước nóng nhanh.'),
        ('Deluxe Balcony 201', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Phù hợp làm việc từ xa.'),
        ('Deluxe Balcony 201', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Làm mát đều toàn phòng.'),
        ('Deluxe Balcony 201', 'TV', 'Smart TV 50 inch', 'GOOD', 'TV màn hình lớn đối diện giường.'),
        ('Deluxe Balcony 201', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Cấp nước nóng liên tục.'),
        ('Deluxe City View 202', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Tín hiệu mạnh tại bàn làm việc.'),
        ('Deluxe City View 202', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Vệ sinh định kỳ hàng tháng.'),
        ('Deluxe City View 202', 'TV', 'Smart TV 50 inch', 'GOOD', 'Hỗ trợ trình chiếu từ điện thoại.'),
        ('Deluxe City View 202', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Có chế độ chống giật.'),
        ('Deluxe Garden View 203', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Tín hiệu ổn định tại ban công và bàn làm việc.'),
        ('Deluxe Garden View 203', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Làm mát đều và vận hành êm.'),
        ('Deluxe Garden View 203', 'TV', 'Smart TV 50 inch', 'GOOD', 'Màn hình 4K kết nối Internet.'),
        ('Deluxe Garden View 203', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Có chế độ điều chỉnh nhiệt độ.'),
        ('Deluxe Corner 204', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Phù hợp làm việc và gọi video.'),
        ('Deluxe Corner 204', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Đã vệ sinh và bảo dưỡng định kỳ.'),
        ('Deluxe Corner 204', 'TV', 'Smart TV 50 inch', 'GOOD', 'Có Netflix và YouTube.'),
        ('Deluxe Corner 204', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Cấp nước nóng liên tục.'),
        ('Family Suite 301', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng cả phòng ngủ và phòng khách.'),
        ('Family Suite 301', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Điều hòa riêng cho hai khu vực.'),
        ('Family Suite 301', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực giải trí chung cho gia đình.'),
        ('Family Suite 301', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đủ nhu cầu cho nhóm khách gia đình.'),
        ('Family Garden 302', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Có bộ mở rộng sóng ra khu vườn.'),
        ('Family Garden 302', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'MAINTENANCE', 'Một thiết bị đang được bảo trì.'),
        ('Family Garden 302', 'TV', 'Smart TV 55 inch', 'GOOD', 'Có kho ứng dụng giải trí.'),
        ('Family Garden 302', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Bình nước nóng dung tích lớn.'),
        ('Family Loft 303', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng cả tầng dưới và gác lửng.'),
        ('Family Loft 303', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Điều hòa riêng cho phòng ngủ và phòng khách.'),
        ('Family Loft 303', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực xem phim chung cho gia đình.'),
        ('Family Loft 303', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đáp ứng nhóm tối đa 5 khách.'),
        ('Family Pool View 304', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Tín hiệu ổn định trong toàn bộ phòng.'),
        ('Family Pool View 304', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Làm mát độc lập cho hai khu vực.'),
        ('Family Pool View 304', 'TV', 'Smart TV 55 inch', 'GOOD', 'Hỗ trợ giải trí và trình chiếu.'),
        ('Family Pool View 304', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đủ nước nóng cho nhóm 6 khách.')
)
INSERT INTO equipment (room_id, type, name, status, notes)
SELECT room.id, sample_amenities.type::equipment_type, sample_amenities.name,
       sample_amenities.status::equipment_status, sample_amenities.notes
FROM sample_amenities
JOIN room ON room.name = sample_amenities.room_name
WHERE NOT EXISTS (
    SELECT 1 FROM equipment
    WHERE equipment.room_id = room.id
      AND equipment.name = sample_amenities.name
);

-- Tiện nghi bổ sung theo hạng phòng. Dùng OTHER vì tên cụ thể mới là thông tin
-- khách nhìn thấy, đồng thời không cần mở rộng PostgreSQL enum cho từng vật dụng.
WITH tier_amenities(tier_name, name, notes) AS (
    VALUES
        ('Standard', 'Tủ lạnh mini', 'Tủ lạnh mini dùng để bảo quản đồ uống và thực phẩm nhẹ.'),
        ('Standard', 'Ấm đun nước', 'Ấm siêu tốc kèm cốc uống nước.'),
        ('Standard', 'Máy sấy tóc', 'Máy sấy tóc đặt trong phòng tắm.'),
        ('Standard', 'Bàn làm việc', 'Bàn làm việc nhỏ có ổ cắm điện thuận tiện.'),

        ('Deluxe', 'Tủ lạnh mini', 'Tủ lạnh mini dung tích lớn hơn cho kỳ nghỉ dài.'),
        ('Deluxe', 'Minibar chào mừng', 'Nước suối, trà và cà phê được chuẩn bị sẵn.'),
        ('Deluxe', 'Máy sấy tóc công suất cao', 'Máy sấy tóc nhiều chế độ.'),
        ('Deluxe', 'Bàn làm việc và ghế lounge', 'Không gian riêng để làm việc hoặc thư giãn.'),
        ('Deluxe', 'Két an toàn', 'Két điện tử bảo quản tài sản cá nhân.'),
        ('Deluxe', 'Áo choàng tắm', 'Áo choàng và dép đi trong phòng cho khách.'),

        ('Family', 'Tủ lạnh gia đình', 'Tủ lạnh dung tích lớn phù hợp nhóm khách.'),
        ('Family', 'Bàn ăn gia đình', 'Bàn ăn và ghế cho cả nhóm.'),
        ('Family', 'Lò vi sóng', 'Lò vi sóng phục vụ hâm nóng thức ăn.'),
        ('Family', 'Bộ ấm chén và dụng cụ ăn uống', 'Dụng cụ cơ bản cho sinh hoạt gia đình.'),
        ('Family', 'Khu vui chơi trẻ em', 'Góc vui chơi nhỏ với đồ chơi an toàn.'),
        ('Family', 'Nôi trẻ em theo yêu cầu', 'Nôi trẻ em được chuẩn bị khi khách yêu cầu trước.')
)
INSERT INTO equipment (room_id, type, name, status, notes)
SELECT room.id, 'OTHER'::equipment_type, tier_amenities.name, 'GOOD'::equipment_status, tier_amenities.notes
FROM tier_amenities
JOIN room_tier ON room_tier.name = tier_amenities.tier_name
JOIN room ON room.room_tier_id = room_tier.id
WHERE NOT EXISTS (
    SELECT 1
    FROM equipment
    WHERE equipment.room_id = room.id
      AND equipment.name = tier_amenities.name
);

COMMIT;
