-- Seed operational room amenities once through Flyway.
-- These are normal equipment rows: administrators can edit or delete them later.
-- They must not be recreated by a runtime initializer after an administrator removes one.

WITH private_amenities(room_name, equipment_type, equipment_name, equipment_status, notes) AS (
    VALUES
        ('Standard Garden 101', 'OTHER', 'Ấm đun nước', 'GOOD',
         'Ấm đun nước và bộ ly dùng riêng trong phòng.'),
        ('Standard Garden 101', 'OTHER', 'Bàn làm việc', 'GOOD',
         'Bàn làm việc nhỏ có ổ cắm điện thuận tiện.'),
        ('Standard Garden 101', 'OTHER', 'Máy sấy tóc', 'GOOD',
         'Máy sấy tóc được bố trí trong khu vực phòng tắm.'),

        ('Standard Garden 102', 'OTHER', 'Ghế thư giãn cạnh cửa sổ', 'GOOD',
         'Góc ngồi thư giãn nhìn ra khu vườn.'),
        ('Standard Garden 102', 'OTHER', 'Minibar cơ bản', 'GOOD',
         'Tủ minibar nhỏ để bảo quản đồ uống cá nhân.'),
        ('Standard Garden 102', 'OTHER', 'Két an toàn', 'GOOD',
         'Két điện tử dùng để bảo quản tài sản cá nhân.'),

        ('Standard Courtyard 103', 'OTHER', 'Bàn trà cạnh sân trong', 'GOOD',
         'Bàn trà riêng hướng ra khu vực sân trong.'),
        ('Standard Courtyard 103', 'OTHER', 'Gương toàn thân', 'GOOD',
         'Gương toàn thân đặt gần khu vực thay đồ.'),
        ('Standard Courtyard 103', 'OTHER', 'Giá treo hành lý', 'GOOD',
         'Kệ riêng giúp sắp xếp vali và hành lý gọn gàng.'),

        ('Standard Quiet 104', 'OTHER', 'Rèm cản sáng', 'GOOD',
         'Rèm cản sáng hỗ trợ không gian nghỉ ngơi yên tĩnh.'),
        ('Standard Quiet 104', 'OTHER', 'Đèn đọc sách đầu giường', 'GOOD',
         'Đèn đọc sách riêng với ánh sáng dịu.'),
        ('Standard Quiet 104', 'OTHER', 'Bộ trà thảo mộc', 'GOOD',
         'Bộ trà chào mừng phù hợp với không gian nghỉ dưỡng.'),

        ('Deluxe Balcony 201', 'OTHER', 'Ban công riêng', 'GOOD',
         'Ban công riêng có khu vực ngồi ngắm cảnh.'),
        ('Deluxe Balcony 201', 'OTHER', 'Bàn trà ngoài ban công', 'GOOD',
         'Bàn trà hai chỗ ngồi bố trí ngoài ban công.'),
        ('Deluxe Balcony 201', 'OTHER', 'Máy pha cà phê capsule', 'GOOD',
         'Máy pha cà phê và capsule chào mừng trong phòng.'),

        ('Deluxe City View 202', 'OTHER', 'Cửa sổ toàn cảnh', 'GOOD',
         'Khung cửa kính lớn với tầm nhìn thoáng ra thành phố.'),
        ('Deluxe City View 202', 'OTHER', 'Ghế lounge ngắm cảnh', 'GOOD',
         'Ghế lounge đặt cạnh cửa sổ toàn cảnh.'),
        ('Deluxe City View 202', 'OTHER', 'Minibar chào mừng', 'GOOD',
         'Minibar có nước uống chào mừng dành cho khách.'),

        ('Deluxe Garden View 203', 'OTHER', 'Ban công hướng vườn', 'GOOD',
         'Ban công riêng nhìn ra khu vườn của villa.'),
        ('Deluxe Garden View 203', 'OTHER', 'Võng thư giãn', 'GOOD',
         'Võng nghỉ bố trí tại khu vực ban công hướng vườn.'),
        ('Deluxe Garden View 203', 'OTHER', 'Máy khuếch tán tinh dầu', 'GOOD',
         'Máy khuếch tán với hương thơm nhẹ dành cho phòng nghỉ.'),

        ('Deluxe Corner 204', 'OTHER', 'Hai mặt cửa sổ', 'GOOD',
         'Thiết kế phòng góc với hai hướng lấy sáng tự nhiên.'),
        ('Deluxe Corner 204', 'OTHER', 'Sofa đọc sách', 'GOOD',
         'Sofa riêng cho khu vực đọc sách và thư giãn.'),
        ('Deluxe Corner 204', 'OTHER', 'Máy lọc không khí', 'GOOD',
         'Máy lọc không khí dùng riêng trong phòng.'),

        ('Family Suite 301', 'OTHER', 'Khu sinh hoạt chung', 'GOOD',
         'Không gian sinh hoạt riêng cho gia đình và nhóm khách.'),
        ('Family Suite 301', 'OTHER', 'Bàn ăn gia đình', 'GOOD',
         'Bàn ăn lớn phù hợp cho nhóm khách lưu trú.'),
        ('Family Suite 301', 'OTHER', 'Lò vi sóng', 'GOOD',
         'Lò vi sóng phục vụ hâm nóng đồ ăn trong phòng.'),

        ('Family Garden 302', 'OTHER', 'Sân vườn riêng', 'GOOD',
         'Khoảng sân vườn riêng dành cho khách lưu trú.'),
        ('Family Garden 302', 'OTHER', 'Bàn ăn ngoài trời', 'GOOD',
         'Bộ bàn ăn bố trí trong khu vực sân vườn.'),
        ('Family Garden 302', 'OTHER', 'Ghế ăn trẻ em', 'GOOD',
         'Ghế ăn an toàn dành cho gia đình có trẻ nhỏ.'),

        ('Family Loft 303', 'OTHER', 'Gác lửng', 'GOOD',
         'Gác lửng tạo thêm không gian nghỉ và sinh hoạt.'),
        ('Family Loft 303', 'OTHER', 'Sofa giường', 'GOOD',
         'Sofa có thể chuyển đổi thành giường nghỉ bổ sung.'),
        ('Family Loft 303', 'OTHER', 'Máy chiếu mini', 'GOOD',
         'Máy chiếu phục vụ xem phim trong không gian gia đình.'),

        ('Family Pool View 304', 'OTHER', 'Ban công hướng hồ bơi', 'GOOD',
         'Ban công riêng có tầm nhìn trực diện hồ bơi.'),
        ('Family Pool View 304', 'OTHER', 'Khăn hồ bơi', 'GOOD',
         'Bộ khăn hồ bơi được chuẩn bị theo sức chứa phòng.'),
        ('Family Pool View 304', 'OTHER', 'Ghế tắm nắng', 'GOOD',
         'Ghế thư giãn dành cho khu vực hướng hồ bơi.')
)
INSERT INTO equipment (room_id, type, name, status, notes)
SELECT
    room.id,
    private_amenities.equipment_type::equipment_type,
    private_amenities.equipment_name,
    private_amenities.equipment_status::equipment_status,
    private_amenities.notes
FROM private_amenities
JOIN room ON lower(btrim(room.name)) = lower(btrim(private_amenities.room_name))
WHERE NOT EXISTS (
    SELECT 1
    FROM equipment existing_equipment
    WHERE existing_equipment.room_id = room.id
      AND lower(btrim(existing_equipment.name)) = lower(btrim(private_amenities.equipment_name))
);
