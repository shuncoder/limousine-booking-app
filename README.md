# limousine-booking-app

Đồ án môn học: Hệ thống đặt xe limousine — API backend, ứng dụng di động (khách & tài xế) và bảng quản trị web.

## Tổng quan

| Thành phần | Thư mục | Công nghệ | Vai trò |
|------------|---------|-----------|---------|
| **Backend** | `backend/` | Node.js, Express, MongoDB, Socket.IO, JWT | REST API, realtime ghế/vé, jobs, định tuyến OSM (A\*) |
| **Mobile** | `mobile/` | React Native (Expo), React Navigation | Đặt vé, thanh toán, lịch sử; dashboard tài xế |
| **Web Admin** | `webadmin/` | Next.js 16, React 19, TypeScript, Tailwind | Quản trị chuyến, vé, user, driver, báo cáo, banner |

Cả hai client kết nối **cùng một backend** qua HTTP (`/api`) và Socket.IO (cùng host, cổng mặc định `5000`).

```
┌─────────────┐     ┌─────────────┐
│   mobile/   │     │  webadmin/  │
│  (Expo RN)  │     │  (Next.js)  │
└──────┬──────┘     └──────┬──────┘
       │  REST + JWT       │
       │  Socket.IO        │
       └────────┬──────────┘
                ▼
       ┌─────────────────┐
       │    backend/     │
       │ Express + IO    │
       └────────┬────────┘
                ▼
            MongoDB
```

Chi tiết từng phần: [backend/README.md](backend/README.md) · [mobile/README.md](mobile/README.md) · [webadmin/README.md](webadmin/README.md)

## Vai trò người dùng

| Role | Mobile | Web Admin |
|------|--------|-----------|
| `user` | Đặt vé, thanh toán, khiếu nại, thông báo | — |
| `driver` | Xem chuyến được gán, hành khách | — |
| `staff` / `admin` | — | CRUD chuyến, vé, promo, banner, báo cáo |

## Luồng nghiệp vụ chính (đặt vé)

1. Khách tìm chuyến (`GET /api/trips`) → giữ ghế (`POST /api/trips/:id/hold`).
2. Tạo vé pending (`POST /api/tickets`) → thanh toán (`POST /api/tickets/:id/pay`).
3. Socket.IO phát `seat_hold`, `seat_update`, `trip_seat_count` cho màn chọn ghế / danh sách chuyến.
4. Background jobs (`seatHoldWatcher`, `seatJobs`) hủy giữ ghế / vé hết hạn.

Ngoài ra vẫn có nhóm API **`/api/rides`** (model `Ride`) — luồng đặt xe ban đầu; luồng hiện tại ưu tiên **Trip + Ticket + SeatHold**.

## Cấu trúc thư mục

```
limousine-booking-app/
│
├── backend/                    # API + Socket.IO + jobs
│   ├── src/
│   │   ├── config/             # DB, mailer (OTP email)
│   │   ├── controllers/
│   │   ├── models/             # User, Trip, Ticket, SeatHold, ...
│   │   ├── routes/
│   │   ├── middlewares/        # JWT, requireRole
│   │   ├── sockets/
│   │   ├── jobs/
│   │   └── utils/              # OSM, A*, pricing, notify
│   ├── data/                   # hanoi.osm.pbf (định tuyến, tùy chọn)
│   ├── uploads/                # File tĩnh (banner, ...)
│   └── README.md
│
├── mobile/                     # App Expo (khách + tài xế)
│   ├── App.js
│   ├── src/
│   │   ├── navigation/
│   │   ├── screens/            # + screens/driver/
│   │   ├── hooks/
│   │   ├── services/           # axios, socket, token
│   │   ├── components/
│   │   ├── utils/
│   │   └── theme/
│   └── README.md
│
├── webadmin/                   # Dashboard admin/staff
│   ├── src/
│   │   ├── app/(admin)/        # trips, tickets, users, drivers, ...
│   │   ├── components/
│   │   └── lib/                # api.ts, auth.ts
│   └── README.md
│
├── README.md
└── LICENSE
```

## Chạy nhanh toàn hệ thống

**1. MongoDB** — chạy instance local hoặc cloud, lấy URI.

**2. Backend**

```bash
cd backend
npm install
# Tạo .env (xem backend/README.md)
npm run dev
```

**3. Mobile** — sửa `API_URL` trong `mobile/src/services/axiosWithRefresh.js` trùng IP máy dev, rồi:

```bash
cd mobile
npm install
npm start
```

**4. Web Admin**

```bash
cd webadmin
npm install
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm run dev
```

Mở web admin tại `http://localhost:3000`, đăng nhập bằng tài khoản `admin` / `staff` (tạo trong DB hoặc seed dự án).

## Cấu hình kết nối chung

| Client | Biến / file | Ví dụ |
|--------|-------------|--------|
| Backend | `MONGO_URI`, `JWT_SECRET`, `PORT` | `.env` trong `backend/` |
| Mobile | `API_URL` trong `axiosWithRefresh.js` | `http://192.168.x.x:5000/api` |
| Web Admin | `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` |

Thiết bị thật/emulator **không** dùng `localhost` cho mobile — dùng IP LAN của máy chạy backend.

## Bảo mật

Không commit `.env`, secret JWT/session production, hoặc mật khẩu mail. File OSM lớn (`*.osm.pbf`) nên cân nhắc Git LFS hoặc tải riêng khi clone.
