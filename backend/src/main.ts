import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load ENV from root or backend folder
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Global Response Standardization
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable Response Compression (gzip)
  app.use(compression());

  // Enable Global Validation
  // whitelist: true tanpa class-validator decorators akan
  // strip semua properties. Dipasang false agar endpoint
  // public seperti lead-capture/track bisa menerima body.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: false,
      forbidNonWhitelisted: false,
    }),
  );

  // Enable CORS — locked to production domain, wide open for dev
  // Selalu include localhost untuk development & CI testing
  const corsOrigin =
    process.env.NODE_ENV === 'production'
      ? [
          process.env.CORS_ORIGIN || 'https://nexerp.id',
          'https://www.nexerp.id',
          'https://dreamlab.id',
          'https://www.dreamlab.id',
          // Untuk health check & testing
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
        ].filter(Boolean)
      : true;
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization, X-Requested-With',
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

  const port = process.env.PORT ?? 3001;
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
