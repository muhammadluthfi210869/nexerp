import { Module, Global } from '@nestjs/common';
import { FileStorageService } from './storage/file-storage.service';
import { UploadController } from './upload.controller';
import { EncryptionService } from './encryption.service';
import { GeofencingService } from './geofencing.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    FileStorageService,
    EncryptionService,
    GeofencingService,
    CacheService,
  ],
  exports: [
    FileStorageService,
    EncryptionService,
    GeofencingService,
    CacheService,
  ],
  controllers: [UploadController],
})
export class SharedModule {}
