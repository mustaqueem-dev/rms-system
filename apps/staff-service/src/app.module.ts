// apps/staff-service/src/app.module.ts

import { Module }            from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule }    from '@nestjs/mongoose';
import { StaffModule }       from './staff/staff.module';

import appConfig from './config/app.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    MongooseModule.forRootAsync({
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGO_URI'),
      }),
    }),
    StaffModule,
  ],
})
export class AppModule {}
