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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS with Reflection (Safe for Dev)
  // Enable CORS
  app.enableCors({
    origin: true, // Echoes the request origin
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
