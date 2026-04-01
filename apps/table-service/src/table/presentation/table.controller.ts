// apps/table-service/src/table/presentation/table.controller.ts

import {
  Controller, Post, Get, Patch, Body, Param,
  Query, HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import {
  Auth, UserRole, CurrentTenant, TenantContext,
  ok, created, noContent, ApiResponse as ApiEnvelope,
} from '@rms/shared-kernel';
import { Inject } from '@nestjs/common';

import { ITableRepository, TABLE_REPOSITORY, TableFilter } from '../domain/repositories/table.repository.interface';
import { IReservationRepository, RESERVATION_REPOSITORY }  from '../domain/repositories/reservation.repository.interface';

import { CreateTableUseCase, CreateTableDto }                            from '../application/use-cases/create-table.use-case';
import { UpdateTableStatusUseCase, UpdateTableStatusDto }               from '../application/use-cases/update-table-status.use-case';
import { SaveLayoutUseCase, SaveLayoutDto }                             from '../application/use-cases/save-layout.use-case';
import { CreateReservationUseCase, CreateReservationDto }               from '../application/use-cases/create-reservation.use-case';
import { UpdateReservationUseCase, UpdateReservationDto }               from '../application/use-cases/update-reservation.use-case';
import { CancelReservationUseCase, CancelReservationDto }               from '../application/use-cases/cancel-reservation.use-case';

// ── Table endpoints ───────────────────────────────────────────────────────────

@ApiTags('Tables')
@ApiBearerAuth()
@Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
@Controller('tables')
export class TableController {
  constructor(
    private readonly createTableUseCase:        CreateTableUseCase,
    private readonly updateStatusUseCase:       UpdateTableStatusUseCase,
    private readonly saveLayoutUseCase:         SaveLayoutUseCase,
    private readonly createReservationUseCase:  CreateReservationUseCase,
    private readonly updateReservationUseCase:  UpdateReservationUseCase,
    private readonly cancelReservationUseCase:  CancelReservationUseCase,
    @Inject(TABLE_REPOSITORY)       private readonly tableRepo: ITableRepository,
    @Inject(RESERVATION_REPOSITORY) private readonly resRepo:   IReservationRepository,
  ) {}

  // ── Tables ────────────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a table in this branch' })
  async createTable(
    @Body() dto: CreateTableDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.createTableUseCase.execute(dto, tenant);
    return created({ id });
  }

  @Get()
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all tables for this branch (optional status filter)' })
  async listTables(
    @Query('status') status: string | undefined,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const tables = await this.tableRepo.findAll({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      status:      status as TableFilter['status'],
    });
    return ok(tables.map((t) => ({
      id:          t.id,
      tableNumber: t.tableNumber,
      capacity:    t.capacity,
      status:      t.status,
      position:    t.position,
      section:     t.section,
    })));
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change table status (state-machine validated)' })
  @ApiParam({ name: 'id', type: String })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTableStatusDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.updateStatusUseCase.execute(id, dto, tenant);
  }

  @Patch(':id/layout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Save drag-and-drop position for this table on the floor plan' })
  @ApiParam({ name: 'id', type: String })
  async saveLayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveLayoutDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.saveLayoutUseCase.execute(id, dto, tenant);
  }

  // ── Reservations ──────────────────────────────────────────────────────────

  @Post('reservations')
  @ApiOperation({ summary: 'Create a reservation' })
  async createReservation(
    @Body() dto: CreateReservationDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.createReservationUseCase.execute(dto, tenant);
    return created({ id });
  }

  @Get('reservations')
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List reservations for this branch (optional tableId/status filter)' })
  async listReservations(
    @Query('tableId') tableId: string | undefined,
    @Query('status')  status:  string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate')   toDate:   string | undefined,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const items = await this.resRepo.findAll({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      tableId,
      fromDate:    fromDate ? new Date(fromDate) : undefined,
      toDate:      toDate   ? new Date(toDate)   : undefined,
    });
    return ok(items);
  }

  @Patch('reservations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiParam({ name: 'id', type: String })
  async updateReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.updateReservationUseCase.execute(id, dto, tenant);
  }

  @Patch('reservations/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiParam({ name: 'id', type: String })
  async cancelReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReservationDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.cancelReservationUseCase.execute(id, dto, tenant);
  }
}
