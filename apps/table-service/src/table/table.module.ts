// apps/table-service/src/table/table.module.ts

import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { ConfigService }  from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { InMemoryEventPublisher, EVENT_PUBLISHER } from '@rms/shared-kernel';

// ── Schemas ────────────────────────────────────────────────────────────────────
import { TableModel, TableSchema }               from './infrastructure/persistence/table.schema';
import { ReservationModel, ReservationSchema }   from './infrastructure/persistence/reservation.schema';

// ── Repositories ───────────────────────────────────────────────────────────────
import { MongoTableRepository }                  from './infrastructure/persistence/mongo-table.repository';
import { MongoReservationRepository }            from './infrastructure/persistence/mongo-reservation.repository';
import { TABLE_REPOSITORY }                      from './domain/repositories/table.repository.interface';
import { RESERVATION_REPOSITORY }                from './domain/repositories/reservation.repository.interface';

// ── Kafka consumer ─────────────────────────────────────────────────────────────
import { OrderEventsConsumer }                   from './infrastructure/kafka/order-events.consumer';

// ── Use cases ──────────────────────────────────────────────────────────────────
import { CreateTableUseCase }                    from './application/use-cases/create-table.use-case';
import { UpdateTableStatusUseCase }              from './application/use-cases/update-table-status.use-case';
import { SaveLayoutUseCase }                     from './application/use-cases/save-layout.use-case';
import { CreateReservationUseCase }              from './application/use-cases/create-reservation.use-case';
import { UpdateReservationUseCase }              from './application/use-cases/update-reservation.use-case';
import { CancelReservationUseCase }              from './application/use-cases/cancel-reservation.use-case';

// ── Controller ────────────────────────────────────────────────────────────────
import { TableController }                       from './presentation/table.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TableModel.name,       schema: TableSchema       },
      { name: ReservationModel.name, schema: ReservationSchema },
    ]),
    JwtModule.registerAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('app.jwtSecret'),
        signOptions: { expiresIn: '15m' }, // SRS NFR-S04
      }),
    }),
  ],
  controllers: [TableController],
  providers: [
    // Repositories
    { provide: TABLE_REPOSITORY,       useClass: MongoTableRepository       },
    { provide: RESERVATION_REPOSITORY, useClass: MongoReservationRepository },

    // Event publisher
    { provide: EVENT_PUBLISHER, useClass: InMemoryEventPublisher },

    // Kafka consumer
    OrderEventsConsumer,

    // Use cases
    CreateTableUseCase,
    UpdateTableStatusUseCase,
    SaveLayoutUseCase,
    CreateReservationUseCase,
    UpdateReservationUseCase,
    CancelReservationUseCase,
  ],
})
export class TableModule {}
