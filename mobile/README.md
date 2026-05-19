# Mobile — ứng dụng đặt limousine (React Native / Expo)

Ứng dụng cho **hành khách** (đặt vé, ghế, thanh toán, lịch sử, thông báo) và **tài xế** (dashboard, danh sách chuyến, hành khách). Entry: `App.js` → `src/navigation/AppNavigator`.

## Công nghệ

| Gói / công cụ | Vai trò |
|----------------|---------|
| **Expo** (~54), **React Native** | Build & runtime |
| **React Navigation** (stack + tabs) | Luồng Login → Main/Driver và form đặt vé |
| **Axios** + **`axiosWithRefresh.js`** | Gọi API với JWT refresh khi `401` |
| **socket.io-client** | Realtime ghế / sự kiện (qua `src/services/socket.js`) |
| **AsyncStorage** | Token & dữ liệu cục bộ |
| Các dependency UI | Vector icons, datetime picker, gesture handler, SVG (QR code), safe area, screens |

## Yêu cầu

- Node.js và npm/yarn  
- Expo CLI (khuyến nghị `npx expo`—không nhất thiết cài global)  
- Máy thật hoặc emulator Android / iOS; backend phải truy cập được từ thiết bị (Wi‑Fi LAN hoặc tunnel)

## Cài đặt

```bash
cd mobile
npm install
```

## Chạy dự án

```bash
npm start          # expo start — script trong package.json có set REACT_NATIVE_PACKAGER_HOSTNAME
npm run android    # expo start --android
npm run ios        # expo start --ios (macOS + Xcode)
```

**Quan trọng:** trong `package.json`, script `start` đang cố định `REACT_NATIVE_PACKAGER_HOSTNAME` về một IP LAN. **Đổi thành IP máy đang chạy Metro trên mạng của bạn**, nếu không thiết bị/emulator không tải bundle được.

### Kết nối tới backend

Trong `src/services/axiosWithRefresh.js`:

- **`API_URL`** — base URL REST, dạng `http://<IP-máy-chạy-backend>:<PORT>/api`  
  - Ví dụ thiết bị và backend cùng LAN: IP máy dev (không dùng `localhost` trên điện thoại).  
  - **`API_ORIGIN`** suy ra từ `API_URL` (bỏ hậu tố `/api`) cho socket / static upload.

Sau khi sửa `API_URL`, khởi động lại bundler và app.

### Token

**`src/services/tokenStorage.js`** lưu access/refresh token. Interceptor trong `axiosWithRefresh` gọi `POST /auth/refresh-token` khi hết hạn; thất bại thì clear token.

## Cấu trúc `src/`

```
src/
  navigation/       # AppNavigator, MainTabNavigator, DriverTabNavigator
  screens/          # Luồng khách + driver/*
  components/       # UI tái dùng (SeatMap, form, layout)
  hooks/            # useTicketPayment, useDriverTrips, useNotifications, v.v.
  services/        # axios, socket, token storage, unread count
  utils/           # format booking, auth navigation, map, thời gian
  theme/           # màu, typography chung
  assets/          # hình ảnh tĩnh
```

Luồng điển hình (khách): **Login / Register → Main (tabs) → BookRide → SeatSelection → CustomerInfo → Payment**, có thể mở **RouteVisualization** (định tuyến) tùy chức năng build.

Luồng tài xế: **`DriverMain`** (tabs riêng) — xem các màn `driver/` trong `screens/`.

## Tên hiển thị & cấu hình Expo

- `app.json` — `expo.name`, `slug`, nền tảng (`ios`, `android`), hướng màn hình.

## Khắc phục thường gặp

| Hiện tượng | Gợi ý |
|------------|--------|
| App không load JS bundle | Kiểm tra `REACT_NATIVE_PACKAGER_HOSTNAME` và firewall |
| Lỗi network / timeout API | Ping được backend từ điện thoại; sửa `API_URL` đúng IP:port và CORS trên backend (Express đã `cors()` mở rộng) |
| Socket không kết nối | Cùng `API_ORIGIN` với máy chủ Socket.IO và JWT hợp lệ |

## Ghi chú

Dự án có `typescript` trong devDependencies; phần lớn mã nguồn là **JavaScript** (`.js`). Nếu mở rộng có thể tăng cường type dần bằng JSDoc hoặc chuyển file sang `.ts`/`.tsx`.
