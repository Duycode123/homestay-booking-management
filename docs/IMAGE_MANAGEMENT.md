# Quản lý hình ảnh

Project lưu ảnh nghiệp vụ trên Cloudinary thông qua backend. Frontend không giữ API secret và không upload trực tiếp lên Cloudinary.

## Cấu hình local

Thiết lập các biến môi trường trước khi chạy backend:

```powershell
$env:CLOUDINARY_CLOUD_NAME="cloud_name_cua_ban"
$env:CLOUDINARY_API_KEY="api_key_cua_ban"
$env:CLOUDINARY_API_SECRET="api_secret_cua_ban"
$env:CLOUDINARY_FOLDER="homestay-booking-management/rooms"
$env:CLOUDINARY_AVATAR_FOLDER="homestay-booking-management/avatars"
```

Không commit API key hoặc API secret thật vào `application.properties`, `.env` hay tài liệu.

## Ảnh phòng

1. Đăng nhập tài khoản Admin.
2. Mở **Quản lý phòng**.
3. Chọn thêm hoặc chỉnh sửa phòng.
4. Tại **Ảnh phòng**, chọn 1 ảnh đại diện và tối đa 3 ảnh phụ, mỗi ảnh tối đa 12MB.
5. Frontend gửi file đến `POST /api/admin/room-images`.
6. Backend kiểm tra quyền, loại file và dung lượng, sau đó upload vào thư mục phòng trên Cloudinary.
7. URL HTTPS trả về được lưu vào trường `room.image_url` khi lưu phòng.

Ảnh phòng phải là ảnh ngang JPG, PNG hoặc WebP, tối thiểu 1200x900px. Chuẩn khuyến nghị cho cả bốn ảnh là 1600x1200px, tỷ lệ 4:3. Không lấy thumbnail 400x300 hoặc 800x600 rồi kéo lên khung lớn vì việc phóng kích thước không khôi phục được chi tiết đã mất.

Cloudinary lưu file gốc; database chỉ lưu URL HTTPS. Gallery dùng bộ tối ưu ảnh của Next.js để yêu cầu biến thể responsive theo đúng kích thước hiển thị và chất lượng 90, nhờ đó màn hình mật độ điểm ảnh cao nhận tệp đủ lớn mà không phải tải ảnh gốc quá nặng ở mọi vị trí.

### Dùng ảnh tĩnh trong project, không qua Cloudinary

1. Tạo thư mục theo phòng, ví dụ `frontend/public/images/rooms/standard-garden-101/`.
2. Chép bốn file 1600x1200px vào thư mục đó: `main.jpg`, `detail-1.jpg`, `detail-2.jpg`, `detail-3.jpg`.
3. Trong form admin, nhập lần lượt `/images/rooms/standard-garden-101/main.jpg` và ba đường dẫn ảnh phụ.
4. Lưu phòng. Database chỉ lưu các đường dẫn bắt đầu bằng `/images/rooms/`; frontend phục vụ file trực tiếp từ thư mục `public`.

Không nhập đường dẫn máy cá nhân như `C:\\Users\\...` hoặc `file:///...`. Ảnh tĩnh được đóng gói cùng frontend, vì vậy phải build/deploy lại frontend sau khi thêm hoặc thay file.

Chỉ sử dụng ảnh tự chụp, ảnh được chủ sở hữu cấp phép hoặc ảnh có giấy phép phù hợp. Không hotlink trực tiếp URL CDN của website bên thứ ba vì URL có thể thay đổi và quyền sử dụng không thuộc project.

## Ảnh đại diện

1. Người dùng mở **Hồ sơ cá nhân** và chọn **Thay ảnh**.
2. Frontend gửi file đến `POST /api/users/me/avatar`.
3. Backend upload vào thư mục avatar và lưu URL vào `account.avatar_url`.

## Ảnh giao diện tĩnh

Ảnh thương hiệu, hero hoặc social preview không gắn với dữ liệu người dùng được đặt trong `frontend/public/images/` và dùng bằng đường dẫn `/images/ten-file.webp`.

Ưu tiên WebP, tên file tiếng Anh dạng `kebab-case`, kích thước phù hợp vị trí hiển thị và luôn khai báo nội dung `alt` có ý nghĩa.
