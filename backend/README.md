# Backend - Ride Booking App

## Công nghệ sử dụng

- **Node.js**: Nền tảng chạy JavaScript phía server, xử lý logic backend và API.
- **Express.js**: Framework giúp xây dựng RESTful API nhanh, dễ mở rộng.
- **MongoDB**: Cơ sở dữ liệu NoSQL, lưu trữ thông tin người dùng, chuyến đi.
- **Mongoose**: Quản lý schema, validate và thao tác dữ liệu MongoDB.
- **JWT (JSON Web Token)**: Xác thực và phân quyền người dùng qua token.
- **Socket.IO**: Giao tiếp realtime (vị trí tài xế, trạng thái chuyến đi).
- **Docker**: Đóng gói backend và MongoDB thành container, dễ triển khai.

## Thư mục chính

- `src/config/`: Cấu hình kết nối DB, biến môi trường.
- `src/controllers/`: Xử lý logic cho các API.
- `src/models/`: Định nghĩa schema cho User, Ride.
- `src/routes/`: Định nghĩa các endpoint RESTful.
- `src/middlewares/`: Middleware xác thực JWT, xử lý lỗi.
- `src/sockets/`: Xử lý các sự kiện realtime với Socket.IO.
- `src/utils/`: Tiện ích dùng chung.

## Chạy backend

```bash
cd backend
npm install
docker-compose up
```
