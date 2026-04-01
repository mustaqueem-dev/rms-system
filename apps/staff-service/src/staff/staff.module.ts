// apps/staff-service/src/staff/staff.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

// ── Schemas ────────────────────────────────────────────────────────────────────
import { ShiftSlotModel, ShiftSlotSchema }   from './infrastructure/persistence/shift-slot.schema';
import { TimeEntryModel, TimeEntrySchema }   from './infrastructure/persistence/time-entry.schema';

// ── Repositories ───────────────────────────────────────────────────────────────
import { MongoShiftSlotRepository }          from './infrastructure/persistence/mongo-shift-slot.repository';
import { MongoTimeEntryRepository }          from './infrastructure/persistence/mongo-time-entry.repository';
import { SHIFT_SLOT_REPOSITORY }             from './domain/repositories/shift-slot.repository.interface';
import { TIME_ENTRY_REPOSITORY }             from './domain/repositories/time-entry.repository.interface';

// ── Use cases ──────────────────────────────────────────────────────────────────
import { ScheduleShiftUseCase }              from './application/use-cases/schedule-shift.use-case';
import { ClockInUseCase }                    from './application/use-cases/clock-in.use-case';
import { ClockOutUseCase }                   from './application/use-cases/clock-out.use-case';

// ── Controller ─────────────────────────────────────────────────────────────────
import { StaffController }                   from './presentation/staff.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShiftSlotModel.name, schema: ShiftSlotSchema },
      { name: TimeEntryModel.name, schema: TimeEntrySchema },
    ]),
    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '15m' }, // SRS NFR-S04
      }),
    }),
  ],
  controllers: [StaffController],
  providers: [
    { provide: SHIFT_SLOT_REPOSITORY, useClass: MongoShiftSlotRepository },
    { provide: TIME_ENTRY_REPOSITORY, useClass: MongoTimeEntryRepository },
    { provide: EVENT_PUBLISHER,       useClass: InMemoryEventPublisher   },
    ScheduleShiftUseCase,
    ClockInUseCase,
    ClockOutUseCase,
  ],
})
export class StaffModule {}
