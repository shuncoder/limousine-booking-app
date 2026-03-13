
# limousine-booking-app

Đồ án môn học: Xây dựng ứng dụng đặt xe limousine cơ bản.

## Tổng quan dự án

Dự án bao gồm hệ thống backend (API, realtime, database) và frontend (ứng dụng di động) cho phép người dùng đăng ký, đăng nhập, đặt xe, xem lịch sử chuyến đi, theo dõi trạng thái chuyến đi theo thời gian thực.

- Backend sử dụng Node.js, Express, MongoDB, JWT, Socket.IO và đóng gói bằng Docker.
- Frontend là ứng dụng di động React Native (Expo), kết nối API và realtime với backend.

## Cấu trúc thư mục dự án

```
limousine-booking-app/
│
├── backend/                # Source code backend (Node.js, Express, MongoDB, Socket.IO)
│   ├── src/
│   │   ├── config/         # Cấu hình (DB, biến môi trường)
│   │   ├── controllers/    # Xử lý logic API
│   │   ├── models/         # Định nghĩa schema (User, Ride)
│   │   ├── routes/         # Định nghĩa các endpoint RESTful
│   │   ├── middlewares/    # Middleware (JWT, xử lý lỗi)
│   │   ├── sockets/        # Xử lý realtime với Socket.IO
│   │   └── utils/          # Tiện ích dùng chung
│   ├── Dockerfile          # Dockerfile cho backend
│   └── README.md           # Giải thích chi tiết backend
│
├── mobile/                 # Source code frontend (React Native, Expo)
│   ├── src/
│   │   ├── screens/        # Các màn hình chính (Login, Register, Home, BookRide, ...)
│   │   ├── components/     # Component dùng chung
│   │   ├── services/       # Gọi API, kết nối socket
│   │   ├── navigation/     # Điều hướng app
│   │   └── utils/          # Tiện ích frontend
│   ├── App.js              # Điểm khởi động app
│   └── README.md           # Giải thích chi tiết frontend
│
├── docker-compose.yml      # Khởi tạo backend + MongoDB bằng Docker
├── README.md               # (File này) Tổng quan dự án, cấu trúc thư mục
└── LICENSE
```

## Hướng dẫn nhanh

1. Cài đặt dependencies:
	- Backend: `cd backend && npm install`
	- Frontend: `cd mobile && npm install`
2. Khởi động backend và MongoDB:
	- Ở thư mục gốc: `docker-compose up`
3. Khởi động app di động:
	- `cd mobile && npm start`

