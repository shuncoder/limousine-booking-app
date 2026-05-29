# Mobile — ứng dụng đặt limousine (Expo)

Ứng dụng React Native (Expo) cho **hành khách** (đặt vé, ghế realtime, thanh toán, lịch sử, thông báo) và **tài xế** (dashboard, danh sách chuyến, hành khách).

Entry: `App.js` → `src/navigation/AppNavigator.js`.

## Công nghệ

| Gói | Vai trò |
|-----|---------|
| **Expo** (~54), **React Native** | Runtime & build |
| **React Navigation** (stack + tabs) | Login → Main / DriverMain + luồng đặt vé |
| **Axios** (`axiosWithRefresh.js`) | REST API, header JWT |
| **socket.io-client** | Ghế & thông báo realtime |
| **AsyncStorage** | Token (`tokenStorage.js`) |
| **react-native-qrcode-svg**, **SVG** | QR thanh toán |
| **@react-native-community/datetimepicker** | Chọn ngày/giờ |

## Yêu cầu

- Node.js, npm
- Expo Go hoặc emulator Android / iOS
- Backend chạy và **truy cập được từ thiết bị** (cùng Wi‑Fi LAN; không dùng `localhost` trên máy thật)

## Cài đặt

```bash
cd mobile
npm install
```

## Chạy

```bash
npm start          # expo start
npm run android
npm run ios        # macOS + Xcode
```

Script `start` trong `package.json` có thể set `REACT_NATIVE_PACKAGER_HOSTNAME` — **đổi thành IP máy đang chạy Metro** nếu thiết bị không tải được bundle.

### Kết nối backend

Sửa trong `src/services/axiosWithRefresh.js`:

```js
export const API_URL = 'http://<IP-máy-dev>:5000/api';
export const API_ORIGIN = API_URL.replace(/\/api$/, '');
```

- **`API_URL`** — REST (`/api/...`)
- **`API_ORIGIN`** — Socket.IO và URL ảnh upload (`/uploads/...`)

Khởi động lại bundler sau khi đổi IP.

### Xác thực

- Đăng nhập: **OTP email** (`/auth/email/start`, `verify`, `complete`) — lưu JWT qua `tokenStorage.js`, gọi API qua `services/api.js`.
- `axiosWithRefresh.js` có interceptor refresh khi `401`; backend hiện trả chủ yếu field `token` (access đơn). Đăng nhập lại nếu hết hạn.

Socket: `src/services/socket.js` — kết nối `API_ORIGIN`, gửi JWT trong `auth.token`, join room qua hooks (`useSeatSocket`, v.v.).

## Điều hướng

```
AppNavigator (Stack)
├── Login, Register
├── Main → MainTabNavigator
│     ├── Trang Chủ (HomeScreen)
│     ├── Lịch Sử Chuyến (RideHistoryScreen)
│     ├── Thông Báo (NotificationScreen)
│     └── Hồ Sơ (ProfileScreen)
├── DriverMain → DriverTabNavigator
│     ├── Tổng quan (DriverHomeScreen)
│     ├── Chuyến (DriverTripsScreen → DriverTripDetailScreen)
│     ├── Thông Báo, Hồ Sơ
├── BookRide → SeatSelection → CustomerInfo → Payment
└── RouteVisualization (A* / OSM)
```

Sau đăng nhập, `utils/authNavigation.js` chuyển `user` → `Main`, `driver` → `DriverMain`.

## Cấu trúc `src/`

```
src/
  navigation/
    AppNavigator.js
    MainTabNavigator.js
    DriverTabNavigator.js
  screens/
    LoginScreen.js, RegisterScreen.js, HomeScreen.js
    BookRideScreen.js, SeatSelectionScreen.js, CustomerInfoScreen.js
    PaymentScreen.js, RouteVisualizationScreen.js
    RideHistoryScreen.js, NotificationScreen.js, ProfileScreen.js
    driver/
      DriverHomeScreen.js, DriverTripsScreen.js, DriverTripDetailScreen.js
  hooks/
    useEmailLogin.js, useRegisterProfile.js, useProfile.js
    useTripSearch.js, useTripQuote.js, useSeatSelection.js, useCustomerBookingForm.js
    useTicketPayment.js, useTicketHistory.js, useTicketRoutePlan.js
    usePaymentCountdown.js, useBanners.js, useNotifications.js
    useOsmRoute.js, useSeatSocket.js
    useDriverDashboard.js, useDriverTrips.js, useDriverTripPassengers.js
    useLogout.js, useCountdown.js
  services/
    axiosWithRefresh.js    # API_URL, axios instance
    api.js                 # Hàm gọi REST theo domain
    socket.js
    tokenStorage.js
    unreadCountStore.js
  components/
    SeatMap.js
    ui/                    # PrimaryButton, TextField, GlassCard, ...
  utils/
    authNavigation.js, bookingFormatters.js, mapProjection.js
    passengerGrouping.js, time.js
  theme/
    theme.js
  assets/
    images/
```

## Luồng đặt vé (khách)

1. **Home** — banner (`useBanners`), tìm chuyến (`useTripSearch`).
2. **BookRide** — chọn chuyến, báo giá (`useTripQuote`).
3. **SeatSelection** — sơ đồ ghế, socket hold (`useSeatSocket`, `SeatMap`).
4. **CustomerInfo** — điểm đón/trả, promo.
5. **Payment** — thanh toán, countdown (`useTicketPayment`, `usePaymentCountdown`).
6. **RouteVisualization** — tùy chọn, gọi `/api/routing/astar` (`useOsmRoute`).

## Luồng tài xế

- API: `GET /api/trips/driver/me`, `GET /api/trips/:id/passengers`.
- Socket: `join_trips_list`, `join_trip` trên màn danh sách / chi tiết.
- Hooks: `useDriverDashboard`, `useDriverTrips`, `useDriverTripPassengers`.

## Cấu hình Expo

`app.json` — `name`, `slug`, `orientation`, platform `ios` / `android`.

## Khắc phục thường gặp

| Hiện tượng | Gợi ý |
|------------|--------|
| Không load JS bundle | Đúng `REACT_NATIVE_PACKAGER_HOSTNAME` / IP Metro, tắt firewall |
| Network error / timeout | Ping backend từ điện thoại; `API_URL` = IP LAN + cổng `5000` |
| Socket không kết nối | `API_ORIGIN` trùng host Socket.IO; JWT còn hạn |
| 401 liên tục | Đăng nhập lại; kiểm tra `JWT_SECRET` backend |

## Ghi chú

Mã nguồn chủ yếu **JavaScript** (`.js`). `typescript` trong devDependencies phục vụ tooling; có thể mở rộng `.ts`/`.tsx` sau.

Tổng quan monorepo: [README.md](../README.md) · Backend: [backend/README.md](../backend/README.md)
