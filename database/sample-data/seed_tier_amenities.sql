BEGIN;

-- Bổ sung tiện nghi theo hạng phòng mà không thay đổi giá, trạng thái hay ảnh phòng.
-- Có thể chạy lại an toàn: mỗi tiện nghi chỉ được thêm khi (room_id, name) chưa tồn tại.
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
