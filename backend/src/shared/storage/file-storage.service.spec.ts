import { FileStorageService } from './file-storage.service';
import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

describe('FileStorageService', () => {
  let service: FileStorageService;

  beforeEach(() => {
    service = new FileStorageService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save a file and return correct path', async () => {
    const leadId = 'test-lead-id';
    const stageName = 'CONTACTED';
    const file = {
      buffer: Buffer.from('test content'),
      originalname: 'test.pdf',
    };

    const result = await service.saveFile(leadId, stageName, file);

    expect(result).toContain(`/uploads/${leadId}/contacted/file_`);
    expect(result).toMatch(/\.pdf$/);

    // Clean up
    const absolutePath = path.join(process.cwd(), result);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  });

  it('should throw error if file exceeds 5MB', async () => {
    const file = {
      buffer: Buffer.alloc(6 * 1024 * 1024), // 6MB
      originalname: 'large.pdf',
    };

    await expect(service.saveFile('id', 'stage', file)).rejects.toThrow(
      BadRequestException,
    );
  });
});
