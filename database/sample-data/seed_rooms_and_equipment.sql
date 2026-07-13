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
        ('Standard', 350000.00::numeric, 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.'),
        ('Deluxe', 550000.00::numeric, 'Phòng rộng rãi, có ban công và tiện nghi nâng cấp.'),
        ('Family', 750000.00::numeric, 'Phòng gia đình có không gian sinh hoạt và sức chứa lớn.')
)
UPDATE room_tier
SET hourly_rate = sample_room_tiers.hourly_rate,
    description = sample_room_tiers.description
FROM sample_room_tiers
WHERE room_tier.name = sample_room_tiers.name;

WITH sample_room_tiers(name, hourly_rate, description) AS (
    VALUES
        ('Standard', 350000.00::numeric, 'Phòng tiện nghi cơ bản, phù hợp cho 1-2 khách.'),
        ('Deluxe', 550000.00::numeric, 'Phòng rộng rãi, có ban công và tiện nghi nâng cấp.'),
        ('Family', 750000.00::numeric, 'Phòng gia đình có không gian sinh hoạt và sức chứa lớn.')
)
INSERT INTO room_tier (name, hourly_rate, description)
SELECT name, hourly_rate, description
FROM sample_room_tiers
WHERE NOT EXISTS (SELECT 1 FROM room_tier WHERE room_tier.name = sample_room_tiers.name);

WITH sample_rooms(name, tier_name, status, max_people) AS (
    VALUES
        ('Standard Garden 101', 'Standard', 'AVAILABLE', 2),
        ('Standard Garden 102', 'Standard', 'AVAILABLE', 2),
        ('Deluxe Balcony 201', 'Deluxe', 'AVAILABLE', 3),
        ('Deluxe City View 202', 'Deluxe', 'IN_USE', 3),
        ('Family Suite 301', 'Family', 'AVAILABLE', 6),
        ('Family Garden 302', 'Family', 'MAINTENANCE', 5)
)
UPDATE room
SET room_tier_id = room_tier.id,
    status = sample_rooms.status::room_status,
    max_people = sample_rooms.max_people
FROM sample_rooms
JOIN room_tier ON room_tier.name = sample_rooms.tier_name
WHERE room.name = sample_rooms.name;

WITH sample_rooms(name, tier_name, status, max_people) AS (
    VALUES
        ('Standard Garden 101', 'Standard', 'AVAILABLE', 2),
        ('Standard Garden 102', 'Standard', 'AVAILABLE', 2),
        ('Deluxe Balcony 201', 'Deluxe', 'AVAILABLE', 3),
        ('Deluxe City View 202', 'Deluxe', 'IN_USE', 3),
        ('Family Suite 301', 'Family', 'AVAILABLE', 6),
        ('Family Garden 302', 'Family', 'MAINTENANCE', 5)
)
INSERT INTO room (name, room_tier_id, status, max_people)
SELECT sample_rooms.name, room_tier.id, sample_rooms.status::room_status, sample_rooms.max_people
FROM sample_rooms
JOIN room_tier ON room_tier.name = sample_rooms.tier_name
WHERE NOT EXISTS (SELECT 1 FROM room WHERE room.name = sample_rooms.name);

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

        ('Deluxe Balcony 201', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Phù hợp làm việc từ xa.'),
        ('Deluxe Balcony 201', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Làm mát đều toàn phòng.'),
        ('Deluxe Balcony 201', 'TV', 'Smart TV 50 inch', 'GOOD', 'TV màn hình lớn đối diện giường.'),
        ('Deluxe Balcony 201', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Cấp nước nóng liên tục.'),

        ('Deluxe City View 202', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Tín hiệu mạnh tại bàn làm việc.'),
        ('Deluxe City View 202', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Vệ sinh định kỳ hàng tháng.'),
        ('Deluxe City View 202', 'TV', 'Smart TV 50 inch', 'GOOD', 'Hỗ trợ trình chiếu từ điện thoại.'),
        ('Deluxe City View 202', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Có chế độ chống giật.'),

        ('Family Suite 301', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng cả phòng ngủ và phòng khách.'),
        ('Family Suite 301', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Điều hòa riêng cho hai khu vực.'),
        ('Family Suite 301', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực giải trí chung cho gia đình.'),
        ('Family Suite 301', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đủ nhu cầu cho nhóm khách gia đình.'),

        ('Family Garden 302', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Có bộ mở rộng sóng ra khu vườn.'),
        ('Family Garden 302', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'MAINTENANCE', 'Một thiết bị đang được bảo trì.'),
        ('Family Garden 302', 'TV', 'Smart TV 55 inch', 'GOOD', 'Có kho ứng dụng giải trí.'),
        ('Family Garden 302', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Bình nước nóng dung tích lớn.')
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
        ('Deluxe Balcony 201', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Phù hợp làm việc từ xa.'),
        ('Deluxe Balcony 201', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Làm mát đều toàn phòng.'),
        ('Deluxe Balcony 201', 'TV', 'Smart TV 50 inch', 'GOOD', 'TV màn hình lớn đối diện giường.'),
        ('Deluxe Balcony 201', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Cấp nước nóng liên tục.'),
        ('Deluxe City View 202', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Tín hiệu mạnh tại bàn làm việc.'),
        ('Deluxe City View 202', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Vệ sinh định kỳ hàng tháng.'),
        ('Deluxe City View 202', 'TV', 'Smart TV 50 inch', 'GOOD', 'Hỗ trợ trình chiếu từ điện thoại.'),
        ('Deluxe City View 202', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Có chế độ chống giật.'),
        ('Family Suite 301', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng cả phòng ngủ và phòng khách.'),
        ('Family Suite 301', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'GOOD', 'Điều hòa riêng cho hai khu vực.'),
        ('Family Suite 301', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực giải trí chung cho gia đình.'),
        ('Family Suite 301', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Đủ nhu cầu cho nhóm khách gia đình.'),
        ('Family Garden 302', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Có bộ mở rộng sóng ra khu vườn.'),
        ('Family Garden 302', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'MAINTENANCE', 'Một thiết bị đang được bảo trì.'),
        ('Family Garden 302', 'TV', 'Smart TV 55 inch', 'GOOD', 'Có kho ứng dụng giải trí.'),
        ('Family Garden 302', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Bình nước nóng dung tích lớn.')
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

COMMIT;
