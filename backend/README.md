# Backend — API đặt limousine

API Node.js phục vụ **mobile** (khách + tài xế) và **webadmin** (staff/admin): xác thực, chuyến xe, vé, giữ ghế, khuyến mãi, banner, khiếu nại, báo cáo, định tuyến A\* trên OSM và Socket.IO realtime.

## Công nghệ

| Thành phần | Vai trò |
|-------------|---------|
| **Node.js**, **Express** | HTTP API (`/api/...`) |
| **MongoDB**, **Mongoose** | Lưu trữ |
| **JWT** | Xác thực HTTP và Socket.IO |
| **Socket.IO** | Ghế, thông báo, `trip_seat_count` |
| **Nodemailer** | Gửi OTP qua SMTP (khi cấu hình `GMAIL_USER` / app password) |
| **osm-read** | Đồ thị đường từ file `.osm.pbf` |

Gói bổ trợ: **bcryptjs**, **multer** (upload banner), **cors**.

## Yêu cầu

- Node.js (phiên bản tương thích `package.json`)
- MongoDB (URI hợp lệ)

## Cài đặt và chạy

```bash
cd backend
npm install
```

Tạo file `.env` ở thư mục `backend/` (không commit). Tham khảo bảng biến bên dưới.

```bash
npm run dev    # nodemon — phát triển
npm start      # node — production
```

Mặc định lắng nghe cổng **5000** (`PORT` trong `.env`).

## Biến môi trường chính

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `MONGO_URI` | Có | Chuỗi kết nối MongoDB |
| `JWT_SECRET` | Khuyến nghị (prod) | Ký JWT; có fallback dev trong code |
| `PORT` | Không | Cổng HTTP (mặc định `5000`) |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `MAIL_FROM`, `APP_NAME` | Không | Gửi OTP email |
| `OPENAI_API_KEY` | Không | Báo cáo AI (`reportController`) |
| `OPENAI_MODEL`, `OPENAI_BASE_URL` | Không | Override OpenAI |
| `APP_TIMEZONE` | Không | Mặc định `Asia/Ho_Chi_Minh` |
| `OSM_PBF_PATH` | Không | Đường dẫn `.osm.pbf` (mặc định có thể dùng `data/hanoi.osm.pbf`) |

## API (prefix `/api`)

Mount trong `src/index.js`:

| Path | Chức năng |
|------|-----------|
| `/api/auth` | OTP email, `/me`, admin login |
| `/api/users` | Hồ sơ (`GET/PUT /profile`) |
| `/api/trips` | Chuyến, ghế, hold/release, giá, chuyến tài xế |
| `/api/tickets` | Vé, quote, thanh toán, hủy, hoàn tiền, route-plan |
| `/api/promos` | Mã khuyến mãi (validate + CRUD admin) |
| `/api/banners` | Banner trang chủ |
| `/api/notifications` | Thông báo in-app |
| `/api/complaints` | Khiếu nại (user + admin) |
| `/api/reports` | Báo cáo / thống kê (có thể dùng OpenAI) |
| `/api/admin` | User, driver, thông báo admin |
| `/api/routing` | `POST /astar` — định tuyến A\* |

**File tĩnh:** `GET /uploads/...` — thư mục `uploads/` tại cwd (ảnh banner, v.v.).

Phân quyền: `middlewares/authMiddleware.js` (JWT) + `middlewares/requireRole.js` (`user`, `driver`, `staff`, `admin`).

## Models (MongoDB)

| Model | Mô tả ngắn |
|-------|------------|
| `User` | Tài khoản, role, OTP email |
| `Trip` | Chuyến, layout ghế, giá động |
| `Ticket` | Vé theo ghế + điểm đón/trả |
| `SeatHold` | Giữ ghế tạm thời |
| `Promo`, `Banner` | Khuyến mãi, banner |
| `Notification`, `AdminNotification` | Thông báo |
| `Complaint` | Khiếu nại |
| `ComplaintStatusHistory` | Lịch sử thay đổi trạng thái khiếu nại |

## Socket.IO

File: `src/sockets/socket.js` — dùng chung `JWT_SECRET`, token gửi trong `handshake.auth.token`.

| Client event | Mô tả |
|--------------|--------|
| `join_trip` / `leave_trip` | Room `trip:<tripId>` — màn chi tiết ghế |
| `join_trips_list` / `leave_trips_list` | Room danh sách chuyến (dashboard, tìm chuyến) |

| Server event | Mô tả |
|--------------|--------|
| `seat_hold`, `seat_release`, `seat_update` | Trạng thái ghế |
| `trip_seat_count` | Tổng booked/held/available |
| `notification:new` | Room `user:<userId>` |

## Background jobs

Chạy cùng process sau `connectDB()`:

- **`seatHoldWatcher`** — hết hạn giữ ghế
- **`seatJobs`** — vé pending / tác vụ ghế định kỳ

## Cấu trúc `src/`

```
src/
  index.js              # Entry: Express + HTTP server + routes + socket + jobs
  config/
    database.js         # MongoDB
    mailer.js           # Gửi OTP email (Nodemailer)
  controllers/
    authController.js, tripController.js, ticketController.js
    seatHoldController.js, routingController.js, reportController.js
    bannerController.js, promoController.js, complaintController.js
    notificationController.js, adminController.js, userController.js
  models/
    User.js, Trip.js, Ticket.js, SeatHold.js
    Promo.js, Banner.js, Notification.js, AdminNotification.js
    Complaint.js, ComplaintStatusHistory.js
  routes/               # Router tương ứng từng nhóm /api/*
  middlewares/
    authMiddleware.js, requireRole.js
  sockets/
    socket.js
  jobs/
    seatHoldWatcher.js, seatJobs.js
  utils/
    astar.js, osmGraph.js, routeSimulator.js, pricing.js
    bookingValidation.js, notify.js, adminAudit.js
```

Thư mục ngoài `src/`:

- **`uploads/`** — file upload (banner, …)
- **`data/`** — `hanoi.osm.pbf` cho routing (tùy `OSM_PBF_PATH`)

## Liên kết client

| Client | Cấu hình |
|--------|----------|
| Mobile | `API_URL` → `http://<host>:5000/api` |
| Web Admin | `NEXT_PUBLIC_API_URL` → cùng base URL |

Socket: cùng origin với REST (bỏ `/api`), ví dụ `http://localhost:5000`.

## Bảo mật

Không đưa `.env` lên Git. Dùng `JWT_SECRET` mạnh trên production.
