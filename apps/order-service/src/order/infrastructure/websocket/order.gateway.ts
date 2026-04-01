// apps/order-service/src/order/infrastructure/websocket/order.gateway.ts
//
// WebSocket broadcast service for real-time order state changes.
//
// ARCHITECTURE NOTE:
// The actual Socket.IO @WebSocketGateway / @SubscribeMessage decorators live in
// apps/order-service/src/order/infrastructure/websocket/order.ws-handler.ts
// (registered in app.module.ts) to keep @nestjs/websockets out of this file.
// This file provides testable, framework-agnostic broadcast helpers that the
// handler calls after resolving the server reference.

import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderUseCase } from '../../application/use-cases/create-order.use-case';
import { CreateOrderDto }     from '../../application/dtos/create-order.dto';

export interface TenantInfo {
  branchId:    string;
  franchiseId: string;
  userId:      string;
  role:        string;
}

/**
 * OrderGateway
 *
 * Exposes broadcast helpers for outgoing WebSocket events.
 * The Socket.IO `server` reference is injected by the ws-handler after
 * the @WebSocketServer() decorator resolves.
 *
 * Client-side binding (in order.ws-handler.ts):
 *   @WebSocketGateway({ cors: true, namespace: '/orders' })
 *   @SubscribeMessage('subscribe:branch') → calls gateway.joinBranchRoom()
 *   @SubscribeMessage('pos:order_create') → calls gateway.handlePosOrderCreate()
 */
@Injectable()
export class OrderGateway {
  private readonly logger = new Logger(OrderGateway.name);

  /** Injected by the ws-handler after @WebSocketServer() resolves */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  server: any;

  constructor(private readonly createOrderUseCase: CreateOrderUseCase) {}

  // ── Broadcast helpers (Server → Clients) ─────────────────────────────────

  broadcastOrderNew(branchId: string, orderId: string): void {
    this.broadcastToRoom(branchId, 'order:new', { orderId });
  }

  broadcastOrderStatusChanged(
    branchId:       string,
    orderId:        string,
    status:         string,
    previousStatus: string,
  ): void {
    this.broadcastToRoom(branchId, 'order:status_changed', { orderId, status, previousStatus });
  }

  broadcastKdsOrderAssigned(
    branchId:     string,
    orderId:      string,
    kdsStationId: string,
  ): void {
    this.broadcastToRoom(branchId, 'kds:order_assigned', { orderId, kdsStationId });
  }

  // ── Action handlers (called from ws-handler) ──────────────────────────────

  async handleSubscribeBranch(
    branchId:  string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client:    any,
  ): Promise<void> {
    const room = `branch:${branchId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
    client.emit('subscribed', { room });
  }

  async handlePosOrderCreate(
    dto:    CreateOrderDto,
    tenant: TenantInfo,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any,
  ): Promise<void> {
    try {
      const orderId = await this.createOrderUseCase.execute(dto, { ...tenant });
      client.emit('order:created', { orderId });
      this.broadcastOrderNew(tenant.branchId, orderId);
    } catch (err) {
      client.emit('error', { message: (err as Error).message });
    }
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private broadcastToRoom(branchId: string, event: string, payload: object): void {
    if (!this.server) return; // not yet initialised (e.g. in tests)
    const room = `branch:${branchId}`;
    this.server.to(room).emit(event, payload);
    this.logger.debug(`Broadcast [${event}] → room ${room}`, payload);
  }
}
