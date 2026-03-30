// apps/api-gateway/src/config/gateway.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('gateway', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  services: {
    auth:      process.env.AUTH_SERVICE_URL      || 'http://localhost:3004',
    menu:      process.env.MENU_SERVICE_URL      || 'http://localhost:3001',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:3002',
    order:     process.env.ORDER_SERVICE_URL     || 'http://localhost:3003',
  }
}));
