// apps/auth-service/src/config/app.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const required = (key: string): string => {
    const val = process.env[key];
    if (!val) throw new Error(`Missing required environment variable: ${key}`);
    return val;
  };

  return {
    nodeEnv:     process.env.NODE_ENV ?? 'development',
    port:        parseInt(process.env.PORT ?? '3004', 10),
    mongoUri:    required('MONGODB_URI'),
    mongoDbName: required('MONGODB_DB_NAME'),
    jwtSecret:   required('JWT_SECRET'),
    logLevel:    process.env.LOG_LEVEL ?? 'info',
  };
});
