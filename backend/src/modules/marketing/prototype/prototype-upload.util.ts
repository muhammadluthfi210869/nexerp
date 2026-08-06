import { BadRequestException, Catch, ExceptionFilter, ArgumentsHost, PayloadTooLargeException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage, MulterError } from 'multer';
import type { Request, Response } from 'express';

/**
 * Konfigurasi upload attachment task (gambar & dokumen).
 *
 * Prinsip keamanan (lihat docs/PLAN-TASK-ATTACHMENTS.md §7):
 * - Nama file disk SELALU server-generated (UUID + ekstensi) → anti path traversal.
 * - Whitelist EKSTENSI (bukan MIME klien yang bisa dipalsukan). SVG/HTML/XML
 *   sengaja TIDAK diizinkan (stored XSS — BUG-A-06).
 * - Magic-byte gambar diverifikasi di service (isi file vs ekstensi — BUG-B-03).
 * - Path relatif `tasks/<id>/<uuid>.<ext>` disimpan di metadata → portabel
 *   antar environment (dev/container).
 */

export const UPLOADS_ROOT = join(process.cwd(), 'uploads');
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Ekstensi yang boleh diunggah (tanpa svg/html/xml — BUG-A-06). */
export const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp',
  'pdf',
  'doc', 'docx',
  'xls', 'xlsx',
  'ppt', 'pptx',
  'txt', 'csv',
  'zip',
]);

/** Ekstensi yang perlu verifikasi magic-byte (gambar raster). */
export const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp']);

/** Pemetaan ekstensi → MIME. Type di metadata diambil dari sini (server-derived),
 *  bukan dari `file.mimetype` klien → tidak bisa header-injection (BUG-D-05). */
export const EXT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  zip: 'application/zip',
};

/** diskStorage Multer — folder per task dibuat dinamis dari `req.params.id`. */
export const attachmentDiskStorage = diskStorage({
  destination(req, _file, cb) {
    const taskId = (req.params as { id?: string }).id ?? 'unknown';
    const dir = join(UPLOADS_ROOT, 'tasks', taskId);
    try {
      mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      cb(err as Error, dir);
    }
  },
  filename(_req, file, cb) {
    const ext = extname(file.originalname).toLowerCase().slice(1) || 'bin';
    cb(null, `${randomUUID()}.${ext}`);
  },
});

/** fileFilter — tolak ekstensi di luar whitelist dengan error yang jelas. */
export function attachmentFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = extname(file.originalname).toLowerCase().slice(1);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    cb(
      new BadRequestException(
        `Tipe file tidak didukung (.${ext || '?'}). Diizinkan: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
      ),
      false,
    );
    return;
  }
  cb(null, true);
}

/** Verifikasi magic-byte untuk gambar raster (BUG-B-03). `head` = 16 byte awal. */
export function hasValidImageMagic(head: Buffer, ext: string): boolean {
  if (ext === 'png') {
    return head.length >= 8 && head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  }
  if (ext === 'jpg' || ext === 'jpeg') {
    return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  }
  if (ext === 'gif') {
    return head.length >= 4 && head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38;
  }
  if (ext === 'webp') {
    return (
      head.length >= 12 &&
      head.toString('ascii', 0, 4) === 'RIFF' &&
      head.toString('ascii', 8, 12) === 'WEBP'
    );
  }
  return true;
}

/** Ubah error upload (ukuran/tipe) menjadi 400 yang ramah (BUG-B-01).
 *  Catatan: Nest menerjemahkan MulterError LIMIT_FILE_SIZE menjadi
 *  PayloadTooLargeException (413) di FileInterceptor — tangkap keduanya. */
@Catch(MulterError, PayloadTooLargeException)
export class MulterErrorFilter implements ExceptionFilter {
  catch(exception: MulterError | PayloadTooLargeException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isSizeLimit =
      exception instanceof MulterError
        ? exception.code === 'LIMIT_FILE_SIZE'
        : true; // PayloadTooLargeException
    const message = isSizeLimit
      ? 'File terlalu besar (maks 10 MB)'
      : `Upload gagal: ${exception.message}`;
    response.status(400).json({
      statusCode: 400,
      code: 'HTTP_400',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
