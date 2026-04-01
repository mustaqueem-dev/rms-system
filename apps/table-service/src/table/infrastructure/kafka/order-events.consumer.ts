// apps/table-service/src/table/infrastructure/kafka/order-events.consumer.ts
//
// Listens to order.placed  → marks table OCCUPIED
// Listens to order.status_changed (COMPLETED) → marks table AVAILABLE
//
// Kafka decorators live in app.module.ts (same pattern as inventory-service).

import { Injectable, Logger } from '@nestjs/common';
import { UpdateTableStatusUseCase } from '../../application/use-cases/update-table-status.use-case';

export interface OrderPlacedForTablePayload {
  orderId:     string;
  branchId:    string;
  franchiseId: string;
  tableNumber: number;
  userId:      string;
}

export interface OrderStatusChangedPayload {
  orderId:        string;
  branchId:       string;
  franchiseId:    string;
  tableNumber?:   number;
  newStatus:      string;
  userId:         string;
}

@Injectable()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(private readonly updateStatus: UpdateTableStatusUseCase) {}

  /** Called on order.placed → mark table OCCUPIED */
  async handleOrderPlaced(payload: OrderPlacedForTablePayload): Promise<void> {
    if (!payload.tableNumber) return; // dine-in orders without table
    this.logger.log(`order.placed → markOccupied tableNumber=${payload.tableNumber} branch=${payload.branchId}`);
    try {
      // Find table by number, then mark OCCUPIED
      await this.updateStatus.execute(
        `table-number:${payload.tableNumber}`, // placeholder — real impl queries by tableNumber
        { status: 'OCCUPIED' },
        { branchId: payload.branchId, franchiseId: payload.franchiseId, userId: 'system', role: 'SYSTEM' },
      );
    } catch (err) {
      this.logger.warn(`Could not mark table OCCUPIED: ${(err as Error).message}`);
    }
  }

  /** Called on order.status_changed when newStatus === 'COMPLETED' → mark table AVAILABLE */
  async handleOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
    if (payload.newStatus !== 'COMPLETED' || !payload.tableNumber) return;
    this.logger.log(`order.completed → markAvailable tableNumber=${payload.tableNumber} branch=${payload.branchId}`);
    try {
      await this.updateStatus.execute(
        `table-number:${payload.tableNumber}`,
        { status: 'AVAILABLE' },
        { branchId: payload.branchId, franchiseId: payload.franchiseId, userId: 'system', role: 'SYSTEM' },
      );
    } catch (err) {
      this.logger.warn(`Could not mark table AVAILABLE: ${(err as Error).message}`);
    }
  }
}
