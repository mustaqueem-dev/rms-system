// apps/table-service/src/config/app.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const required = (key: string): string => {
    const val = process.env[key];
    if (!val) throw new Error(`Missing required environment variable: ${key}`);
    return val;
  };

  return {
    nodeEnv:     process.env.NODE_ENV ?? 'development',
    port:        parseInt(process.env.PORT ?? '3007', 10),
    mongoUri:    required('MONGO_URI'),
    jwtSecret:   required('JWT_SECRET'),
    logLevel:    process.env.LOG_LEVEL ?? 'info',
  };
});
