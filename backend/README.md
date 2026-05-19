# Backend — ứng dụng đặt limousine

API Node.js cho ứng dụng khách và tài xế: xác thực, vé, chuyến, báo cáo, thông báo, định tuyến (A\*) và socket realtime.

## Công nghệ

| Thành phần | Vai trò |
|-------------|---------|
| **Node.js**, **Express** | HTTP API (`/api/...`) |
| **MongoDB**, **Mongoose** | Lưu trữ dữ liệu |
| **JWT** | Access / refresh token (middleware `authMiddleware`) |
| **Passport**, **express-session** | Đăng nhập Google (tùy chọn) |
| **Socket.IO** | Ghế realtime, trạng thái booking |
| **Nodemailer** | Email OTP / thông báo (tùy chọn) |

Gói bổ trợ: **bcryptjs**, **multer** (upload), **osm-read** (đồ thị đường từ OSM cho routing).

## Yêu cầu

- Node.js (phiên bản tương thích với dự án)
- MongoDB (URI kết nối hợp lệ)

## Cài đặt và chạy

```bash
cd backend
npm install
```

Tạo file `.env` ở thư mục `backend/` (không commit file này). Tham khảo bảng biến bên dưới.

**Chế độ phát triển (tự khởi động lại khi sửa file):**

```bash
npm run dev
```

**Chế độ production:**

```bash
npm start
```

Mặc định server lắng nghe cổng `5000` (hoặc giá trị `PORT` trong `.env`).

## Biến môi trường chính

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `MONGO_URI` | Có | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | Khuyến nghị (prod) | Ký và xác minh JWT; fallback dev trong code |
| `PORT` | Không | Cổng HTTP (mặc định `5000`) |
| `SESSION_SECRET` | Khuyến nghị (prod) | Secret cho session Passport |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM`, `APP_NAME` | Không | Bật gửi mail qua Gmail khi đủ cấu hình |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Không | Bật OAuth Google server |
| `MOBILE_APP_URL`, `WEBADMIN_URL`, `WEB_URL` | Không | URL cho redirect / whitelist (xem `authController`) |
| `OPENAI_API_KEY` | Không | Tính năng báo cáo / AI trong `reportController` |
| `OPENAI_MODEL`, `OPENAI_BASE_URL` | Không | Override model / endpoint OpenAI |
| `APP_TIMEZONE` | Không | Mặc định `Asia/Ho_Chi_Minh` |
| `OSM_PBF_PATH` | Không | Đường dẫn file `.osm.pbf` cho đồ thị routing (không có thì fallback theo logic trong code) |

## API (prefix `/api`)

Các nhóm route được mount trong `src/index.js`:

| Path | Chức năng gợi ý |
|------|----------------|
| `/api/auth` | Đăng ký, đăng nhập, refresh token, OAuth |
| `/api/users` | Hồ sơ người dùng |
| `/api/rides` | Chuyến / booking |
| `/api/admin` | Quản trị |
| `/api/trips` | Lịch chuyến |
| `/api/tickets` | Vé, thanh toán |
| `/api/promos` | Mã khuyến mãi |
| `/api/reports` | Báo cáo |
| `/api/complaints` | Khiếu nại |
| `/api/banners` | Banner |
| `/api/notifications` | Thông báo |
| `/api/routing` | Ví dụ `POST /astar` — định tuyến A\* (cần JWT) |

File tĩnh upload: **`GET /uploads/...`** (thư mục `uploads/` tại cwd).

## Socket.IO

Khởi tạo trong `src/sockets/socket.js`, dùng cùng `JWT_SECRET` với JWT HTTP. Mobile kết nối tới cùng origin (host + cổng) với REST.

## Background jobs

- **`seatHoldWatcher`** — xử lý hết hạn giữ chỗ ghế  
- **`seatJobs`** — tác vụ định kỳ liên quan vé / ghế  

Chạy cùng process với server sau khi `connectDB()` thành công.

## Cấu trúc thư mục `src/`

```
src/
  config/       # database, gmail/passport, mailer
  controllers/ # Logic xử lý theo domain
  models/       # Mongoose schemas
  routes/       # Định nghĩa router Express
  middlewares/ # auth JWT, role
  sockets/      # Socket.IO
  jobs/        # Cron / watcher chỗ ngồi & vé
  utils/       # OSM graph, A*, pricing, notify, v.v.
  index.js     # Entry: app + server + routes + socket + jobs
```

Thư mục `uploads/` dùng cho file người dùng/admin tải lên. File dữ liệu OSM (nếu dùng) có thể đặt trong `data/` và trỏ bằng `OSM_PBF_PATH`.

## Ghi chú bảo mật

Không đưa `.env` thật lên Git. Luôn dùng secret mạnh cho `JWT_SECRET` và `SESSION_SECRET` trong môi trường production.
