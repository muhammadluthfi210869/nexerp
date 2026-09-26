import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

import { SelfQrAppModule } from './self-qr-app.module';

async function bootstrap() {
  const app = await NestFactory.create(SelfQrAppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  app.setGlobalPrefix('v1');
  app.enableCors({ origin: true });

  const port = process.env.PORT || process.env.SELF_QR_PORT || 3002;
  await app.listen(port);
  console.log(`🚀 WA Self-QR Service running on port ${port}`);
}

void bootstrap();
