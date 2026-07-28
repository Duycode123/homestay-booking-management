# Homestay Booking Management

Hệ thống quản lý và đặt phòng homestay dành cho khách hàng, nhân viên và quản trị viên.

## Chức năng chính

- Tra cứu phòng theo hạng `Standard`, `Deluxe`, `Family`, sức chứa, giá và thời gian trống.
- Quản lý đặt phòng, thanh toán, mã giảm giá, hủy phòng và đánh giá.
- Quản lý phòng cùng các tiện nghi như Wi-Fi, điều hòa, TV và máy nước nóng.
- Chatbot tư vấn phòng homestay dựa trên số khách, ngân sách, thời gian lưu trú và tiện nghi mong muốn.
- Trang quản trị, lịch làm việc nhân viên, báo cáo doanh thu và xử lý sự cố.

## Công nghệ

- Backend: Java 21, Spring Boot, Maven, PostgreSQL.
- Frontend: Next.js, React, TypeScript, Tailwind CSS.
- AI worker: Cloudflare Worker.

## Cấu trúc thư mục

```text
backend/               API và nghiệp vụ
frontend/              Giao diện web
database/              Lược đồ, migration và dữ liệu mẫu
cloudflare-ai-worker/  AI proxy cho chatbot
docs/                  Tài liệu use case
```

## Chạy backend

```powershell
cd backend
./mvnw spring-boot:run
```

Sao chép `backend/src/main/resources/application.properties.example` thành `application.properties` và cập nhật cấu hình PostgreSQL trước khi chạy.

Để email xác thực tạo đúng liên kết và gửi qua Gmail, cấu hình các biến môi trường trước khi chạy backend:

```powershell
$env:APP_FRONTEND_BASE_URL="http://localhost:3000"
$env:MAIL_USERNAME="your_email@gmail.com"
$env:MAIL_PASSWORD="your_gmail_app_password"
./mvnw spring-boot:run
```

`APP_FRONTEND_BASE_URL` chỉ chứa origin của frontend, không thêm `/verify-email`. Khi triển khai production, thay giá trị localhost bằng domain HTTPS thật. `MAIL_PASSWORD` phải là Gmail App Password và không được commit vào repository.

### Email trên Render Free

Render Free chặn các cổng SMTP 25, 465 và 587. Để giữ nguyên luồng SMTP khi deploy,
cấu hình một SMTP relay hỗ trợ cổng 2525 (ví dụ Brevo) trong Environment Variables:

```text
MAIL_PROTOCOL=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=2525
MAIL_USERNAME=<Brevo SMTP login>
MAIL_PASSWORD=<Brevo SMTP key, không phải API key>
MAIL_FROM_ADDRESS=<địa chỉ người gửi đã xác minh trên Brevo>
MAIL_SMTP_AUTH=true
MAIL_STARTTLS=false
MAIL_STARTTLS_REQUIRED=false
MAIL_SSL_ENABLE=false
```

Gmail SMTP 587 vẫn được giữ làm cấu hình local. Không được đưa SMTP key vào Git.

## Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Mặc định frontend chạy tại `http://localhost:3000`.

## Chạy toàn bộ hệ thống bằng Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Sau khi các health check hoàn tất:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/health`
- PostgreSQL: `localhost:5432`

Giá trị JWT và mật khẩu trong `.env.example` chỉ dành cho phát triển cục bộ. Khi
triển khai thật phải tạo giá trị mới và không commit file `.env`.

## Kiểm tra chất lượng

```powershell
cd backend
mvn test

cd ../frontend
npm run check:domain
npm run lint -- --quiet
npm run build
npx playwright install chromium
npm run test:e2e
```

GitHub Actions tự động chạy các bước trên khi push hoặc mở pull request. Báo cáo
Playwright được lưu dưới dạng artifact khi CI kết thúc.

## Bí mật và tích hợp ngoài

Các giá trị sau chỉ được cấu hình bằng biến môi trường:

- `JWT_SECRET`
- `MAIL_PASSWORD`
- `CLOUDINARY_URL`
- `SEPAY_API_ACCESS_TOKEN`
- `SEPAY_IPN_SECRET`
- `SEPAY_WEBHOOK_HMAC_SECRET`
- OAuth client secrets

Nếu một token từng xuất hiện trong file local, log hoặc lịch sử Git, phải thu hồi
token cũ tại nhà cung cấp rồi tạo token mới. Chỉ xóa token khỏi file là chưa đủ.

## Dữ liệu mẫu

Sau khi áp dụng schema và migrations, chạy lần lượt:

```powershell
psql -d homestaydb -f database/sample-data/seed_rooms_and_equipment.sql
psql -d homestaydb -f database/sample-data/seed_accounts_and_customers.sql
psql -d homestaydb -f database/sample-data/seed_bookings_and_reviews.sql
```

Tài khoản và biến môi trường chỉ phục vụ phát triển cục bộ; không đưa khóa bí mật thật vào repository.
