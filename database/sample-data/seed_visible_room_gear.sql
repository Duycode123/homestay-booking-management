BEGIN;

-- Bổ sung các tiện nghi dễ nhận biết trên ảnh/phần mô tả phòng homestay.
WITH visible_amenities(room_name, type, name, status, notes) AS (
    VALUES
        ('Standard Garden 101', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Bộ phát Wi-Fi đặt gần bàn làm việc.'),
        ('Standard Garden 101', 'AIR_CONDITIONER', 'Điều hòa Daikin', 'GOOD', 'Điều hòa hai chiều gắn tường.'),
        ('Standard Garden 102', 'TV', 'Smart TV 43 inch', 'GOOD', 'TV kết nối Internet đối diện giường.'),
        ('Standard Garden 102', 'WATER_HEATER', 'Máy nước nóng Ferroli', 'GOOD', 'Máy nước nóng trong phòng tắm riêng.'),
        ('Deluxe Balcony 201', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Bộ phát Wi-Fi riêng cho phòng Deluxe.'),
        ('Deluxe Balcony 201', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Điều hòa âm trần làm mát đều.'),
        ('Deluxe City View 202', 'TV', 'Smart TV 50 inch', 'GOOD', 'Smart TV hỗ trợ trình chiếu từ điện thoại.'),
        ('Deluxe City View 202', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Thiết bị có chế độ chống giật.'),
        ('Family Suite 301', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng phòng ngủ và phòng khách.'),
        ('Family Suite 301', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực giải trí chung cho gia đình.'),
        ('Family Garden 302', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'MAINTENANCE', 'Một điều hòa đang được bảo trì.'),
        ('Family Garden 302', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Dung tích phù hợp nhóm khách gia đình.')
)
UPDATE equipment
SET type = visible_amenities.type::equipment_type,
    status = visible_amenities.status::equipment_status,
    notes = visible_amenities.notes
FROM visible_amenities
JOIN room ON room.name = visible_amenities.room_name
WHERE equipment.room_id = room.id
  AND equipment.name = visible_amenities.name;

WITH visible_amenities(room_name, type, name, status, notes) AS (
    VALUES
        ('Standard Garden 101', 'WIFI', 'Wi-Fi tốc độ cao', 'GOOD', 'Bộ phát Wi-Fi đặt gần bàn làm việc.'),
        ('Standard Garden 101', 'AIR_CONDITIONER', 'Điều hòa Daikin', 'GOOD', 'Điều hòa hai chiều gắn tường.'),
        ('Standard Garden 102', 'TV', 'Smart TV 43 inch', 'GOOD', 'TV kết nối Internet đối diện giường.'),
        ('Standard Garden 102', 'WATER_HEATER', 'Máy nước nóng Ferroli', 'GOOD', 'Máy nước nóng trong phòng tắm riêng.'),
        ('Deluxe Balcony 201', 'WIFI', 'Wi-Fi 5G', 'GOOD', 'Bộ phát Wi-Fi riêng cho phòng Deluxe.'),
        ('Deluxe Balcony 201', 'AIR_CONDITIONER', 'Điều hòa âm trần', 'GOOD', 'Điều hòa âm trần làm mát đều.'),
        ('Deluxe City View 202', 'TV', 'Smart TV 50 inch', 'GOOD', 'Smart TV hỗ trợ trình chiếu từ điện thoại.'),
        ('Deluxe City View 202', 'WATER_HEATER', 'Máy nước nóng trực tiếp', 'GOOD', 'Thiết bị có chế độ chống giật.'),
        ('Family Suite 301', 'WIFI', 'Wi-Fi gia đình', 'GOOD', 'Phủ sóng phòng ngủ và phòng khách.'),
        ('Family Suite 301', 'TV', 'Smart TV 55 inch', 'GOOD', 'Khu vực giải trí chung cho gia đình.'),
        ('Family Garden 302', 'AIR_CONDITIONER', 'Hai điều hòa inverter', 'MAINTENANCE', 'Một điều hòa đang được bảo trì.'),
        ('Family Garden 302', 'WATER_HEATER', 'Bình nước nóng 30 lít', 'GOOD', 'Dung tích phù hợp nhóm khách gia đình.')
)
INSERT INTO equipment (room_id, type, name, status, notes)
SELECT room.id, visible_amenities.type::equipment_type, visible_amenities.name,
       visible_amenities.status::equipment_status, visible_amenities.notes
FROM visible_amenities
JOIN room ON room.name = visible_amenities.room_name
WHERE NOT EXISTS (
    SELECT 1 FROM equipment
    WHERE equipment.room_id = room.id
      AND equipment.name = visible_amenities.name
);

COMMIT;
