// apps/staff-service/src/staff/presentation/staff.controller.ts

import {
  Controller, Post, Get, Delete,
  Body, Param, Query,
  HttpCode, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Inject } from '@nestjs/common';
import {
  Auth, UserRole, CurrentTenant, TenantContext,
  ok, created, noContent, ApiResponse as ApiEnvelope,
} from '@rms/shared-kernel';

import { IShiftSlotRepository, SHIFT_SLOT_REPOSITORY }   from '../domain/repositories/shift-slot.repository.interface';
import { ITimeEntryRepository, TIME_ENTRY_REPOSITORY }   from '../domain/repositories/time-entry.repository.interface';
import { ScheduleShiftUseCase, ScheduleShiftDto }        from '../application/use-cases/schedule-shift.use-case';
import { ClockInUseCase, ClockInDto }                    from '../application/use-cases/clock-in.use-case';
import { ClockOutUseCase, ClockOutDto }                  from '../application/use-cases/clock-out.use-case';

@ApiTags('Staff & Shifts')
@ApiBearerAuth()
@Auth()
@Controller('staff')
export class StaffController {
  constructor(
    private readonly scheduleShiftUseCase: ScheduleShiftUseCase,
    private readonly clockInUseCase:       ClockInUseCase,
    private readonly clockOutUseCase:      ClockOutUseCase,
    @Inject(SHIFT_SLOT_REPOSITORY) private readonly shiftRepo: IShiftSlotRepository,
    @Inject(TIME_ENTRY_REPOSITORY) private readonly timeRepo:   ITimeEntryRepository,
  ) {}

  // ── Shift scheduling ──────────────────────────────────────────────────────

  @Post('shifts')
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Schedule a shift slot for a staff member' })
  async scheduleShift(
    @Body() dto: ScheduleShiftDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.scheduleShiftUseCase.execute(dto, tenant);
    return created({ id });
  }

  @Get('shifts')
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List shift slots (optional staffId/date/range filters)' })
  async listShifts(
    @Query('staffId')  staffId:  string | undefined,
    @Query('date')     date:     string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate')   toDate:   string | undefined,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const slots = await this.shiftRepo.findAll({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      staffId, date, fromDate, toDate,
    });
    return ok(slots.map((s) => ({
      id: s.id, staffId: s.staffId, staffName: s.staffName,
      role: s.role, date: s.date, startTime: s.startTime, endTime: s.endTime,
    })));
  }

  @Delete('shifts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a shift slot' })
  @ApiParam({ name: 'id', type: String })
  async deleteShift(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<void> {
    await this.shiftRepo.delete(id, tenant.branchId);
  }

  // ── Clock in / out ────────────────────────────────────────────────────────

  @Post('clock-in')
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clock in — starts a time entry for the current user' })
  async clockIn(
    @Body() dto: ClockInDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const id = await this.clockInUseCase.execute(dto, tenant);
    return created({ id });
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  @Auth(UserRole.STAFF, UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Clock out — closes the active time entry for the current user' })
  async clockOut(
    @Body() dto: ClockOutDto,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const result = await this.clockOutUseCase.execute(dto, tenant);
    return ok(result);
  }

  // ── Time entries (attendance log) ─────────────────────────────────────────

  @Get('attendance')
  @Auth(UserRole.BRANCH_MANAGER, UserRole.FRANCHISE_OWNER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get attendance log (optional staffId/date range)' })
  async attendance(
    @Query('staffId')  staffId:  string | undefined,
    @Query('fromDate') fromDate: string | undefined,
    @Query('toDate')   toDate:   string | undefined,
    @CurrentTenant() tenant: TenantContext,
  ): Promise<ApiEnvelope> {
    const entries = await this.timeRepo.findAll({
      branchId:    tenant.branchId,
      franchiseId: tenant.franchiseId,
      staffId,
      fromDate:    fromDate ? new Date(fromDate) : undefined,
      toDate:      toDate   ? new Date(toDate)   : undefined,
    });
    return ok(entries.map((e) => ({
      id:           e.id,
      staffId:      e.staffId,
      clockInAt:    e.clockInAt,
      clockOutAt:   e.clockOutAt,
      totalMinutes: e.totalMinutes,
      notes:        e.notes,
    })));
  }
}
