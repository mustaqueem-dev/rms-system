# RMS API Documentation (Detailed)

This document provides a comprehensive overview of the microservices and their APIs in the Restaurant Management System (RMS).

## Base URL
The API Gateway serves as the single entry point:
`http://localhost:3000/api/v1`

---

## 1. Auth Service
Handles user registration, authentication, and profile management.
**Target Service Port:** 3001
**Gateway Path:** `/auth`

### Endpoints

#### [POST] `/auth/register`
Register a new user (Owner, Manager, Staff).
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "owner@restaurant.com",
    "password": "Secret123!",
    "name": "Ahmed Khan",
    "role": "FRANCHISE_OWNER",
    "franchiseId": "uuid-here",
    "branchId": "optional-uuid-here"
  }
  ```
- **Response (201):** `AuthResponseDto` (contains `accessToken` and `user` profile).

#### [POST] `/auth/login`
Login and receive a JWT.
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "owner@restaurant.com",
    "password": "Secret123!"
  }
  ```
- **Response (200):** `AuthResponseDto`.

#### [POST] `/auth/change-password`
Change current user password.
- **Auth Required:** Yes (Bearer Token)
- **Request Body:**
  ```json
  {
    "oldPassword": "Secret123!",
    "newPassword": "NewSecret456!"
  }
  ```
- **Response (204):** No Content.

#### [GET] `/auth/me`
Get current user profile (decoded from token).
- **Auth Required:** Yes (Bearer Token)
- **Response (200):** User profile details including ID, email, name, role, franchiseId, and branchId.

---

## 2. Menu Service
Manages menu items, categories, and availability.
**Target Service Port:** 3002
**Gateway Path:** `/menu`

### Endpoints

#### [POST] `/menu/items`
Create a new menu item.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Request Body:** `CreateMenuItemDto`.
- **Response (201):** `{ "id": "uuid" }`.

#### [GET] `/menu/items`
List menu items for the authenticated branch.
- **Auth Required:** Yes (Bearer Token)
- **Query Params:** `categoryId`, `isAvailable`, `tags`, `search`, `limit`, `offset`.
- **Response (200):** Array of menu items.

#### [GET] `/menu/items/:id`
Get a single menu item by ID.
- **Auth Required:** Yes (Bearer Token)
- **Response (200):** Menu item object.

#### [PATCH] `/menu/items/:id`
Update a menu item (partial).
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Request Body:** `UpdateMenuItemDto`.
- **Response (204):** No Content.

#### [DELETE] `/menu/items/:id`
Delete a menu item.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Response (204):** No Content.

#### [PATCH] `/menu/items/:id/availability`
Toggle menu item availability.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `STAFF`, `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Response (200):** `{ "isAvailable": boolean }`.

---

## 3. Inventory Service
Tracks stock levels and inventory items.
**Target Service Port:** 3003
**Gateway Path:** `/inventory`

### Endpoints

#### [POST] `/inventory`
Create a new inventory item.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Request Body:** `CreateInventoryItemDto`.
- **Response (201):** `{ "id": "uuid" }`.

#### [GET] `/inventory`
List items with filtering (e.g., low-stock).
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `STAFF`, `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Query Params:** `sku`, `isLowStock`, `limit`, `offset`.
- **Response (200):** Array of inventory items.

#### [GET] `/inventory/:id`
Get inventory item by ID.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `STAFF`, `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Response (200):** Inventory item object.

#### [PATCH] `/inventory/:id/adjust`
Adjust stock levels.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Request Body:** `AdjustStockDto` (contains `quantity`, `reason`).
- **Response (200):** Updated item.

---

## 4. Order Service
Handles order placement and status updates.
**Target Service Port:** 3004
**Gateway Path:** `/orders`

### Endpoints

#### [POST] `/orders`
Create a new order.
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `STAFF`, `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Request Body:** `CreateOrderDto`.
- **Response (201):** `{ "id": "uuid" }`.

#### [GET] `/orders`
List orders with filtering.
- **Auth Required:** Yes (Bearer Token)
- **Query Params:** `status`, `customerId`, `fromDate`, `toDate`, `limit`, `offset`.
- **Response (200):** Array of orders.

#### [GET] `/orders/:id`
Get order details.
- **Auth Required:** Yes (Bearer Token)
- **Response (200):** Order object.

#### [PATCH] `/orders/:id/status`
Update order status (e.g., PENDING, COMPLETED, CANCELLED).
- **Auth Required:** Yes (Bearer Token)
- **Roles Allowed:** `STAFF`, `BRANCH_MANAGER`, `FRANCHISE_OWNER`, `SUPER_ADMIN`
- **Request Body:** `UpdateOrderStatusDto`.
- **Response (204):** No Content.

---

## Internal Interactions (Event-Driven)

### Kafka Topics (Domain Events)
Microservices publish events to Kafka for asynchronous processing:
- `order.placed`: Published by Order Service.
- `inventory.stock.low`: Published by Inventory Service.

### Notification Service
Consumes Kafka events and enqueues jobs:
- **Topic Subscriptions:** `order.placed`, `inventory.stock.low`.
- **Jobs (BullMQ):**
    - `send-order-confirmation`: Triggered by `order.placed`.
    - `send-low-stock-alert`: Triggered by `inventory.stock.low`.

### Reporting Service
Handles background report generation via queues:
- **Queue:** `reports-queue` (BullMQ).
- **Jobs:**
    - `generate-daily-sales`: Generates PDF sales reports.
    - `generate-inventory-status`: Generates PDF inventory status.

---

## Frontend Integration Best Practices

For integrating these APIs into a Next.js/React frontend, follow these guidelines:

1. **Centralized Client**: Use the pre-configured Axios instance in `src/lib/api.ts`. It handles JWT injection and multi-tenancy headers automatically.
2. **Service Layer**: Organize API calls into service modules (e.g., `src/services/menu.service.ts`).
3. **Data Fetching**: Use **React Query** for all `GET` requests to handle caching, loading states, and error handling.
4. **Type Safety**: Define TypeScript interfaces for all DTOs and Response objects to ensure frontend-backend consistency.
5. **Environment Variables**: Use `NEXT_PUBLIC_API_URL` to point to the Gateway.

For more details, see the [Frontend Integration Guide](file:///home/sweet-heart/.gemini/antigravity/brain/bbd1ad01-f138-44af-b4ff-d8372d64c05a/frontend_integration.md).
