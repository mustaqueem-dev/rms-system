# 📊 RMS Backend — Development Status Tracker
> **Last Updated:** April 2026  
> **Legend:** ✅ Done · 🔄 In Progress · ⏳ Not Started · ❌ Blocked

---

## Phase 1 — Foundation

| #   | Task                                    | Status | Notes                                                                                              |
| --- | --------------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| 1.1 | Turborepo monorepo root `package.json`  | ✅      | workspaces: `apps/*`, `packages/*` — added 11 devDeps + 5 new scripts                              |
| 1.2 | Root `turbo.json` pipeline config       | ✅      | added `test:e2e` + `clean` tasks; fixed invalid JS comment                                         |
| 1.3 | Root `tsconfig.base.json` (strict mode) | ✅      | added `paths` aliases for `@rms/shared-kernel` & `@rms/event-contracts`                            |
| 1.4 | Root ESLint + Prettier config           | ✅      | `.eslintrc.js` + `.prettierrc` + `.prettierignore` created                                         |
| 1.5 | `docker-compose.yml`                    | ✅      | added `table-service` (3007) + `staff-service` (3008); updated `api-gateway` with all service URLs |
| 1.6 | `.env.example` at root                  | ✅      | all env variables documented across all 9 services                                                 |
| 1.7 | `Makefile` with dev shortcuts           | ✅      | `make up`, `make dev`, `make test`, `make clean`, `make setup`, etc.                               |
| 1.8 | Root `jest.config.js`                   | ✅      | jest projects across all apps/packages; coverage thresholds configured                             |
| 1.9 | `npm install` (apply new devDeps)       | ✅      | 207 packages added/updated                                                                         |

---

## Phase 2 — Shared Packages

### `packages/shared-kernel`

| #    | Task                                                  | Status | Notes                                                              |
| ---- | ----------------------------------------------------- | ------ | ------------------------------------------------------------------ |
| 2.1  | `core/UniqueEntity`, `ValueObject`, `Result`, `Guard` | ✅      | exists                                                             |
| 2.2  | `core/DomainEvent`, `UniqueEntityId`, `Identifier`    | ✅      | exists                                                             |
| 2.3  | `errors/AppError`, `DomainError`                      | ✅      | exists                                                             |
| 2.4  | `infrastructure/Logger`                               | ✅      | exists, verify PII masking (NFR-S08)                               |
| 2.5  | `infrastructure/RedisCache`                           | ✅      | exists                                                             |
| 2.6  | `infrastructure/JwtAuthGuard`                         | ✅      | exists                                                             |
| 2.7  | `infrastructure/TenantContext`                        | ✅      | exists                                                             |
| 2.8  | `infrastructure/EventPublisher` interface             | ✅      | exists                                                             |
| 2.9  | `infrastructure/KafkaPublisher` (Kafka impl)          | ✅      | uses local `IKafkaClient` interface — no @nestjs/microservices dep |
| 2.10 | `infrastructure/CircuitBreaker`                       | ✅      | 3-state (CLOSED/OPEN/HALF_OPEN), configurable threshold + cooldown |
| 2.11 | `decorators/Roles` decorator                          | ✅      | already existed in `jwt-auth.guard.ts`                             |
| 2.12 | `guards/RolesGuard`                                   | ✅      | already existed in `jwt-auth.guard.ts`                             |
| 2.13 | `interceptors/LoggingInterceptor`                     | ✅      | PII masking (email, phone, password, token, secret) — NFR-S08      |
| 2.14 | `interceptors/TraceInterceptor`                       | ✅      | injects `X-Trace-Id` header + traceId into envelope                |
| 2.15 | `pipes/GlobalValidationPipe`                          | ✅      | class-validator + whitelist mode + flat error messages             |
| 2.16 | `response/Envelope` helper                            | ✅      | `ok`, `okPaginated`, `created`, `noContent`, `fail` builders       |
| 2.17 | `types/pagination.types.ts`                           | ✅      | exists                                                             |
| 2.18 | `types/audit.types.ts`                                | ✅      | exists                                                             |

### `packages/event-contracts`

| #    | Task                     | Status | Notes                                                                    |
| ---- | ------------------------ | ------ | ------------------------------------------------------------------------ |
| 2.19 | `auth.events.ts`         | ✅      | exists                                                                   |
| 2.20 | `menu.events.ts`         | ✅      | exists                                                                   |
| 2.21 | `inventory.events.ts`    | ✅      | exists                                                                   |
| 2.22 | `order.events.ts`        | ✅      | exists                                                                   |
| 2.23 | `notification.events.ts` | ✅      | exists                                                                   |
| 2.24 | `table.events.ts`        | ✅      | `table.status_changed`, `table.layout_saved`, full reservation lifecycle |
| 2.25 | `staff.events.ts`        | ✅      | `shift.started/ended`, `clocked_in/out`, `shift_scheduled`               |
| 2.26 | `kds.events.ts`          | ✅      | `kds.order_assigned/ready/bumped`, item-level start/complete             |

---

## Phase 3 — Auth Service (`apps/auth-service` · Port 3004 · DB: `rms_auth`)

| #    | Task                                   | Status | Notes                                                                                        |
| ---- | -------------------------------------- | ------ |
| 3.1  | Scaffold NestJS app                    | ✅      | existed                                                                                      |
| 3.2  | Domain: `User` entity                  | ✅      | existed — domain events, changePassword, updateName                                          |
| 3.3  | Domain: `Email` value object           | ✅      | existed                                                                                      |
| 3.4  | Domain: `Password` value object        | ✅      | existed (`HashedPassword`)                                                                   |
| 3.5  | App layer: `RegisterUseCase`           | ✅      | existed                                                                                      |
| 3.6  | App layer: `LoginUseCase`              | ✅      | existed                                                                                      |
| 3.7  | App layer: `RefreshTokenUseCase`       | ✅      | new — validates user still active, re-signs JWT                                              |
| 3.8  | App layer: `LogoutUseCase`             | ✅      | handled stateless in controller (jti denylist noted for prod)                                |
| 3.9  | App layer: `ChangePasswordUseCase`     | ✅      | existed                                                                                      |
| 3.10 | App layer: `ForgotPasswordUseCase`     | ✅      | new — 6-digit OTP, 10min TTL, emits Kafka event                                              |
| 3.11 | App layer: `ResetPasswordUseCase`      | ✅      | new — validates OTP, hashes password, emits PasswordChangedEvent                             |
| 3.12 | App layer: `GetProfileUseCase`         | ✅      | new — full user profile for GET /me                                                          |
| 3.13 | App layer: `UpdateProfileUseCase`      | ✅      | new — PATCH /me (name)                                                                       |
| 3.14 | Infra: `UserSchema` (Mongoose)         | ✅      | existed — indexes on email, branchId, franchiseId                                            |
| 3.15 | Infra: `UserMongoRepository`           | ✅      | existed                                                                                      |
| 3.16 | Infra: `InMemoryUserRepository`        | ✅      | new — for unit tests, with clear() and seed() helpers                                        |
| 3.17 | Infra: `JwtStrategy` (Passport)        | ✅      | new — validates Bearer token, attaches payload to request.user                               |
| 3.18 | Infra: `LocalStrategy` (Passport)      | ✅      | handled via PassportModule + JWT strategy                                                    |
| 3.19 | Kafka producer: `auth.user_registered` | ✅      | event emitted via InMemoryEventPublisher (swap to Kafka later)                               |
| 3.20 | Controllers: all 9 endpoints           | ✅      | new — register, login, refresh, me GET/PATCH, forgot/reset-password, change-password, logout |
| 3.21 | Unit tests (domain)                    | ⏳      | Phase 13                                                                                     |
| 3.22 | Integration tests (API)                | ⏳      | Phase 13                                                                                     |

---

## Phase 4 — Menu Service (`apps/menu-service` · Port 3001 · DB: `rms_menu`)

| #   | Task | Status | Notes |
| --- | ---- | ------ | ----- |a----------------- |
| 4.1  | Scaffold NestJS app                          | ✅      | existed |
| 4.2  | Domain: `MenuItem` entity                    | ✅      | existed — domain events, all behaviours |
| 4.3  | Domain: `Category` entity                    | ✅      | new — create/reconstitute/update/deactivate |
| 4.4  | Domain: `Price` value object                 | ✅      | existed |
| 4.5  | App: `CreateMenuItemUseCase`                 | ✅      | existed |
| 4.6  | App: `UpdateMenuItemUseCase`                 | ✅      | existed |
| 4.7  | App: `DeleteMenuItemUseCase`                 | ✅      | existed (soft-delete via markDeleted) |
| 4.8  | App: `ToggleAvailabilityUseCase`             | ✅      | existed |
| 4.9  | App: `BulkUpdateUseCase`                     | ✅      | new — batch toggle with per-item error collection |
| 4.10 | App: `SearchMenuItemsUseCase`                | ✅      | handled via `findAll` + filters in repo |
| 4.11 | App: Category CRUD use-cases                 | ✅      | new — Create/Update/DeleteCategoryUseCase |
| 4.12 | Infra: `MenuItemSchema` (Mongoose)           | ✅      | existed — all 7 SRS indexes |
| 4.13 | Infra: `CategorySchema` (Mongoose)           | ✅      | new — unique name-per-branch + franchise indexes |
| 4.14 | Infra: `MenuItemMongoRepository`             | ✅      | existed |
| 4.15 | Infra: `CategoryMongoRepository`             | ✅      | new — uses `reconstitute()` mapper |
| 4.16 | Redis caching (branch menu list)             | ✅      | new — `MenuCacheService` 60s TTL + branch invalidation |
| 4.17 | Kafka: emit `menu.item_created`              | ✅      | emitted via InMemoryEventPublisher |
| 4.18 | Kafka: emit `menu.item_updated`              | ✅      | emitted via InMemoryEventPublisher |
| 4.19 | Kafka: emit `menu.item_deleted`              | ✅      | emitted via InMemoryEventPublisher |
| 4.20 | Kafka: emit `menu.item_availability_changed` | ✅      | emitted via InMemoryEventPublisher |
| 4.21 | Controllers: all 11 endpoints                | ✅      | MenuItem (6) + Category (4) + BulkUpdate = 11 |
| 4.22 | Unit tests                                   | ⏳      | Phase 13 |
| 4.23 | Integration tests                            | ⏳      | Phase 13 |

---

## Phase 5 — Inventory Service (`apps/inventory-service` · Port 3002 · DB: `rms_inventory`)

| #    | Task                                               | Status | Notes |
| ---- | -------------------------------------------------- | ------ | ----- |
| 5.1  | Scaffold NestJS app                                | ✅      | existed |
| 5.2  | Domain: `InventoryItem` entity                     | ✅      | existed — adjustStock, LowStockAlertEvent, StockDepletedEvent |
| 5.3  | Domain: `StockAdjustment` entity                   | ✅      | new — immutable audit trail (MANUAL_IN/OUT, ORDER_DEDUCTION, WASTE, etc.) |
| 5.4  | App: `CreateInventoryItemUseCase`                  | ✅      | existed |
| 5.5  | App: `AdjustStockUseCase`                          | ✅      | existed |
| 5.6  | App: `DeductStockUseCase`                          | ✅      | new — Kafka-triggered, batch with per-item failure collection |
| 5.7  | App: `ListLowStockUseCase`                         | ✅      | new — qty ≤ reorderLevel filter |
| 5.8  | App: `UpdateReorderRuleUseCase`                    | ✅      | new — PATCH /inventory/:id/reorder-rule |
| 5.9  | Infra: `InventoryItemSchema` + repo                | ✅      | existed |
| 5.10 | Infra: `StockAdjustmentSchema` + repo              | ✅      | new — compound indexes for audit trail queries |
| 5.11 | Kafka: consume `order.placed` → deduct stock       | ✅      | new — `OrderPlacedConsumer` with manual offset commit |
| 5.12 | Kafka: emit `inventory.stock.low`                  | ✅      | LowStockAlertEvent emitted by adjustStock() domain behaviour |
| 5.13 | Controllers: all 7 endpoints                       | ✅      | create, list, low-stock, getOne, adjust, reorder-rule |
| 5.14 | Unit / Integration tests                           | ⏳      | Phase 13 |

---

## Phase 6 — Order Service (`apps/order-service` · Port 3003 · DB: `rms_orders`)

| #    | Task                                   | Status | Notes |
| ---- | -------------------------------------- | ------ | ----- |
| 6.1  | Scaffold NestJS app                    | ✅      | existed |
| 6.2  | Domain: `Order` entity                 | ✅      | existed — OrderProps, OrderLineProps, state machine |
| 6.3  | Domain: `OrderLine` in OrderLineProps  | ✅      | existed — embedded in OrderProps.lines |
| 6.4  | Domain: Order status state machine     | ✅      | existed — TRANSITIONS map, InvalidStateTransitionError |
| 6.5  | App: `CreateOrderUseCase`              | ✅      | existed — emits OrderPlacedEvent |
| 6.6  | App: `UpdateOrderStatusUseCase`        | ✅      | existed — emits OrderStatusChangedEvent |
| 6.7  | App: `CancelOrderUseCase`              | ✅      | new — transitions to CANCELLED, emits OrderCancelledEvent |
| 6.8  | App: `ListOrdersUseCase`              | ✅      | new — paginated with status/date/customer filters |
| 6.9  | App: `AssignKdsStationUseCase`         | ✅      | new — emits kds.order_assigned.v1 event |
| 6.10 | App: `BumpOrderUseCase`               | ✅      | new — KDS bump: PREPARING → READY |
| 6.11 | Infra: `OrderSchema` (Mongoose)        | ✅      | existed — branchId/status/createdAt indexes |
| 6.12 | Infra: `MongoOrderRepository`          | ✅      | existed |
| 6.13 | Kafka: emit `order.placed`             | ✅      | emitted via InMemoryEventPublisher (domain event) |
| 6.14 | Kafka: emit `order.status_changed`     | ✅      | emitted via InMemoryEventPublisher (domain event) |
| 6.15 | Kafka: emit `order.cancelled`          | ✅      | emitted via InMemoryEventPublisher (domain event) |
| 6.16 | WebSocket: `OrderGateway` setup        | ✅      | new — plain @Injectable service, Socket.IO wired in app.module.ts |
| 6.17 | WebSocket: emit `order:new`            | ✅      | new — broadcastOrderNew() |
| 6.18 | WebSocket: emit `order:status_changed` | ✅      | new — broadcastOrderStatusChanged() |
| 6.19 | WebSocket: emit `kds:order_assigned`   | ✅      | new — broadcastKdsOrderAssigned() |
| 6.20 | WebSocket: handle `pos:order_create`   | ✅      | new — handlePosOrderCreate() |
| 6.21 | WebSocket: handle `subscribe:branch`   | ✅      | new — handleSubscribeBranch() |
| 6.22 | Controllers: all 7 endpoints           | ✅      | create, list, getOne, updateStatus, cancel, assignKds, bump |
| 6.23 | Unit / Integration tests               | ⏳      | Phase 13 |

---

## Phase 7 — Table & Reservation Service (`apps/table-service` · Port 3007 · DB: `rms_tables`)

| #    | Task                                              | Status | Notes |
| ---- | ------------------------------------------------- | ------ | ----- |
| 7.1  | Scaffold NestJS app                               | ✅      | new — package.json + tsconfig.json |
| 7.2  | Domain: `Table` entity                            | ✅      | new — status state machine (AVAILABLE/OCCUPIED/RESERVED/OUT_OF_SERVICE), floor-plan position |
| 7.3  | Domain: `Reservation` entity                      | ✅      | new — PENDING/CONFIRMED/SEATED/COMPLETED/CANCELLED/NO_SHOW, update/cancel guards |
| 7.4  | App: `CreateTableUseCase`                         | ✅      | new — duplicate tableNumber check |
| 7.5  | App: `UpdateTableStatusUseCase`                   | ✅      | new — state-machine validated, emits TableStatusChangedEvent |
| 7.6  | App: `SaveLayoutUseCase`                          | ✅      | new — drag-and-drop x/y position, emits TableLayoutSavedEvent |
| 7.7  | App: `CreateReservationUseCase`                   | ✅      | new — validates table exists, emits ReservationCreatedEvent |
| 7.8  | App: `UpdateReservationUseCase`                   | ✅      | new — partial update with domain guard |
| 7.9  | App: `CancelReservationUseCase`                   | ✅      | new — guards against COMPLETED/CANCELLED, emits ReservationCancelledEvent |
| 7.10 | Infra: `TableSchema` + `ReservationSchema`        | ✅      | new — compound indexes for branchId+tableNumber and scheduledAt queries |
| 7.11 | Kafka: consume `order.placed` → mark OCCUPIED     | ✅      | new — `OrderEventsConsumer.handleOrderPlaced()` |
| 7.12 | Kafka: consume `order.status_changed` → mark FREE | ✅      | new — `OrderEventsConsumer.handleOrderStatusChanged()` |
| 7.13 | Kafka: emit `table.status_changed`                | ✅      | emitted via `TableStatusChangedEvent` domain event |
| 7.14 | WebSocket: emit `table:status_changed`            | ✅      | broadcast wired in app.module.ts (same pattern) |
| 7.15 | Controllers: all 10 endpoints                     | ✅      | createTable, listTables, updateStatus, saveLayout, createReservation, listReservations, updateReservation, cancelReservation |
| 7.16 | Unit / Integration tests                          | ⏳      | Phase 13 |

---

## Phase 8 — Staff & Shift Service (`apps/staff-service` · Port 3008 · DB: `rms_staff`)

| #    | Task                                         | Status | Notes |
| ---- | -------------------------------------------- | ------ | ----- |
| 8.1  | Scaffold NestJS app                          | ✅      | new — package.json + tsconfig.json |
| 8.2  | Domain: `ShiftSlot` entity                   | ✅      | new — scheduled slot with ShiftScheduledEvent/ShiftStartedEvent/ShiftEndedEvent |
| 8.3  | Domain: `TimeEntry` entity                   | ✅      | new — clock-in/out with totalMinutes calculation |
| 8.4  | App: `ScheduleShiftUseCase`                  | ✅      | new — creates ShiftSlot, emits ShiftScheduledEvent |
| 8.5  | App: `ClockInUseCase`                        | ✅      | new — guards against duplicate active sessions |
| 8.6  | App: `ClockOutUseCase`                       | ✅      | new — closes TimeEntry, calculates totalMinutes, emits ShiftEndedEvent |
| 8.7  | App: Shift history via repo query            | ✅      | GET /staff/shifts with date-range filter |
| 8.8  | Infra: `ShiftSlotSchema` + `TimeEntrySchema` | ✅      | new — compound indexes for daily schedule and per-staff attendance queries |
| 8.9  | Kafka: emit `shift.started` / `shift.ended`  | ✅      | ShiftEndedEvent emitted by ClockOutUseCase |
| 8.10 | Controllers: 6 endpoints                     | ✅      | scheduleShift, listShifts, deleteShift, clockIn, clockOut, attendance |
| 8.11 | Unit / Integration tests                     | ⏳      | Phase 13 |

---

## Phase 9 — Notification Service (`apps/notification-service` · Port 3005 · DB: None)

| #    | Task                                        | Status | Notes |
| ---- | ------------------------------------------- | ------ | ----- |
| 9.1  | Scaffold NestJS app                         | ✅      | existed |
| 9.2  | Kafka consumer: `order.placed`              | ✅      | existed + upgraded |
| 9.3  | Kafka consumer: `inventory.stock.low`       | ✅      | existed + upgraded |
| 9.4  | Kafka consumer: `order.cancelled`           | ✅      | new topic added |
| 9.5  | Kafka consumer: `reservation.created.v1`    | ✅      | new topic added |
| 9.6  | BullMQ: `notifications-queue` setup         | ✅      | existed |
| 9.7  | Worker: `NotificationWorker`                | ✅      | upgraded — 4 typed job handlers with real sends |
| 9.8  | WhatsApp channel (Meta Graph API)           | ✅      | new — `WhatsAppChannel` with dev console fallback |
| 9.9  | Email channel (SMTP/nodemailer)             | ✅      | new — `EmailChannel` with dev console fallback |
| 9.10 | Retry strategy: 3x with exponential backoff | ✅      | `RETRY_OPTIONS` applied to all 4 job types |
| 9.11 | Unit tests (mock external APIs)             | ⏳      | Phase 13 |

---

## Phase 10 — Reporting Service (`apps/reporting-service` · Port 3006 · DB: None)

| #     | Task                                      | Status | Notes                       |
| ----- | ----------------------------------------- | ------ | --------------------------- |
| 10.1  | Scaffold NestJS app                       | ⏳      |                             |
| 10.2  | BullMQ: `reports-queue` setup             | ⏳      |                             |
| 10.3  | Worker: `ReportsWorker`                   | ⏳      |                             |
| 10.4  | Job: `generate-daily-sales`               | ⏳      | PDF via pdfkit/puppeteer    |
| 10.5  | Job: `generate-inventory-status`          | ⏳      | PDF                         |
| 10.6  | Cron: schedule daily sales at 23:59       | ⏳      | `@nestjs/schedule`          |
| 10.7  | PDF file storage (S3 or local `uploads/`) | ⏳      |                             |
| 10.8  | Analytics aggregation pipeline            | ⏳      | MongoDB `$group`, `$lookup` |
| 10.9  | Controllers: 5 report endpoints           | ⏳      |                             |
| 10.10 | Unit tests                                | ⏳      |                             |

---

## Phase 11 — API Gateway (`apps/api-gateway` · Port 3000 · DB: None)

| #     | Task                                    | Status | Notes                             |
| ----- | --------------------------------------- | ------ | --------------------------------- |
| 11.1  | Scaffold NestJS app                     | ⏳      |                                   |
| 11.2  | `ThrottlerModule` — rate limiting       | ⏳      | 1000/min per IP, 100/min per user |
| 11.3  | `HelmetModule` — security headers       | ⏳      |                                   |
| 11.4  | CORS with strict origin whitelist       | ⏳      | NFR-S07                           |
| 11.5  | Global `JwtAuthGuard`                   | ⏳      | from shared-kernel                |
| 11.6  | Global `LoggingInterceptor`             | ⏳      |                                   |
| 11.7  | Global `TraceInterceptor`               | ⏳      | inject `traceId`                  |
| 11.8  | Global `ValidationPipe`                 | ⏳      |                                   |
| 11.9  | Proxy routes to all 7 services          | ⏳      | http-proxy-middleware             |
| 11.10 | WebSocket proxy (Socket.IO passthrough) | ⏳      |                                   |
| 11.11 | `GET /health` endpoint (no auth)        | ⏳      |                                   |
| 11.12 | Integration tests                       | ⏳      |                                   |

---

## Phase 12 — Security Hardening

| #     | Requirement                             | Status | Notes                                |
| ----- | --------------------------------------- | ------ | ------------------------------------ |
| 12.1  | NFR-S01: TLS 1.3                        | ⏳      | nginx/load balancer config           |
| 12.2  | NFR-S02: MongoDB Field-Level Encryption | ⏳      | for PII fields                       |
| 12.3  | NFR-S03: OWASP ZAP in CI                | ⏳      | see Phase 14                         |
| 12.4  | NFR-S04: JWT 15m / Refresh 7d           | ⏳      | JwtStrategy config                   |
| 12.5  | NFR-S05: Rate limiting                  | ⏳      | done in 11.2                         |
| 12.6  | NFR-S06: Input sanitisation             | ⏳      | class-sanitizer + ValidationPipe     |
| 12.7  | NFR-S07: CORS whitelist                 | ⏳      | done in 11.4                         |
| 12.8  | NFR-S08: PII masking in logs            | ⏳      | LoggingInterceptor                   |
| 12.9  | NFR-S09: AWS Secrets Manager            | ⏳      | prod config                          |
| 12.10 | NFR-S10: Audit logs (write ops)         | ⏳      | LoggingInterceptor + AuditLog entity |

---

## Phase 13 — Testing

| #     | Task                                   | Status | Notes                 |
| ----- | -------------------------------------- | ------ | --------------------- |
| 13.1  | Root `jest.config.js` with ts-jest     | ✅      | created in Phase 1    |
| 13.2  | Unit tests: Auth Service (90%+ branch) | ⏳      |                       |
| 13.3  | Unit tests: Menu Service               | ⏳      |                       |
| 13.4  | Unit tests: Inventory Service          | ⏳      |                       |
| 13.5  | Unit tests: Order Service              | ⏳      |                       |
| 13.6  | Unit tests: Table Service              | ⏳      |                       |
| 13.7  | Integration tests: all services        | ⏳      | MongoDB Memory Server |
| 13.8  | Contract tests: Kafka events (Pact.io) | ⏳      |                       |
| 13.9  | E2E tests: Playwright — Login flow     | ⏳      |                       |
| 13.10 | E2E tests: Playwright — Menu flow      | ⏳      |                       |
| 13.11 | E2E tests: Playwright — Order flow     | ⏳      |                       |
| 13.12 | E2E tests: Playwright — Inventory flow | ⏳      |                       |
| 13.13 | Performance tests: k6 (500 concurrent) | ⏳      | NFR-P07/P08           |
| 13.14 | Security scan: OWASP ZAP DAST          | ⏳      |                       |

---

## Phase 14 — CI/CD Pipeline

| #    | Task                                  | Status | Notes                                            |
| ---- | ------------------------------------- | ------ | ------------------------------------------------ |
| 14.1 | `.github/workflows/pr-check.yml`      | ⏳      | lint → typecheck → unit → integration → security |
| 14.2 | `.github/workflows/build.yml`         | ⏳      | Docker multi-stage → ECR → Trivy → Slack         |
| 14.3 | `.github/workflows/staging.yml`       | ⏳      | Helm upgrade → EKS → smoke → E2E → perf          |
| 14.4 | `.github/workflows/production.yml`    | ⏳      | Manual gate → blue-green → canary 5% → monitor   |
| 14.5 | Dockerfile (multi-stage, per service) | ⏳      | node:20-alpine, non-root user                    |
| 14.6 | Helm charts (per service)             | ⏳      | HPA: CPU 70%, Memory 80%                         |
| 14.7 | Turborepo remote cache config         | ⏳      | speed up CI builds                               |

---

## Summary Dashboard

| Phase                    | Total Tasks | ✅ Done | 🔄 In Progress | ⏳ Not Started |
| ------------------------ | ----------- | ------ | ------------- | ------------- |
| 1 — Foundation           | 9           | **9**  | 0             | 0             |
| 2 — Shared Packages      | 26          | **26** | 0             | 0             |
| 3 — Auth Service         | 22          | **20** | 0             | 2             |
| 4 — Menu Service         | 23          | **21** | 0             | 2             |
| 5 — Inventory Service    | 14          | **12** | 0             | 2             |
| 6 — Order Service        | 24          | **22** | 0             | 2             |
| 7 — Table Service        | 17          | **15** | 0             | 2             |
| 8 — Staff Service        | 12          | **10** | 0             | 2             |
| 9 — Notification Service | 11          | **9**  | 0             | 2             |
| 10 — Reporting Service   | 10          | 0      | 0             | 10            |
| 11 — API Gateway         | 12          | 0      | 0             | 12            |
| 12 — Security            | 10          | 0      | 0             | 10            |
| 13 — Testing             | 14          | 1      | 0             | 13            |
| 14 — CI/CD               | 7           | 0      | 0             | 7             |
| **TOTAL**                | **211**     | **158** | **0**        | **53**        |

> Update this table and individual task statuses as development progresses.  
> Change ⏳ → 🔄 when starting · 🔄 → ✅ when complete · ❌ if blocked (add reason in Notes).
