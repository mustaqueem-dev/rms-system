# RMS API Documentation

This document provides an overview of the microservices and their APIs in the Restaurant Management System (RMS).

## Base URL
The API Gateway serves as the single entry point:
`http://localhost:3000/api/v1`

---

## 1. Auth Service
Handles user registration, authentication, and profile management.
**Target Service Port:** 3001
**Gateway Path:** `/auth`

| Endpoint | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Register a new user | No |
| `/auth/login` | `POST` | Login and receive JWT | No |
| `/auth/change-password` | `POST` | Change user password | Yes (Bearer) |
| `/auth/me` | `GET` | Get current user profile | Yes (Bearer) |

---

## 2. Menu Service
Manages menu items, categories, and availability.
**Target Service Port:** 3002
**Gateway Path:** `/menu`

| Endpoint | Method | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `/menu/items` | `POST` | Create a new menu item | Manager, Owner, Admin |
| `/menu/items` | `GET` | List menu items | All Authenticated |
| `/menu/items/:id` | `GET` | Get item details | All Authenticated |
| `/menu/items/:id` | `PATCH` | Update menu item | Manager, Owner, Admin |
| `/menu/items/:id` | `DELETE` | Delete menu item | Manager, Owner, Admin |
| `/menu/items/:id/availability` | `PATCH` | Toggle item availability | Staff, Manager, Owner, Admin |

---

## 3. Inventory Service
Tracks stock levels and inventory items.
**Target Service Port:** 3003
**Gateway Path:** `/inventory`

| Endpoint | Method | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `/inventory` | `POST` | Create inventory item | Manager, Owner, Admin |
| `/inventory` | `GET` | List items (low-stock filter) | Staff, Manager, Owner, Admin |
| `/inventory/:id` | `GET` | Get inventory item | Staff, Manager, Owner, Admin |
| `/inventory/:id/adjust` | `PATCH` | Adjust stock levels | Manager, Owner, Admin |

---

## 4. Order Service
Handles order placement and status updates.
**Target Service Port:** 3004
**Gateway Path:** `/orders`

| Endpoint | Method | Description | Roles Allowed |
| :--- | :--- | :--- | :--- |
| `/orders` | `POST` | Create a new order | Staff, Manager, Owner, Admin |
| `/orders` | `GET` | List orders (filters: status, dates) | Staff, Manager, Owner, Admin |
| `/orders/:id` | `GET` | Get order details | Staff, Manager, Owner, Admin |
| `/orders/:id/status` | `PATCH` | Update order status | Staff, Manager, Owner, Admin |

---

## Internal Services (Event-Driven)

### Notification Service
Consumes Kafka events to trigger external notifications (e.g., via BullMQ).
- **Topics Subscribed:**
    - `order.placed`: Triggers order confirmation notifications.
    - `inventory.stock.low`: Triggers low-stock alerts.

### Reporting Service
Background worker for generating complex reports.
- **Queue:** `reports-queue` (BullMQ)
- **Functions:** Asynchronous report generation for sales, inventory, and performance.
