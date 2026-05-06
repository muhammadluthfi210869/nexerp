
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BussdevService } from '../src/modules/bussdev/bussdev.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(BussdevService);

  console.log('--- STARTING SERVICE METHOD DEBUG ---');
  try {
    const data = await service.getGranularPipelineTable();
    console.log('SUCCESS: Data length =', data.length);
    if (data.length > 0) {
      console.log('First Item keys:', Object.keys(data[0]));
    } else {
      console.log('WARNING: Data is empty!');
      // Check if there are any leads at all
      const total = await (service as any).prisma.salesLead.count();
      console.log('Total leads in DB via service prisma:', total);
    }
  } catch (error) {
    console.error('FAILURE: Error calling getGranularPipelineTable');
    console.error(error);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
