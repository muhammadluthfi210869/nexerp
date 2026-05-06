import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

async function generate() {
  console.log('🚀 Generating Swagger specification...');
  const app = await NestFactory.create(AppModule, { logger: false });
  
  const config = new DocumentBuilder()
    .setTitle('Porto Aureon ERP API')
    .setDescription('The ultimate manufacturing ERP system API documentation')
    .setVersion('4.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputPath = path.join(process.cwd(), 'swagger-spec.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));
  console.log(`✅ Swagger specification saved to: ${outputPath}`);
  
  await app.close();
  process.exit(0);
}

generate().catch(err => {
  console.error('❌ Failed to generate Swagger spec:', err);
  process.exit(1);
});
