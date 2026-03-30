// apps/menu-service/src/config/app.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const required = (key: string): string => {
    const val = process.env[key];
    if (!val) throw new Error(`Missing required environment variable: ${key}`);
    return val;
  };

  return {
    nodeEnv:    process.env.NODE_ENV ?? 'development',
    port:       parseInt(process.env.PORT ?? '3001', 10),
    mongoUri:   required('MONGODB_URI'),
    mongoDbName: required('MONGODB_DB_NAME'),
    redisHost:  required('REDIS_HOST'),
    redisPort:  parseInt(process.env.REDIS_PORT ?? '6379', 10),
    jwtSecret:  required('JWT_SECRET'),
    kafkaBrokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    logLevel:   process.env.LOG_LEVEL ?? 'info',
  };
});