import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import compression from 'compression';

// Load ENV from root or backend folder
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { validationExceptionFactory } from './common/validation/validation-error.factory';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable 'trust proxy' so req.ip and Throttler read the real client IP from X-Forwarded-For behind Nginx
  const expressApp = app.getHttpAdapter().getInstance();
  if (typeof expressApp?.set === 'function') {
    expressApp.set('trust proxy', 1);
  }

  // Public reverse proxy maps /api/* to /v1/*; keep this contract stable for
  // every browser bundle and existing integration.
  app.setGlobalPrefix('v1');

  // Enable Global Response Standardization
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable Response Compression (gzip)
  app.use(compression());

  // Enable Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );

  // Enable CORS — locked to production domain, wide open for dev
  // CORS_ORIGIN mendukung daftar comma-separated (mis.
  // "http://localhost:3000,https://nexerp.id") — dulu string utuh dianggap
  // SATU origin sehingga health-check localhost tidak pernah match.
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? Array.from(
          new Set(
            [
              ...(process.env.CORS_ORIGIN || 'https://nexerp.id')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
              'https://nexerp.id',
              'https://www.nexerp.id',
              'https://dreamlab.id',
              'https://www.dreamlab.id',
            ],
          ),
        )
      : true;
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders:
      'Content-Type, Accept, Authorization, X-Requested-With, Idempotency-Key, X-Idempotency-Key',
  });

  // --- SWAGGER CONFIGURATION (Dev Only) ---
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NexERP API')
      .setDescription('The ultimate manufacturing ERP system API documentation')
      .setVersion('4.0')
      .addTag('rnd')
      .addTag('finance')
      .addTag('bussdev')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const specPath = path.join(process.cwd(), 'swagger-spec.json');
    fs.writeFileSync(specPath, JSON.stringify(document, null, 2));
    console.log(`✅ Swagger specification saved to: ${specPath}`);
  }
  // -----------------------------

  const port = process.env.PORT ?? 3002;
  await app.listen(port, '0.0.0.0');
  console.log(`ERP Backend is running on port ${port} (0.0.0.0)`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `Swagger documentation available at: http://localhost:${port}/api/docs`,
    );
  }
}
bootstrap().catch((err) => {
  console.error('Failed to start ERP Backend:', err);
  process.exit(1);
});
