# Web Admin — bảng quản trị limousine

Dashboard **Next.js** cho vai trò `staff` / `admin`: quản lý chuyến xe, vé, người dùng, tài xế, khuyến mãi, banner, khiếu nại và báo cáo. Kết nối backend qua REST API (`/api`), không dùng Socket.IO trực tiếp.

Giao diện dựa trên template **XeAdmin** (Next.js App Router); các trang nghiệp vụ nằm trong `src/app/(admin)/`.

## Công nghệ

| Thành phần | Vai trò |
|-------------|---------|
| **Next.js 16** (App Router) | Routing, SSR/CSR |
| **React 19**, **TypeScript** | UI & type-safe API client |
| **Tailwind CSS v4** | Styling |
| **ApexCharts**, **FullCalendar** | Biểu đồ, lịch (template + báo cáo) |

## Yêu cầu

- Node.js 18+ (khuyến nghị 20+)
- Backend đang chạy (mặc định `http://localhost:5000`)
- Tài khoản MongoDB có `role`: `admin` hoặc `staff`

## Cài đặt và chạy

```bash
cd webadmin
npm install
```

Tạo `.env.local` (không commit):

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev      # http://localhost:3000
npm run build
npm start        # production
npm run lint
```

### Đăng nhập

- Trang: `/signin`
- API: `POST /api/auth/admin/login` (body: `username`, `password` — thường dùng email admin)
- JWT lưu `localStorage` key `xeadmin_token` (`src/lib/auth.ts`)
- Sau login, `GET /api/auth/me` xác minh phiên

Backend phải bật CORS; URL admin có thể cấu hình qua `WEBADMIN_URL` trên server.

## Kết nối backend

| File | Mô tả |
|------|--------|
| `src/lib/api.ts` | `API_URL` từ `NEXT_PUBLIC_API_URL`, hàm `apiFetch`, domain trips/tickets/users/... |
| `src/lib/auth.ts` | `getToken` / `setToken` / `clearToken` |

`resolveAssetUrl()` ghép path upload (`/uploads/...`) với `API_ORIGIN` (host backend, bỏ `/api`).

## Trang quản trị (nghiệp vụ)

| Route | Chức năng | API chính |
|-------|-----------|-----------|
| `/` | Tổng quan, thông báo admin | `/admin/notifications`, metrics |
| `/trips` | CRUD chuyến, ghế, giá động | `/trips`, `/trips/:id/seats` |
| `/tickets` | Danh sách vé, duyệt hoàn tiền | `/tickets/admin/list`, `.../refund/approve` |
| `/users` | Người dùng, đổi role | `/admin/users`, `PATCH .../role` |
| `/drivers` | Tài xế, promote/demote | `/admin/drivers` |
| `/promos` | Mã khuyến mãi | `/promos` |
| `/banners` | Upload/xóa banner | `/banners` |
| `/complaints` | Xử lý khiếu nại | `/complaints/admin/list` |
| `/reports` | Doanh thu, fill rate, AI (nếu có key) | `/reports/*` |

Sidebar định nghĩa trong `src/layout/AppSidebar.tsx`.

## Trang template (demo UI)

Các route dưới `src/app/(admin)/(ui-elements)/`, `(others-pages)/` — **mẫu từ XeAdmin** (buttons, modals, charts, tables, calendar, …), không gắn API limousine. Có thể bỏ qua khi vận hành.

## Cấu trúc `src/`

```
src/
  app/
    layout.tsx
    (admin)/
      layout.tsx              # Sidebar + header
      page.tsx                # Dashboard
      DashboardPageClient.tsx
      trips/, tickets/, users/, drivers/
      promos/, banners/, complaints/, reports/
      (ui-elements)/          # Demo template
      (others-pages)/         # Demo template
    (full-width-pages)/
      (auth)/signin/          # Đăng nhập admin
      (error-pages)/error-404/
  components/                 # Form, bảng, chart, modal
  layout/
    AppSidebar.tsx, AppHeader.tsx, Backdrop.tsx
  context/
    SidebarContext.tsx
  lib/
    api.ts                    # Toàn bộ gọi REST
    auth.ts                   # Token localStorage
  icons/                      # SVG icons sidebar
```

## API client (`src/lib/api.ts`)

Hàm export theo domain (đều nhận `token: string`):

| Nhóm | Hàm ví dụ |
|------|-----------|
| Auth | `adminLogin`, `getMe`, `updateAdminProfile` |
| Trips | `listTrips`, `createTrip`, `updateTrip`, `deleteTrip`, `getTripSeats` |
| Tickets | `adminListTickets`, `approveRefund` |
| Promos | `listPromos`, `createPromo`, `updatePromo`, `deletePromo` |
| Users / Drivers | `listUsers`, `updateUserRole`, `listDrivers`, `promoteUserToDriver`, `demoteDriver` |
| Reports | `revenueByRoute`, `revenueOverTime`, `fillRateReport`, `analyzeRevenueWithAi` |
| Complaints | `adminListComplaints`, `updateComplaint` |
| Banners | `listBanners`, `uploadBanner`, `deleteBanner` |
| Notifications | `listAdminNotifications` |

## Vai trò

Chỉ `admin` và `staff` nên truy cập panel. Backend kiểm tra `requireRole('admin', 'staff')` trên các route quản trị.

## Khắc phục thường gặp

| Hiện tượng | Gợi ý |
|------------|--------|
| Login 401 | Đúng email/password; user có role admin/staff trong DB |
| API network error | Backend chạy; `NEXT_PUBLIC_API_URL` đúng host:port |
| Ảnh banner không hiện | `resolveAssetUrl` cần backend phục vụ `/uploads` |
| Build lỗi peer deps | Thử `npm install --legacy-peer-deps` |

## Liên kết

- Tổng quan monorepo: [README.md](../README.md)
- Backend API: [backend/README.md](../backend/README.md)
- Mobile app: [mobile/README.md](../mobile/README.md)

## License

MIT (template XeAdmin / dự án đồ án).
