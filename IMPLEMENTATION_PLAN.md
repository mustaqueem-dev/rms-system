# 🏗️ RMS Backend — Master Implementation Plan
> **Source:** RMS_SRS_v2.docx | **Generated:** April 2026  
> **Architecture:** NestJS Monorepo · Microservices · Kafka · MongoDB · Redis · BullMQ

---

## Table of Contents
1. [Repository & Monorepo Setup](#1-repository--monorepo-setup)
2. [Shared Infrastructure Packages](#2-shared-infrastructure-packages)
3. [API Gateway Service](#3-api-gateway-service)
4. [Auth Service](#4-auth-service)
5. [Menu Service](#5-menu-service)
6. [Inventory Service](#6-inventory-service)
7. [Order Service](#7-order-service)
8. [Table & Reservation Service](#8-table--reservation-service)
9. [Staff & Shift Service](#9-staff--shift-service)
10. [Notification Service](#10-notification-service)
11. [Reporting Service](#11-reporting-service)
12. [WebSocket / Real-time Layer](#12-websocket--real-time-layer)
13. [KDS (Kitchen Display System) Backend](#13-kds-kitchen-display-system-backend)
14. [Security Hardening](#14-security-hardening)
15. [Testing Strategy](#15-testing-strategy)
16. [CI/CD Pipeline](#16-cicd-pipeline)

---

## 1. Repository & Monorepo Setup

### Goal
Bootstrap a Turborepo/NestJS monorepo so all microservices share build tooling, linting, and type checking.

### Steps
1. Create root `package.json` with `workspaces: ["apps/*", "packages/*"]`
2. Configure `turbo.json` with pipelines: `build`, `dev`, `test`, `typecheck`, `lint`
3. Add root `tsconfig.base.json` with strict mode, path aliases
4. Add `docker-compose.yml` with: `mongodb` (x4 named DBs), `redis`, `kafka`, `zookeeper`, `mongo-express`, `redis-commander`
5. Add `.env.example` with all required variables (see §12.4 of SRS)
6. Install shared `eslint`, `prettier`, `jest` configs at root level

### Directory Structure
```
rms-backend/
├── apps/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── menu-service/
│   ├── inventory-service/
│   ├── order-service/
│   ├── table-service/
│   ├── staff-service/
│   ├── notification-service/
│   └── reporting-service/
├── packages/
│   ├── shared-kernel/      ✅ EXISTS
│   └── event-contracts/    ✅ EXISTS
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 2. Shared Infrastructure Packages

### 2a. `packages/shared-kernel` ✅ (Partially Built)

#### What exists
- `core/` — `UniqueEntity`, `ValueObject`, `DomainEvent`, `Result`, `Guard`
- `errors/` — `AppError`, `DomainError`
- `infrastructure/` — `Logger`, `RedisCache`, `JwtAuthGuard`, `TenantContext`, `EventPublisher`

#### What to add / complete
| File | Purpose |
|------|---------|
| `src/types/pagination.types.ts` | `PaginationMeta`, `PaginatedResult<T>` |
| `src/types/audit.types.ts` | `AuditLog` interface |
| `src/infrastructure/kafka-publisher.ts` | Kafka-backed `IEventPublisher` impl |
| `src/infrastructure/circuit-breaker.ts` | Circuit breaker wrapper (NFR-A06) |
| `src/decorators/roles.decorator.ts` | `@Roles(...)` metadata decorator |
| `src/guards/roles.guard.ts` | Role-based guard |
| `src/interceptors/logging.interceptor.ts` | Request/response logging (PII-masked) |
| `src/interceptors/trace.interceptor.ts` | Inject `traceId` into every response |
| `src/pipes/validation.pipe.ts` | Global validation + sanitisation |
| `src/response/envelope.ts` | Standard `{ success, data, error, meta, traceId }` envelope |

### 2b. `packages/event-contracts` ✅ (Partially Built)

#### What exists
- `auth.events.ts`, `menu.events.ts`, `inventory.events.ts`, `order.events.ts`, `notification.events.ts`

#### What to add
| File | Events |
|------|--------|
| `table.events.ts` | `table.status_changed`, `reservation.created` |
| `staff.events.ts` | `shift.started`, `shift.ended` |
| `kds.events.ts` | `kds.order_assigned`, `kds.order_ready` |

---

## 3. API Gateway Service

### Port: 3000 | DB: None

### Responsibility
Single entry point — JWT validation, rate limiting, routing, CORS, request tracing.

### Steps
1. Scaffold NestJS app: `apps/api-gateway/`
2. Install: `@nestjs/throttler`, `http-proxy-middleware`, `helmet`
3. Implement `AppModule` with:
   - `ThrottlerModule` — 1000 req/min per IP, 100/min per user
   - `HelmetModule` — security HTTP headers
   - Global `JwtAuthGuard` from shared-kernel
   - Global `LoggingInterceptor` + `TraceInterceptor`
   - Global `ValidationPipe`
4. Create `ProxyModule` with routes:
   | Prefix | Target Service | Port |
   |--------|---------------|------|
   | `/api/v1/auth` | auth-service | 3004 |
   | `/api/v1/menu` | menu-service | 3001 |
   | `/api/v1/inventory` | inventory-service | 3002 |
   | `/api/v1/orders` | order-service | 3003 |
   | `/api/v1/tables` | table-service | 3007 |
   | `/api/v1/staff` | staff-service | 3008 |
   | `/api/v1/reports` | reporting-service | 3006 |
5. Implement CORS with strict origin whitelist (NFR-S07)
6. Expose `/health` endpoint (no auth)
7. WebSocket proxy passthrough for Socket.IO events (§10.3 of SRS)

---

## 4. Auth Service

### Port: 3004 | DB: `rms_auth` (MongoDB)

### Functional Requirements (SRS §3.1)
- FR-A01: User registration with role assignment (Owner, Manager, Staff, KDS, Cashier)
- FR-A02: JWT login (access token 15m, refresh token 7d)
- FR-A03: Role-based access control (RBAC)
- FR-A04: Password change
- FR-A05: Forgot password / reset via OTP
- FR-A06: Get current user profile (`GET /me`)
- FR-A07: Multi-tenant isolation — every user belongs to a `franchiseId` + `branchId`

### Data Model: `User`
```typescript
{
  _id: UUID,
  franchiseId: UUID,   // indexed
  branchId: UUID,      // indexed (nullable for franchise-level users)
  name: string,
  email: string,       // unique, lowercase
  phone: string,
  passwordHash: string,
  role: enum('FRANCHISE_ADMIN','BRANCH_MANAGER','CASHIER','KITCHEN_STAFF','DELIVERY'),
  isActive: boolean,
  lastLoginAt: Date,
  refreshTokenHash: string | null,
  createdAt: Date,
  updatedAt: Date,
}
```

### API Endpoints
| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/api/v1/auth/register` | No | — |
| `POST` | `/api/v1/auth/login` | No | — |
| `POST` | `/api/v1/auth/refresh` | No | — |
| `POST` | `/api/v1/auth/logout` | JWT | Any |
| `GET` | `/api/v1/auth/me` | JWT | Any |
| `PATCH` | `/api/v1/auth/me` | JWT | Any |
| `POST` | `/api/v1/auth/change-password` | JWT | Any |
| `POST` | `/api/v1/auth/forgot-password` | No | — |
| `POST` | `/api/v1/auth/reset-password` | No | — |

### Implementation Steps
1. Scaffold: `apps/auth-service/`
2. Domain layer: `User` entity, `Email` VO, `Password` VO (bcrypt)
3. Application layer: `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase`, `ChangePasswordUseCase`, `ResetPasswordUseCase`
4. Infrastructure: `UserMongoRepository`, `UserSchema` (Mongoose)
5. JWT strategy: `JwtStrategy` + `LocalStrategy` (Passport)
6. Refresh token: store hashed token in DB, rotate on each use
7. Kafka producer: publish `auth.user_registered` on successful register
8. Unit tests: domain use-cases with `InMemoryUserRepository`
9. Integration tests: all endpoints with MongoDB Memory Server

### Kafka Events Emitted
| Topic | Trigger |
|-------|---------|
| `auth.user_registered` | New user created |
| `auth.password_changed` | Password reset complete |

---

## 5. Menu Service

### Port: 3001 | DB: `rms_menu` (MongoDB)

### Functional Requirements (SRS §3.2)
- FR-M01: CRUD menu items with categories
- FR-M02: Soft-delete (never hard-delete)
- FR-M03: Toggle item availability
- FR-M04: Bulk activate/deactivate items
- FR-M05: Item variants (size, modifier) with price delta
- FR-M06: Nutrition info, tags, image URL
- FR-M07: Full-text search across name + description
- FR-M08: Category management (create, update, delete)
- FR-M09: Pagination on all list endpoints

### Data Model: `MenuItem`
```typescript
{
  _id: UUID,
  branchId: UUID,         // indexed
  franchiseId: UUID,
  categoryId: UUID,       // indexed
  name: string,           // max 200, unique per branch
  description: string,    // max 1000
  price: { amount: number, currency: 'INR'|'USD'|'GBP'|'AED' },
  isAvailable: boolean,   // indexed
  preparationTimeMinutes: number,   // 1–300
  tags: string[],         // multi-key indexed
  imageUrl: string | null,
  variants: Array<{ name: string, priceDelta: number }>,
  nutritionInfo: { calories, protein, carbs, fat } | null,
  isDeleted: boolean,     // default false
  createdAt: Date,
  updatedAt: Date,
}
```

### Data Model: `Category`
```typescript
{
  _id: UUID,
  branchId: UUID,
  franchiseId: UUID,
  name: string,
  sortOrder: number,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### MongoDB Indexes (SRS §11.2)
| Index | Type |
|-------|------|
| `{ branchId: 1 }` partial `isDeleted:false` | Single |
| `{ branchId: 1, isAvailable: 1 }` | Compound |
| `{ branchId: 1, name: 1 }` partial `isDeleted:false` | Unique Compound |
| `{ branchId: 1, categoryId: 1 }` | Compound |
| `{ tags: 1 }` | Multi-key |
| `{ name: "text", description: "text" }` | Text |
| `{ updatedAt: -1 }` | Descending |

### API Endpoints (SRS §10.2)
| Method | Path | Auth | Role |
|--------|------|------|------|
| `GET` | `/api/v1/menu/items` | JWT | Branch Staff+ |
| `POST` | `/api/v1/menu/items` | JWT | Manager+ |
| `GET` | `/api/v1/menu/items/:id` | JWT | Branch Staff+ |
| `PATCH` | `/api/v1/menu/items/:id` | JWT | Manager+ |
| `DELETE` | `/api/v1/menu/items/:id` | JWT | Manager+ |
| `PATCH` | `/api/v1/menu/items/:id/availability` | JWT | Manager+ |
| `POST` | `/api/v1/menu/items/bulk` | JWT | Manager+ |
| `GET` | `/api/v1/menu/categories` | JWT | Branch Staff+ |
| `POST` | `/api/v1/menu/categories` | JWT | Manager+ |
| `PATCH` | `/api/v1/menu/categories/:id` | JWT | Manager+ |
| `DELETE` | `/api/v1/menu/categories/:id` | JWT | Manager+ |

### Implementation Steps
1. Scaffold: `apps/menu-service/`
2. Domain: `MenuItem` entity, `Category` entity, `Price` VO
3. Application: `CreateMenuItemUseCase`, `UpdateMenuItemUseCase`, `DeleteMenuItemUseCase`, `ToggleAvailabilityUseCase`, `BulkUpdateUseCase`, `SearchMenuItemsUseCase`
4. Infrastructure: `MenuItemMongoRepository`, `CategoryMongoRepository`, schemas with all indexes
5. Kafka producer: emit `menu.item_created`, `menu.item_availability_changed`
6. Redis caching: cache `GET /menu/items` per branch with 60s TTL; invalidate on write
7. Unit + Integration tests

### Kafka Events Emitted
| Topic | Trigger |
|-------|---------|
| `menu.item_created` | New item created |
| `menu.item_updated` | Item details changed |
| `menu.item_deleted` | Soft-deleted |
| `menu.item_availability_changed` | Availability toggled |

---

## 6. Inventory Service

### Port: 3002 | DB: `rms_inventory` (MongoDB)

### Functional Requirements (SRS §3.3)
- FR-I01: Create stock items
- FR-I02: List items (with low-stock filter)
- FR-I03: Manual stock level adjustment (increase/decrease) with reason audit log
- FR-I04: Automatic stock deduction when orders are placed (consumes `order.placed` Kafka event)
- FR-I05: Low-stock alert when qty ≤ `reorderLevel`
- FR-I06: Track unit type (kg, litre, piece, etc.)

### Data Model: `StockItem`
```typescript
{
  _id: UUID,
  branchId: UUID,
  franchiseId: UUID,
  name: string,
  unit: 'kg'|'litre'|'piece'|'pack'|'dozen',
  currentQty: number,
  reorderLevel: number,
  costPerUnit: number,
  isDeleted: boolean,
  createdAt: Date,
  updatedAt: Date,
}
```

### Data Model: `StockAdjustment` (audit log)
```typescript
{
  _id: UUID,
  stockItemId: UUID,
  branchId: UUID,
  type: 'MANUAL_IN'|'MANUAL_OUT'|'ORDER_DEDUCTION'|'WASTAGE',
  delta: number,
  reason: string,
  performedBy: UUID,
  createdAt: Date,
}
```

### API Endpoints
| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/api/v1/inventory` | JWT | Manager+ |
| `GET` | `/api/v1/inventory` | JWT | Manager+ |
| `GET` | `/api/v1/inventory/:id` | JWT | Manager+ |
| `PATCH` | `/api/v1/inventory/:id` | JWT | Manager+ |
| `DELETE` | `/api/v1/inventory/:id` | JWT | Manager+ |
| `POST` | `/api/v1/inventory/:id/adjust` | JWT | Manager+ |
| `GET` | `/api/v1/inventory/adjustments` | JWT | Manager+ |

### Implementation Steps
1. Scaffold: `apps/inventory-service/`
2. Domain: `StockItem` entity, `StockAdjustment` entity
3. Application: `CreateStockItemUseCase`, `AdjustStockUseCase`, `ListLowStockUseCase`
4. Infrastructure: Mongo repositories + schemas
5. Kafka consumer: subscribe to `order.placed` → deduct stock
6. Kafka producer: emit `inventory.stock.low` when `currentQty <= reorderLevel`
7. Unit + Integration tests

### Kafka Events
| Topic | Direction | Trigger |
|-------|-----------|---------|
| `order.placed` | CONSUME | Deduct stock from order items |
| `inventory.stock.low` | EMIT | After deduction if below reorder level |

---

## 7. Order Service

### Port: 3003 | DB: `rms_orders` (MongoDB)

### Functional Requirements (SRS §3.4)
- FR-O01: Place order (DINE_IN, TAKEAWAY, DELIVERY)
- FR-O02: List orders with status filtering + pagination
- FR-O03: Transition order status: `PENDING → PREPARING → READY → COMPLETED | CANCELLED`
- FR-O04: POS order creation with table reference
- FR-O05: Order assignment to KDS station

### Data Model: `Order`
```typescript
{
  _id: UUID,
  branchId: UUID,
  franchiseId: UUID,
  tableId: UUID | null,
  customerId: UUID | null,
  type: 'DINE_IN'|'TAKEAWAY'|'DELIVERY',
  status: 'PENDING'|'PREPARING'|'READY'|'COMPLETED'|'CANCELLED',
  items: Array<{
    menuItemId: UUID,
    name: string,
    quantity: number,
    unitPrice: number,
    variantName?: string,
  }>,
  subtotal: number,
  taxAmount: number,
  total: number,
  kdsStation: string | null,
  servedBy: UUID,
  notes: string,
  createdAt: Date,
  updatedAt: Date,
}
```

### API Endpoints
| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/api/v1/orders` | JWT | Cashier+ |
| `GET` | `/api/v1/orders` | JWT | Branch Staff+ |
| `GET` | `/api/v1/orders/:id` | JWT | Branch Staff+ |
| `PATCH` | `/api/v1/orders/:id/status` | JWT | Kitchen Staff+ |
| `PATCH` | `/api/v1/orders/:id/kds-assign` | JWT | Manager+ |
| `POST` | `/api/v1/orders/:id/cancel` | JWT | Manager+ |

### Implementation Steps
1. Scaffold: `apps/order-service/`
2. Domain: `Order` entity, `OrderItem` VO, status state machine (validate transitions)
3. Application: `PlaceOrderUseCase`, `UpdateOrderStatusUseCase`, `ListOrdersUseCase`
4. Infrastructure: `OrderMongoRepository` + schema
5. Kafka producer: emit `order.placed`, `order.status_changed`, `order.cancelled`
6. WebSocket emitter: push `order:new`, `order:status_changed` via Socket.IO room `branch:{branchId}`
7. Unit + Integration tests

### Kafka Events
| Topic | Direction | Trigger |
|-------|-----------|---------|
| `order.placed` | EMIT | New order created |
| `order.status_changed` | EMIT | Status transition |
| `order.cancelled` | EMIT | Order cancelled |

---

## 8. Table & Reservation Service

### Port: 3007 | DB: `rms_tables` (MongoDB)

### Functional Requirements (SRS §3.5)
- FR-T01: Table CRUD with visual layout (position x/y, capacity, name)
- FR-T02: Table status: `FREE | OCCUPIED | RESERVED | CLEANING`
- FR-T03: Reservation management (calendar picker, guest name/phone, party size, notes, SMS toggle)
- FR-T04: Real-time status updates via WebSocket
- FR-T05: Drag-and-drop layout (manager only, edit mode)

### Data Models
```typescript
// Table
{ _id, branchId, franchiseId, name, capacity, posX, posY, status, currentOrderId?, isDeleted }

// Reservation
{ _id, branchId, tableId, guestName, guestPhone, partySize, scheduledAt, notes, smsConfirm, status: 'PENDING'|'CONFIRMED'|'SEATED'|'CANCELLED' }
```

### API Endpoints
| Method | Path | Auth | Role |
|--------|------|------|------|
| `GET` | `/api/v1/tables` | JWT | Branch Staff+ |
| `POST` | `/api/v1/tables` | JWT | Manager+ |
| `PATCH` | `/api/v1/tables/:id` | JWT | Manager+ |
| `DELETE` | `/api/v1/tables/:id` | JWT | Manager+ |
| `PATCH` | `/api/v1/tables/:id/status` | JWT | Branch Staff+ |
| `POST` | `/api/v1/tables/layout` | JWT | Manager+ |
| `GET` | `/api/v1/tables/reservations` | JWT | Branch Staff+ |
| `POST` | `/api/v1/tables/reservations` | JWT | Branch Staff+ |
| `PATCH` | `/api/v1/tables/reservations/:id` | JWT | Branch Staff+ |
| `DELETE` | `/api/v1/tables/reservations/:id` | JWT | Manager+ |

### Kafka Events
| Topic | Direction | Trigger |
|-------|-----------|---------|
| `table.status_changed` | EMIT | Table status update |
| `order.placed` | CONSUME | Mark table OCCUPIED |
| `order.status_changed` | CONSUME | Mark table FREE when order COMPLETED |

---

## 9. Staff & Shift Service

### Port: 3008 | DB: `rms_staff` (MongoDB)

### Functional Requirements (SRS §3.6)
- FR-ST01: Staff profile management (branch-scoped)
- FR-ST02: Shift scheduling (assign role to shift slot)
- FR-ST03: Clock-in / clock-out tracking
- FR-ST04: Shift history per staff member

### Data Models
```typescript
// ShiftSlot
{ _id, branchId, franchiseId, staffId, role, startTime, endTime, date, status: 'SCHEDULED'|'ACTIVE'|'COMPLETED' }

// TimeEntry (clock-in/out)
{ _id, branchId, staffId, clockIn, clockOut, totalMinutes, date }
```

### API Endpoints
| Method | Path | Auth | Role |
|--------|------|------|------|
| `GET` | `/api/v1/staff` | JWT | Manager+ |
| `GET` | `/api/v1/staff/:id` | JWT | Manager+ |
| `PATCH` | `/api/v1/staff/:id` | JWT | Manager+ |
| `GET` | `/api/v1/staff/shifts` | JWT | Manager+ |
| `POST` | `/api/v1/staff/shifts` | JWT | Manager+ |
| `PATCH` | `/api/v1/staff/shifts/:id` | JWT | Manager+ |
| `POST` | `/api/v1/staff/clock-in` | JWT | Branch Staff+ |
| `POST` | `/api/v1/staff/clock-out` | JWT | Branch Staff+ |
| `GET` | `/api/v1/staff/time-entries` | JWT | Manager+ |

---

## 10. Notification Service

### Port: 3005 | DB: None (stateless)

### Functional Requirements
- Subscribe to Kafka events and dispatch external notifications (WhatsApp via Twilio/WABA)
- FR-N01: Order confirmation notification to customer on `order.placed`
- FR-N02: Low stock alert to manager on `inventory.stock.low`
- FR-N03: Reservation confirmation SMS on `reservation.created`

### BullMQ Queues
| Queue | Job | Trigger |
|-------|-----|---------|
| `notifications-queue` | `send-order-confirmation` | `order.placed` Kafka event |
| `notifications-queue` | `send-low-stock-alert` | `inventory.stock.low` Kafka event |
| `notifications-queue` | `send-reservation-sms` | `reservation.created` Kafka event |

### Implementation Steps
1. Scaffold: `apps/notification-service/`
2. Kafka consumer group: `notification-service`
3. `NotificationWorker` processes BullMQ jobs
4. Integrate WhatsApp Business API (Twilio or Meta WABA)
5. Retry strategy: 3 retries with exponential backoff
6. Dead-letter queue for failed jobs

---

## 11. Reporting Service

### Port: 3006 | DB: None (reads from other services via Kafka replay or REST)

### Functional Requirements (SRS §3.7)
- FR-R01: Daily sales summary (PDF) per branch
- FR-R02: Inventory status report (PDF)
- FR-R03: Analytics dashboard data (revenue, orders, top items)
- FR-R04: Reports accessible via `/api/v1/reports`

### BullMQ Queues
| Queue | Job | Trigger |
|-------|-----|---------|
| `reports-queue` | `generate-daily-sales` | Cron daily 23:59 or manual API trigger |
| `reports-queue` | `generate-inventory-status` | On-demand via API |

### API Endpoints
| Method | Path | Auth | Role |
|--------|------|------|------|
| `POST` | `/api/v1/reports/sales` | JWT | Manager+ |
| `GET` | `/api/v1/reports/sales/:id/download` | JWT | Manager+ |
| `POST` | `/api/v1/reports/inventory` | JWT | Manager+ |
| `GET` | `/api/v1/reports/inventory/:id/download` | JWT | Manager+ |
| `GET` | `/api/v1/reports/analytics` | JWT | Manager+ |

### Implementation Steps
1. Scaffold: `apps/reporting-service/`
2. PDF generation library: `pdfkit` or `puppeteer`
3. `ReportsWorker` processes BullMQ jobs
4. Cron scheduler via `@nestjs/schedule`
5. S3 or local file storage for generated PDFs
6. Analytics aggregation pipeline (MongoDB `$group`, `$lookup`)

---

## 12. WebSocket / Real-time Layer

### Approach
Socket.IO gateway embedded in **Order Service** (can be extracted if needed).

### Events (SRS §10.3)
| Event | Direction | Payload |
|-------|-----------|---------|
| `subscribe:branch` | Client → Server | `{ branchId }` |
| `order:new` | Server → Client | `{ orderId, branchId, type, items, total, createdAt }` |
| `order:status_changed` | Server → Client | `{ orderId, previousStatus, newStatus, updatedAt }` |
| `menu_item:availability` | Server → Client | `{ itemId, branchId, isAvailable }` |
| `table:status_changed` | Server → Client | `{ tableId, branchId, status, orderId? }` |
| `inventory:low_stock` | Server → Client | `{ itemId, name, currentQty, reorderLevel, unit }` |
| `kds:order_assigned` | Server → Client | `{ orderId, station, assignedAt }` |
| `pos:order_create` | Client → Server | `{ items, type, tableId?, customerId? }` |

### Implementation Steps
1. Install `@nestjs/websockets`, `socket.io`
2. Create `OrderGateway` using `@WebSocketGateway`
3. Room-based subscriptions: `branch:{branchId}`
4. Emit events from Kafka consumers and use-case side effects
5. Add Socket.IO CORS config consistent with HTTP CORS

---

## 13. KDS (Kitchen Display System) Backend

### Functional Requirements
- FR-K01: KDS app receives orders assigned to its station
- FR-K02: Staff can mark items as PREPARING / READY
- FR-K03: Bump order when all items are ready

### Implementation
- KDS is handled by WebSocket events (`kds:order_assigned`, `kds:order_ready`) in Order Service
- Add `POST /api/v1/orders/:id/kds-bump` endpoint
- No separate microservice needed — extend Order Service

---

## 14. Security Hardening

Per SRS §4.2 (NFR-S01 to NFR-S10):

| Requirement | Implementation |
|-------------|---------------|
| NFR-S01: TLS 1.3 | Enforce at load balancer / nginx |
| NFR-S02: Encryption at rest | MongoDB Field-Level Encryption |
| NFR-S03: OWASP Top 10 | OWASP ZAP in CI pipeline |
| NFR-S04: JWT 15m / Refresh 7d | `JwtStrategy` config |
| NFR-S05: Rate limiting | `ThrottlerModule` in API Gateway |
| NFR-S06: Input sanitisation | Global `ValidationPipe` + `class-sanitizer` |
| NFR-S07: CORS | Strict origin whitelist in API Gateway |
| NFR-S08: PII masking in logs | Custom `LoggingInterceptor` |
| NFR-S09: Secrets management | AWS Secrets Manager (prod) / `.env` (dev) |
| NFR-S10: SOC 2 | Audit logs for all write operations |

---

## 15. Testing Strategy

Per SRS §12.2:

| Level | Tool | Target |
|-------|------|--------|
| Unit — Domain | Jest + ts-jest | Entities, VOs, Use-cases (InMemory) — 90%+ branch |
| Unit — Infrastructure | Jest + Supertest | Repository adapters |
| Integration — API | Jest + MongoDB Memory Server | All endpoints |
| Contract | Pact.io | Kafka event schemas |
| E2E | Playwright | Login → Menu → Order → Inventory flows |
| Performance | k6 | 500 concurrent users, NFR-07/08 |
| Security | OWASP ZAP | DAST in CI |

### Test Commands
```bash
npm run test           # Unit tests (no infra needed)
npm run test:e2e       # Integration tests (MongoDB Memory Server)
npm run test:contract  # Pact contract tests
```

---

## 16. CI/CD Pipeline

Per SRS §12.3 (GitHub Actions):

| Stage | Trigger | Steps |
|-------|---------|-------|
| **PR Check** | PR opened/updated | Lint → Typecheck → Unit → Integration → Security scan → Coverage comment |
| **Build** | Merge to `main` | Docker build (multi-stage) → Push to ECR → Trivy vulnerability scan → Slack notify |
| **Staging** | Post-build success | Helm upgrade → EKS staging → Smoke → E2E → Performance |
| **Production** | Manual approval | Blue-green deploy → 5% canary → Monitor 15min → Full cutover → Auto-rollback |

### Environment Variables
| Variable | Dev | Staging | Prod |
|----------|-----|---------|------|
| `MONGODB_URI` | `localhost:27017` | Atlas M10 | Atlas M50 (replica set) |
| `REDIS_HOST` | `localhost` | ElastiCache | ElastiCache Cluster (6 nodes) |
| `KAFKA_BROKERS` | `localhost:9092` | MSK 3 brokers | MSK 6 brokers (3 AZ) |
| `JWT_SECRET` | `.env` | Secrets Manager | Secrets Manager (auto-rotate 30d) |

---

## Implementation Sequence (Recommended Order)

```
Phase 1: Foundation
  1. Monorepo setup & docker-compose
  2. shared-kernel completion
  3. event-contracts completion

Phase 2: Core Services (Parallel)
  4. Auth Service (blocks all other services)
  5. Menu Service (needed for Orders)
  6. Inventory Service

Phase 3: Transactional Services
  7. Order Service + WebSocket
  8. Table & Reservation Service

Phase 4: Supporting Services (Parallel)
  9. Staff & Shift Service
  10. Notification Service
  11. Reporting Service

Phase 5: Gateway & Cross-cutting
  12. API Gateway (rate limit, proxy, CORS)
  13. Security hardening pass

Phase 6: Quality
  14. E2E tests with Playwright
  15. Performance tests with k6
  16. CI/CD pipeline setup
```
