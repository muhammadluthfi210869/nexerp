import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname, extname } from 'path';

@Injectable()
export class FileStorageService {
  private readonly rootUploadPath = join(process.cwd(), 'uploads');
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB strict limit

  /**
   * Saves a file to the local VPS storage with dynamic path logic.
   * Path: /uploads/[module]/[subfolder]/[fileName]
   */
  async saveFile(
    module: string,
    subFolder: string,
    file: { buffer: Buffer; originalname: string },
  ): Promise<string> {
    if (file.buffer.length > this.maxFileSize) {
      throw new BadRequestException('File size exceeds 5MB strict limit');
    }

    const sanitizedModule = module.toLowerCase().replace(/\s+/g, '_');
    const sanitizedSubFolder = subFolder.toLowerCase().replace(/\s+/g, '_');
    const targetDir = join(
      this.rootUploadPath,
      sanitizedModule,
      sanitizedSubFolder,
    );

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    // Ensure safe filename
    const fileExt = extname(file.originalname);
    const fileName = `file_${Date.now()}${fileExt}`;
    const filePath = join(targetDir, fileName);

    writeFileSync(filePath, file.buffer);

    // Return the public URL path
    return `/uploads/${sanitizedModule}/${sanitizedSubFolder}/${fileName}`;
  }
}
