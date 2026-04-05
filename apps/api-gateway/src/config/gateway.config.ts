// apps/api-gateway/src/config/gateway.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('gateway', () => ({
  port: parseInt(process.env['PORT'] || '3000', 10),
  jwtSecret: process.env['JWT_SECRET'] || 'change-me-in-production',
  corsOrigins: (process.env['CORS_ORIGINS'] || '*').split(',').map((s) => s.trim()),
  throttleTtl:   parseInt(process.env['THROTTLE_TTL']   || '60',  10),  // seconds
  throttleLimit: parseInt(process.env['THROTTLE_LIMIT'] || '120', 10),  // requests/TTL
  services: {
    auth:      process.env['AUTH_SERVICE_URL']      || 'http://localhost:3004',
    menu:      process.env['MENU_SERVICE_URL']      || 'http://localhost:3001',
    inventory: process.env['INVENTORY_SERVICE_URL'] || 'http://localhost:3002',
    order:     process.env['ORDER_SERVICE_URL']     || 'http://localhost:3003',
    table:     process.env['TABLE_SERVICE_URL']     || 'http://localhost:3007',
    staff:     process.env['STAFF_SERVICE_URL']     || 'http://localhost:3008',
    reporting: process.env['REPORTING_SERVICE_URL'] || 'http://localhost:3006',
    notification: process.env['NOTIFICATION_SERVICE_URL'] || 'http://localhost:3005',
  },
}));
