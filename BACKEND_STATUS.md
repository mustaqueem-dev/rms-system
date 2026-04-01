# 📊 RMS Backend — Development Status Tracker
> **Last Updated:** April 2026  
> **Legend:** ✅ Done · 🔄 In Progress · ⏳ Not Started · ❌ Blocked

---

## Phase 1 — Foundation

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Turborepo monorepo root `package.json` | ✅ | workspaces: `apps/*`, `packages/*` — added 11 devDeps + 5 new scripts |
| 1.2 | Root `turbo.json` pipeline config | ✅ | added `test:e2e` + `clean` tasks; fixed invalid JS comment |
| 1.3 | Root `tsconfig.base.json` (strict mode) | ✅ | added `paths` aliases for `@rms/shared-kernel` & `@rms/event-contracts` |
| 1.4 | Root ESLint + Prettier config | ✅ | `.eslintrc.js` + `.prettierrc` + `.prettierignore` created |
| 1.5 | `docker-compose.yml` | ✅ | added `table-service` (3007) + `staff-service` (3008); updated `api-gateway` with all service URLs |
| 1.6 | `.env.example` at root | ✅ | all env variables documented across all 9 services |
| 1.7 | `Makefile` with dev shortcuts | ✅ | `make up`, `make dev`, `make test`, `make clean`, `make setup`, etc. |
| 1.8 | Root `jest.config.js` | ✅ | jest projects across all apps/packages; coverage thresholds configured |
| 1.9 | `npm install` (apply new devDeps) | ✅ | 207 packages added/updated |

---

## Phase 2 — Shared Packages

### `packages/shared-kernel`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | `core/UniqueEntity`, `ValueObject`, `Result`, `Guard` | ✅ | exists |
| 2.2 | `core/DomainEvent`, `UniqueEntityId`, `Identifier` | ✅ | exists |
| 2.3 | `errors/AppError`, `DomainError` | ✅ | exists |
| 2.4 | `infrastructure/Logger` | ✅ | exists, verify PII masking (NFR-S08) |
| 2.5 | `infrastructure/RedisCache` | ✅ | exists |
| 2.6 | `infrastructure/JwtAuthGuard` | ✅ | exists |
| 2.7 | `infrastructure/TenantContext` | ✅ | exists |
| 2.8 | `infrastructure/EventPublisher` interface | ✅ | exists |
| 2.9 | `infrastructure/KafkaPublisher` (Kafka impl) | ⏳ | concrete Kafka-backed publisher |
| 2.10 | `infrastructure/CircuitBreaker` | ⏳ | NFR-A06 |
| 2.11 | `decorators/Roles` decorator | ⏳ | `@Roles('MANAGER', 'ADMIN')` |
| 2.12 | `guards/RolesGuard` | ⏳ | RBAC enforcement |
| 2.13 | `interceptors/LoggingInterceptor` | ⏳ | req/res logging, mask PII |
| 2.14 | `interceptors/TraceInterceptor` | ⏳ | inject `traceId` into every response |
| 2.15 | `pipes/GlobalValidationPipe` | ⏳ | class-validator + sanitiser |
| 2.16 | `response/Envelope` helper | ⏳ | `{ success, data, error, meta, traceId }` |
| 2.17 | `types/pagination.types.ts` | ✅ | exists |
| 2.18 | `types/audit.types.ts` | ✅ | exists |

### `packages/event-contracts`

| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.19 | `auth.events.ts` | ✅ | exists |
| 2.20 | `menu.events.ts` | ✅ | exists |
| 2.21 | `inventory.events.ts` | ✅ | exists |
| 2.22 | `order.events.ts` | ✅ | exists |
| 2.23 | `notification.events.ts` | ✅ | exists |
| 2.24 | `table.events.ts` | ⏳ | `table.status_changed`, `reservation.created` |
| 2.25 | `staff.events.ts` | ⏳ | `shift.started`, `shift.ended` |
| 2.26 | `kds.events.ts` | ⏳ | `kds.order_assigned`, `kds.order_ready` |

---

## Phase 3 — Auth Service (`apps/auth-service` · Port 3004 · DB: `rms_auth`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Scaffold NestJS app | ⏳ | `nest new auth-service` inside `apps/` |
| 3.2 | Domain: `User` entity | ⏳ | includes role enum, branch/franchise refs |
| 3.3 | Domain: `Email` value object | ⏳ | lowercase, RFC 5321 validation |
| 3.4 | Domain: `Password` value object | ⏳ | bcrypt hashing, min 8 chars |
| 3.5 | App layer: `RegisterUseCase` | ⏳ | emit `auth.user_registered` |
| 3.6 | App layer: `LoginUseCase` | ⏳ | return access + refresh tokens |
| 3.7 | App layer: `RefreshTokenUseCase` | ⏳ | rotate refresh token |
| 3.8 | App layer: `LogoutUseCase` | ⏳ | invalidate refresh token |
| 3.9 | App layer: `ChangePasswordUseCase` | ⏳ | verify old password first |
| 3.10 | App layer: `ForgotPasswordUseCase` | ⏳ | generate OTP, emit Kafka event |
| 3.11 | App layer: `ResetPasswordUseCase` | ⏳ | validate OTP, update password |
| 3.12 | App layer: `GetProfileUseCase` | ⏳ | `GET /me` |
| 3.13 | App layer: `UpdateProfileUseCase` | ⏳ | `PATCH /me` |
| 3.14 | Infra: `UserSchema` (Mongoose) | ⏳ | indexes on `email`, `branchId`, `franchiseId` |
| 3.15 | Infra: `UserMongoRepository` | ⏳ | implements `IUserRepository` |
| 3.16 | Infra: `InMemoryUserRepository` | ⏳ | for unit tests |
| 3.17 | Infra: `JwtStrategy` (Passport) | ⏳ | validate JWT, attach user to request |
| 3.18 | Infra: `LocalStrategy` (Passport) | ⏳ | email/password login |
| 3.19 | Kafka producer: `auth.user_registered` | ⏳ | on register |
| 3.20 | Controllers: all 9 endpoints | ⏳ | with DTOs, class-validator |
| 3.21 | Unit tests (domain) | ⏳ | target 90%+ branch coverage |
| 3.22 | Integration tests (API) | ⏳ | MongoDB Memory Server |

---

## Phase 4 — Menu Service (`apps/menu-service` · Port 3001 · DB: `rms_menu`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Scaffold NestJS app | ⏳ | |
| 4.2 | Domain: `MenuItem` entity | ⏳ | price VO, variants, nutrition |
| 4.3 | Domain: `Category` entity | ⏳ | sortOrder, branch-scoped |
| 4.4 | Domain: `Price` value object | ⏳ | amount + currency enum |
| 4.5 | App: `CreateMenuItemUseCase` | ⏳ | |
| 4.6 | App: `UpdateMenuItemUseCase` | ⏳ | partial update |
| 4.7 | App: `DeleteMenuItemUseCase` | ⏳ | soft delete (set `isDeleted:true`) |
| 4.8 | App: `ToggleAvailabilityUseCase` | ⏳ | |
| 4.9 | App: `BulkUpdateUseCase` | ⏳ | activate/deactivate array of IDs |
| 4.10 | App: `SearchMenuItemsUseCase` | ⏳ | text search + filters + pagination |
| 4.11 | App: Category CRUD use-cases | ⏳ | create, update, delete |
| 4.12 | Infra: `MenuItemSchema` (Mongoose) | ⏳ | all 7 indexes from SRS §11.2 |
| 4.13 | Infra: `CategorySchema` (Mongoose) | ⏳ | |
| 4.14 | Infra: `MenuItemMongoRepository` | ⏳ | |
| 4.15 | Infra: `CategoryMongoRepository` | ⏳ | |
| 4.16 | Redis caching (branch menu list) | ⏳ | 60s TTL, invalidate on write |
| 4.17 | Kafka: emit `menu.item_created` | ⏳ | |
| 4.18 | Kafka: emit `menu.item_updated` | ⏳ | |
| 4.19 | Kafka: emit `menu.item_deleted` | ⏳ | |
| 4.20 | Kafka: emit `menu.item_availability_changed` | ⏳ | |
| 4.21 | Controllers: all 11 endpoints | ⏳ | with DTOs + query param validation |
| 4.22 | Unit tests | ⏳ | |
| 4.23 | Integration tests | ⏳ | |

---

## Phase 5 — Inventory Service (`apps/inventory-service` · Port 3002 · DB: `rms_inventory`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Scaffold NestJS app | ⏳ | |
| 5.2 | Domain: `StockItem` entity | ⏳ | |
| 5.3 | Domain: `StockAdjustment` entity | ⏳ | audit trail |
| 5.4 | App: `CreateStockItemUseCase` | ⏳ | |
| 5.5 | App: `AdjustStockUseCase` | ⏳ | MANUAL_IN / MANUAL_OUT |
| 5.6 | App: `DeductStockUseCase` | ⏳ | triggered by Kafka `order.placed` |
| 5.7 | App: `ListLowStockUseCase` | ⏳ | `qty <= reorderLevel` filter |
| 5.8 | Infra: `StockItemSchema` + `StockAdjustmentSchema` | ⏳ | |
| 5.9 | Infra: `StockItemMongoRepository` | ⏳ | |
| 5.10 | Kafka: consume `order.placed` → deduct stock | ⏳ | consumer group `inventory-service` |
| 5.11 | Kafka: emit `inventory.stock.low` | ⏳ | after deduction if below reorder level |
| 5.12 | Controllers: all 7 endpoints | ⏳ | |
| 5.13 | Unit tests | ⏳ | |
| 5.14 | Integration tests | ⏳ | |

---

## Phase 6 — Order Service (`apps/order-service` · Port 3003 · DB: `rms_orders`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | Scaffold NestJS app | ⏳ | |
| 6.2 | Domain: `Order` entity | ⏳ | |
| 6.3 | Domain: `OrderItem` value object | ⏳ | |
| 6.4 | Domain: Order status state machine | ⏳ | validate transitions |
| 6.5 | App: `PlaceOrderUseCase` | ⏳ | emit `order.placed` |
| 6.6 | App: `UpdateOrderStatusUseCase` | ⏳ | emit `order.status_changed` |
| 6.7 | App: `CancelOrderUseCase` | ⏳ | emit `order.cancelled` |
| 6.8 | App: `ListOrdersUseCase` | ⏳ | with status filter + pagination |
| 6.9 | App: `AssignKdsStationUseCase` | ⏳ | |
| 6.10 | App: `BumpOrderUseCase` | ⏳ | KDS bump |
| 6.11 | Infra: `OrderSchema` (Mongoose) | ⏳ | indexes on branchId, status, createdAt |
| 6.12 | Infra: `OrderMongoRepository` | ⏳ | |
| 6.13 | Kafka: emit `order.placed` | ⏳ | |
| 6.14 | Kafka: emit `order.status_changed` | ⏳ | |
| 6.15 | Kafka: emit `order.cancelled` | ⏳ | |
| 6.16 | WebSocket: `OrderGateway` setup | ⏳ | Socket.IO rooms by `branchId` |
| 6.17 | WebSocket: emit `order:new` | ⏳ | on order placed |
| 6.18 | WebSocket: emit `order:status_changed` | ⏳ | |
| 6.19 | WebSocket: emit `kds:order_assigned` | ⏳ | |
| 6.20 | WebSocket: handle `pos:order_create` | ⏳ | POS shortcut |
| 6.21 | WebSocket: handle `subscribe:branch` | ⏳ | room subscription |
| 6.22 | Controllers: all 7 endpoints | ⏳ | |
| 6.23 | Unit tests | ⏳ | |
| 6.24 | Integration tests | ⏳ | |

---

## Phase 7 — Table & Reservation Service (`apps/table-service` · Port 3007 · DB: `rms_tables`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Scaffold NestJS app | ⏳ | |
| 7.2 | Domain: `Table` entity | ⏳ | status enum, position, capacity |
| 7.3 | Domain: `Reservation` entity | ⏳ | |
| 7.4 | App: `CreateTableUseCase` | ⏳ | |
| 7.5 | App: `UpdateTableStatusUseCase` | ⏳ | emit `table.status_changed` |
| 7.6 | App: `SaveLayoutUseCase` | ⏳ | drag-and-drop position save |
| 7.7 | App: `CreateReservationUseCase` | ⏳ | emit `reservation.created` |
| 7.8 | App: `UpdateReservationUseCase` | ⏳ | |
| 7.9 | App: `CancelReservationUseCase` | ⏳ | |
| 7.10 | Infra: `TableSchema` + `ReservationSchema` | ⏳ | |
| 7.11 | Kafka: consume `order.placed` → mark OCCUPIED | ⏳ | |
| 7.12 | Kafka: consume `order.status_changed` → mark FREE | ⏳ | on COMPLETED |
| 7.13 | Kafka: emit `table.status_changed` | ⏳ | |
| 7.14 | WebSocket: emit `table:status_changed` | ⏳ | |
| 7.15 | Controllers: all 10 endpoints | ⏳ | |
| 7.16 | Unit tests | ⏳ | |
| 7.17 | Integration tests | ⏳ | |

---

## Phase 8 — Staff & Shift Service (`apps/staff-service` · Port 3008 · DB: `rms_staff`)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Scaffold NestJS app | ⏳ | |
| 8.2 | Domain: `ShiftSlot` entity | ⏳ | |
| 8.3 | Domain: `TimeEntry` entity | ⏳ | clock-in/out |
| 8.4 | App: `ScheduleShiftUseCase` | ⏳ | |
| 8.5 | App: `ClockInUseCase` | ⏳ | |
| 8.6 | App: `ClockOutUseCase` | ⏳ | calculate total minutes |
| 8.7 | App: `GetShiftHistoryUseCase` | ⏳ | |
| 8.8 | Infra: `ShiftSlotSchema` + `TimeEntrySchema` | ⏳ | |
| 8.9 | Kafka: emit `shift.started` / `shift.ended` | ⏳ | |
| 8.10 | Controllers: all 9 endpoints | ⏳ | |
| 8.11 | Unit tests | ⏳ | |
| 8.12 | Integration tests | ⏳ | |

---

## Phase 9 — Notification Service (`apps/notification-service` · Port 3005 · DB: None)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Scaffold NestJS app | ⏳ | |
| 9.2 | Kafka consumer: `order.placed` | ⏳ | enqueue `send-order-confirmation` job |
| 9.3 | Kafka consumer: `inventory.stock.low` | ⏳ | enqueue `send-low-stock-alert` job |
| 9.4 | Kafka consumer: `reservation.created` | ⏳ | enqueue `send-reservation-sms` job |
| 9.5 | BullMQ: `notifications-queue` setup | ⏳ | |
| 9.6 | Worker: `NotificationWorker` | ⏳ | processes all 3 job types |
| 9.7 | WhatsApp integration (Twilio/Meta WABA) | ⏳ | configurable via env |
| 9.8 | SMS integration (for reservations) | ⏳ | |
| 9.9 | Retry strategy: 3x with exponential backoff | ⏳ | |
| 9.10 | Dead-letter queue for failed jobs | ⏳ | |
| 9.11 | Unit tests (mock external APIs) | ⏳ | |

---

## Phase 10 — Reporting Service (`apps/reporting-service` · Port 3006 · DB: None)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Scaffold NestJS app | ⏳ | |
| 10.2 | BullMQ: `reports-queue` setup | ⏳ | |
| 10.3 | Worker: `ReportsWorker` | ⏳ | |
| 10.4 | Job: `generate-daily-sales` | ⏳ | PDF via pdfkit/puppeteer |
| 10.5 | Job: `generate-inventory-status` | ⏳ | PDF |
| 10.6 | Cron: schedule daily sales at 23:59 | ⏳ | `@nestjs/schedule` |
| 10.7 | PDF file storage (S3 or local `uploads/`) | ⏳ | |
| 10.8 | Analytics aggregation pipeline | ⏳ | MongoDB `$group`, `$lookup` |
| 10.9 | Controllers: 5 report endpoints | ⏳ | |
| 10.10 | Unit tests | ⏳ | |

---

## Phase 11 — API Gateway (`apps/api-gateway` · Port 3000 · DB: None)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Scaffold NestJS app | ⏳ | |
| 11.2 | `ThrottlerModule` — rate limiting | ⏳ | 1000/min per IP, 100/min per user |
| 11.3 | `HelmetModule` — security headers | ⏳ | |
| 11.4 | CORS with strict origin whitelist | ⏳ | NFR-S07 |
| 11.5 | Global `JwtAuthGuard` | ⏳ | from shared-kernel |
| 11.6 | Global `LoggingInterceptor` | ⏳ | |
| 11.7 | Global `TraceInterceptor` | ⏳ | inject `traceId` |
| 11.8 | Global `ValidationPipe` | ⏳ | |
| 11.9 | Proxy routes to all 7 services | ⏳ | http-proxy-middleware |
| 11.10 | WebSocket proxy (Socket.IO passthrough) | ⏳ | |
| 11.11 | `GET /health` endpoint (no auth) | ⏳ | |
| 11.12 | Integration tests | ⏳ | |

---

## Phase 12 — Security Hardening

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 12.1 | NFR-S01: TLS 1.3 | ⏳ | nginx/load balancer config |
| 12.2 | NFR-S02: MongoDB Field-Level Encryption | ⏳ | for PII fields |
| 12.3 | NFR-S03: OWASP ZAP in CI | ⏳ | see Phase 14 |
| 12.4 | NFR-S04: JWT 15m / Refresh 7d | ⏳ | JwtStrategy config |
| 12.5 | NFR-S05: Rate limiting | ⏳ | done in 11.2 |
| 12.6 | NFR-S06: Input sanitisation | ⏳ | class-sanitizer + ValidationPipe |
| 12.7 | NFR-S07: CORS whitelist | ⏳ | done in 11.4 |
| 12.8 | NFR-S08: PII masking in logs | ⏳ | LoggingInterceptor |
| 12.9 | NFR-S09: AWS Secrets Manager | ⏳ | prod config |
| 12.10 | NFR-S10: Audit logs (write ops) | ⏳ | LoggingInterceptor + AuditLog entity |

---

## Phase 13 — Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | Root `jest.config.js` with ts-jest | ✅ | created in Phase 1 |
| 13.2 | Unit tests: Auth Service (90%+ branch) | ⏳ | |
| 13.3 | Unit tests: Menu Service | ⏳ | |
| 13.4 | Unit tests: Inventory Service | ⏳ | |
| 13.5 | Unit tests: Order Service | ⏳ | |
| 13.6 | Unit tests: Table Service | ⏳ | |
| 13.7 | Integration tests: all services | ⏳ | MongoDB Memory Server |
| 13.8 | Contract tests: Kafka events (Pact.io) | ⏳ | |
| 13.9 | E2E tests: Playwright — Login flow | ⏳ | |
| 13.10 | E2E tests: Playwright — Menu flow | ⏳ | |
| 13.11 | E2E tests: Playwright — Order flow | ⏳ | |
| 13.12 | E2E tests: Playwright — Inventory flow | ⏳ | |
| 13.13 | Performance tests: k6 (500 concurrent) | ⏳ | NFR-P07/P08 |
| 13.14 | Security scan: OWASP ZAP DAST | ⏳ | |

---

## Phase 14 — CI/CD Pipeline

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14.1 | `.github/workflows/pr-check.yml` | ⏳ | lint → typecheck → unit → integration → security |
| 14.2 | `.github/workflows/build.yml` | ⏳ | Docker multi-stage → ECR → Trivy → Slack |
| 14.3 | `.github/workflows/staging.yml` | ⏳ | Helm upgrade → EKS → smoke → E2E → perf |
| 14.4 | `.github/workflows/production.yml` | ⏳ | Manual gate → blue-green → canary 5% → monitor |
| 14.5 | Dockerfile (multi-stage, per service) | ⏳ | node:20-alpine, non-root user |
| 14.6 | Helm charts (per service) | ⏳ | HPA: CPU 70%, Memory 80% |
| 14.7 | Turborepo remote cache config | ⏳ | speed up CI builds |

---

## Summary Dashboard

| Phase | Total Tasks | ✅ Done | 🔄 In Progress | ⏳ Not Started |
|-------|-------------|---------|----------------|---------------|
| 1 — Foundation | 9 | **9** | 0 | 0 |
| 2 — Shared Packages | 26 | 13 | 0 | 13 |
| 3 — Auth Service | 22 | 0 | 0 | 22 |
| 4 — Menu Service | 23 | 0 | 0 | 23 |
| 5 — Inventory Service | 14 | 0 | 0 | 14 |
| 6 — Order Service | 24 | 0 | 0 | 24 |
| 7 — Table Service | 17 | 0 | 0 | 17 |
| 8 — Staff Service | 12 | 0 | 0 | 12 |
| 9 — Notification Service | 11 | 0 | 0 | 11 |
| 10 — Reporting Service | 10 | 0 | 0 | 10 |
| 11 — API Gateway | 12 | 0 | 0 | 12 |
| 12 — Security | 10 | 0 | 0 | 10 |
| 13 — Testing | 14 | 1 | 0 | 13 |
| 14 — CI/CD | 7 | 0 | 0 | 7 |
| **TOTAL** | **211** | **23** | **0** | **188** |

> Update this table and individual task statuses as development progresses.  
> Change ⏳ → 🔄 when starting · 🔄 → ✅ when complete · ❌ if blocked (add reason in Notes).
