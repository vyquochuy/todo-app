# Taskflow — Danh sách việc cần làm (Todo List)

Ứng dụng Todo List full-stack đạt tiêu chuẩn production, được xây dựng như một bài đánh giá năng lực thực tập sinh. Dự án thể hiện kiến trúc sạch (clean architecture), sử dụng công cụ hiện đại, giao diện UI/UX chuyên nghiệp, xác thực người dùng, bảo mật ở môi trường Edge và khả năng hoạt động ngoại tuyến (PWA).

---

## Công nghệ sử dụng (Tech Stack)

| Tầng (Layer)  | Công nghệ sử dụng                                                       |
| :------------ | :---------------------------------------------------------------------- |
| Frontend      | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui               |
| State         | TanStack Query v5 (hỗ trợ optimistic updates)                           |
| Form          | React Hook Form + Zod                                                   |
| Backend       | Hono.js, TypeScript                                                     |
| Bảo mật       | IP-based Rate Limiter (sliding window), strict CORS                     |
| Xác thực      | JWT (HS256) session validation, mã hóa mật khẩu bằng Web Crypto API gốc |
| Cơ sở dữ liệu | Cloudflare D1 (SQLite), Drizzle ORM                                     |
| Ngoại tuyến   | PWA Manifest, Service Worker tùy biến theo cơ chế cache-first (sw.js)   |
| Deploy        | Frontend → Vercel · Backend → Cloudflare Workers                        |
| Chất lượng    | ESLint, Prettier, Vitest, CI pipeline với GitHub Actions                |

---

## Kiến trúc thư mục (Architecture)

```
todo-app/                          # npm workspaces monorepo
├── packages/
│   └── shared/                    # Chứa Zod schemas + TypeScript types dùng chung
│       └── src/
│           ├── types/todo.ts      # Định nghĩa Todo, ApiResponse<T>, PaginationMeta
│           ├── schemas/todo.schema.ts  # createTodoSchema, updateTodoSchema
│           └── schemas/user.schema.ts  # registerSchema, loginSchema
│
├── backend/                       # Hono.js → Cloudflare Workers + D1
│   └── src/
│       ├── db/                    # Drizzle schema + cấu hình D1 client
│       ├── routes/                # Hono router (chỉ xử lý tầng HTTP)
│       │   ├── auth.ts            # Xử lý Đăng ký & Đăng nhập
│       │   └── todos.ts           # Xử lý CRUD Todo (Yêu cầu xác thực)
│       ├── services/              # Tầng xử lý logic nghiệp vụ (Business logic)
│       │   ├── auth.service.ts    # Mã hóa mật khẩu & tạo token JWT
│       │   └── todo.service.ts    # Truy vấn DB cách ly người dùng (Multi-tenant)
│       ├── middleware/            # CORS, xử lý lỗi, giới hạn lượt truy cập (rate-limiter)
│       ├── validators/            # Các hàm wrapper cho @hono/zod-validator
│       └── utils/                 # Các hàm tiện ích hỗ trợ phản hồi HTTP
│
└── frontend/                      # Next.js 16 → Vercel
    ├── app/                       # App Router pages + layouts
    ├── context/
    │   └── AuthContext.tsx        # Provider quản lý phiên đăng nhập (JWT persistence)
    ├── features/
    │   ├── auth/                  # Màn hình Đăng nhập/Đăng ký với hiệu ứng kính mờ (Glassmorphic)
    │   └── todo/                  # Các bộ lọc todo, danh sách, hộp thoại, hooks
    ├── components/                # UI dùng chung (shadcn/ui + bố cục chung)
    ├── hooks/                     # Các custom hooks thông dụng (useDebounce)
    └── public/
        ├── manifest.json          # Cấu hình PWA Manifest
        └── sw.js                  # Service Worker lưu cache để hoạt động ngoại tuyến
```

**Các quyết định thiết kế cốt lõi:**

- **Dùng chung Zod schemas** — Cả frontend và backend đều xác thực dữ liệu qua cùng một bộ quy tắc; đảm bảo tính nhất quán tuyệt đối.
- **Bảo mật JWT & Mật khẩu** — Mật khẩu được mã hóa bằng thuật toán `PBKDF2` (100.000 lượt lặp, SHA-256) kèm salt ngẫu nhiên cho từng tài khoản, được thực thi trực tiếp trên môi trường Edge thông qua Web Crypto API. Hỗ trợ cơ chế tự động nâng cấp mật khẩu cũ (từ SHA-256 tĩnh) lên PBKDF2 khi đăng nhập thành công. Các route yêu cầu xác thực được kiểm tra bằng middleware JWT chính thức của Hono.
- **Cách ly dữ liệu người dùng (Multi-Tenant Isolation)** — Mọi truy vấn cơ sở dữ liệu đều được ràng buộc nghiêm ngặt bằng `userId` đã xác thực của client (`WHERE user_id = current_user_id`), ngăn chặn rò rỉ dữ liệu giữa các tài khoản.
- **Giới hạn lượt gọi API ở Edge (Rate Limiting)** — Cơ chế sliding window dựa trên IP giúp ngăn chặn tấn công DDoS và bruteforce (tối đa 60 requests/phút mỗi IP), trả về các HTTP headers chuẩn `X-RateLimit`.
- **Đồng bộ hóa trạng thái qua URL** — Trạng thái tìm kiếm/bộ lọc/sắp xếp/phân trang đều được lưu trực tiếp trên URL; F5 tải lại trang không bị mất trạng thái.
- **Cập nhật giao diện tức thời (Optimistic updates)** — Các hành động Đánh dấu hoàn thành hoặc Xóa sẽ cập nhật giao diện ngay lập tức và tự động hoàn tác (roll back) nếu mạng gặp sự cố.
- **Tích hợp PWA thủ công** — Sử dụng Service Worker tùy biến để lưu trữ tài nguyên tĩnh ngoại tuyến và bỏ qua các API động, giúp ứng dụng hoạt động mượt mà mà không phụ thuộc vào các plugin phức tạp dễ gây xung đột.

---

## Hướng dẫn cài đặt

### Yêu cầu hệ thống

- Node.js ≥ 20
- npm ≥ 10
- Tài khoản Cloudflare (để sử dụng D1 và Workers)
- Wrangler CLI: `npm install -g wrangler`

### Clone dự án và cài đặt dependencies

```bash
git clone <your-repo-url>
cd todo-app
npm install          # cài đặt cho tất cả workspaces
```

---

## Cấu hình Biến môi trường (Environment Variables)

### Backend

Sao chép file cấu hình mẫu `backend/.env.example` thành `backend/.dev.vars`:

```bash
cp backend/.env.example backend/.dev.vars
```

Thêm thông tin tài khoản Cloudflare và khóa bí mật ký JWT của bạn:

```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_d1_database_id
CLOUDFLARE_D1_TOKEN=your_d1_api_token
JWT_SECRET=your_jwt_signing_secret
```

### Frontend

Sao chép file cấu hình mẫu `frontend/.env.example` thành `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8787
```

---

## Cơ sở dữ liệu — Cloudflare D1

### Tạo cơ sở dữ liệu D1

```bash
npx wrangler d1 create todo-db
```

Sao chép mã `database_id` thu được và cấu hình `migrations_dir` trong file `backend/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "todo-db"
database_id = "YOUR_DATABASE_ID_HERE"
migrations_dir = "drizzle/migrations"
```

### Chạy migrations (Khởi tạo bảng)

**Chạy local** (dùng cho `wrangler dev`):

```bash
npm run db:migrate:local --workspace=backend
```

**Chạy remote** (dùng cho production D1):

```bash
npm run db:migrate:remote --workspace=backend
```

### Tạo dữ liệu mẫu (Seeding - Tùy chọn)

```bash
# Trên máy Local
npm run db:seed:local --workspace=backend

# Trên môi trường Remote
npm run db:seed:remote --workspace=backend
```

_(Lưu ý: Trong quá trình thiết lập remote ban đầu, nếu bảng cấu hình cũ bị xung đột với các migrations mới, hãy chạy lệnh sau: `npx wrangler d1 execute todo-db --remote --command="DROP TABLE IF EXISTS todos;"` trước)._

---

## Chạy ứng dụng dưới local

### Khởi động Backend (Môi trường local Cloudflare Workers)

```bash
npm run dev:backend
# API sẽ sẵn sàng tại http://127.0.0.1:8787
```

_Lưu ý: Khi khởi chạy lần đầu trên môi trường phát triển local, backend sẽ tự động tạo một tài khoản thử nghiệm nếu cơ sở dữ liệu trống:_

- **Email:** `test@example.com`
- **Mật khẩu:** `password123`

### Khởi động Frontend

```bash
npm run dev:frontend
# Ứng dụng sẽ sẵn sàng tại http://localhost:3000
```

---

## Triển khai (Deploy)

### Triển khai Backend lên Cloudflare Workers

```bash
cd backend
wrangler deploy
```

URL sau khi deploy thành công sẽ có dạng: `https://todo-app-backend.<your-subdomain>.workers.dev`

Cập nhật dòng `CORS_ORIGIN` trong file `wrangler.toml` thành URL frontend Vercel của bạn.

### Triển khai Frontend lên Vercel

1. Push mã nguồn lên kho chứa GitHub.
2. Import project vào [Vercel](https://vercel.com/new).
3. Đặt **Root Directory** là `frontend`.
4. Thêm biến môi trường:
   - `NEXT_PUBLIC_API_URL` = URL Backend Cloudflare Workers vừa deploy của bạn.
5. Tiến hành Deploy.

---

## Tài liệu API (API Documentation)

### Base URL

- Local: `http://127.0.0.1:8787`
- Production: `https://todo-app-backend.<subdomain>.workers.dev`

### Headers xác thực và giới hạn

Đối với các route được bảo vệ bên dưới `/todos/*`, bắt buộc phải cung cấp header HTTP `Authorization`:

```
Authorization: Bearer <your_jwt_token>
```

Mỗi phản hồi API đều đi kèm các header thông tin Rate Limit tiêu chuẩn:

- `X-RateLimit-Limit`: Số lượt yêu cầu tối đa được phép trong một khung thời gian (60).
- `X-RateLimit-Remaining`: Số lượt yêu cầu còn lại trong khung thời gian hiện tại.
- `X-RateLimit-Reset`: Thời điểm (timestamp) khung thời gian sẽ reset lại.

### Danh sách API Endpoints (Đã hoàn thành và hoạt động)

Các endpoint dưới đây đã được xây dựng hoàn tất và đang hoạt động đầy đủ trên server backend:

| Giao thức | Đường dẫn API       | yêu cầu Xác thực | Mô tả                                                      |
| :-------- | :------------------ | :--------------- | :--------------------------------------------------------- |
| `POST`    | `/auth/register`    | Không            | Tạo một tài khoản người dùng mới                           |
| `POST`    | `/auth/login`       | Không            | Xác thực tài khoản và trả về mã JWT token                  |
| `GET`     | `/health`           | Không            | Kiểm tra trạng thái hoạt động của hệ thống                 |
| `GET`     | `/todos`            | **Có**           | Lấy danh sách todos của user (hỗ trợ phân trang & sắp xếp) |
| `GET`     | `/todos/:id`        | **Có**           | Lấy thông tin chi tiết của một todo                        |
| `POST`    | `/todos`            | **Có**           | Tạo một todo mới dưới quyền user hiện tại                  |
| `PUT`     | `/todos/:id`        | **Có**           | Cập nhật thông tin một todo                                |
| `PATCH`   | `/todos/:id/toggle` | **Có**           | Đảo trạng thái hoàn thành (complete/pending)               |
| `DELETE`  | `/todos/:id`        | **Có**           | Xóa một todo                                               |

---

## Các tính năng đã hoàn thiện

- ✅ **Xác thực qua JWT** — Đăng nhập, đăng ký và tự động duy trì phiên đăng nhập bằng token (hiệu lực 7 ngày).
- ✅ **Cách ly dữ liệu Multi-Tenant** — Đảm bảo người dùng chỉ có thể xem/thay đổi công việc của chính mình.
- ✅ **Giới hạn lượt truy cập (Rate Limiting) ở Edge** — Ngăn ngừa tấn công DDoS và spam dò mật khẩu ngay từ các node mạng gần nhất.
- ✅ **Tích hợp PWA** — Cấu hình file manifest và cài đặt custom Service worker để lưu cache tải ứng dụng nhanh và hỗ trợ ngoại tuyến.
- ✅ **Tự động điền thông tin test (Autofill)** — Nút bấm điền nhanh tài khoản thử nghiệm giúp chấm bài thuận tiện và nhanh chóng.
- ✅ Đánh dấu hoàn thành/chưa hoàn thành công việc (có áp dụng optimistic update).
- ✅ Tìm kiếm công việc theo Tiêu đề và Mô tả (sử dụng debounce 300ms để giảm tải API).
- ✅ Lọc công việc theo trạng thái (Tất cả / Chưa hoàn thành / Đã hoàn thành).
- ✅ Sắp xếp công việc theo: mới nhất, cũ nhất, theo thứ tự chữ cái A-Z.
- ✅ Phân trang đầy đủ kèm theo metadata chi tiết.
- ✅ **Đồng bộ hóa URL** — Các trạng thái lọc, tìm kiếm, phân trang được giữ nguyên khi reload trang.
- ✅ Giao diện Dark mode (tự động theo hệ thống hoặc chuyển đổi thủ công).
- ✅ Thông báo Toast trực quan (khi thêm, sửa, xóa, hoặc báo lỗi).
- ✅ Giao diện đáp ứng (Responsive) hoàn toàn trên điện thoại, máy tính bảng và máy tính để bàn.
