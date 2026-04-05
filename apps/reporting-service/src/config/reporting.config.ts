// apps/reporting-service/src/config/reporting.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('reporting', () => {
  const req = (k: string) => { const v = process.env[k]; if (!v) throw new Error(`Missing required env: ${k}`); return v; };

  return {
    nodeEnv:       process.env['NODE_ENV'] ?? 'development',
    port:          parseInt(process.env['PORT'] ?? '3006', 10),
    redisHost:     process.env['REDIS_HOST'] ?? 'localhost',
    redisPort:     parseInt(process.env['REDIS_PORT'] ?? '6379', 10),
    logLevel:      process.env['LOG_LEVEL'] ?? 'info',
    mongoUri:      process.env['MONGO_URI'] ?? 'mongodb://localhost:27017/rms_reporting',
    kafkaBrokers: (process.env['KAFKA_BROKERS'] ?? 'localhost:9092').split(','),
  };
});
