import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { LogActivityType } from '@prisma/client';
import { BusinessRuleViolationException } from '../../common/exceptions/api-exception';

export interface PresignUploadDto {
  filename: string;
  content_type: string;
  entity_type: string;
  entity_id: string;
}

export interface ConfirmUploadDto {
  entity_type: string;
  entity_id: string;
  description?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
]);

@Injectable()
export class FilesService {
  constructor(private readonly activityLog: ActivityLogService) {}

  async presignUpload(body: any, userId: string) {
    const filename = body?.filename || body?.name;
    const contentType = body?.content_type || body?.contentType || body?.mimeType;
    const size = body?.size || body?.file_size || 0;

    if (!filename || !contentType) {
      throw new BadRequestException('filename and mimeType are required');
    }

    if (!ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
      throw new BadRequestException(
        `UNSUPPORTED_FILE_TYPE: Tipe file ${contentType} tidak didukung. Hanya dokumen & gambar yang diperbolehkan.`,
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (size > MAX_SIZE) {
      throw new BadRequestException('FILE_TOO_LARGE: Ukuran file melebihi batas maksimum 10MB');
    }

    const entityType = body?.entity_type || body?.entityType || 'General';
    const entityId = body?.entity_id || body?.entityId || randomUUID();
    const fileId = randomUUID();
    const sanitizedFilename = encodeURIComponent(filename.replace(/[^a-zA-Z0-9._-]/g, '_'));
    const uploadUrl = `/api/v1/files/upload/${fileId}`;
    const publicUrl = `/uploads/${entityType.toLowerCase()}/${entityId}/${sanitizedFilename}`;

    return {
      upload_url: uploadUrl,
      uploadUrl,
      file_id: fileId,
      fileId,
      public_url: publicUrl,
      publicUrl,
      token: `upl_${randomUUID()}`,
      expiresIn: 3600,
    };
  }

  async confirmUpload(fileId: string, dto: any, userId: string) {
    const entityType = dto?.entity_type || dto?.entityType || 'General';
    const entityId = dto?.entity_id || dto?.entityId || fileId;

    await this.activityLog.log({
      userId,
      type: LogActivityType.CREATE,
      entityType: 'FileAttachment',
      entityId: fileId,
      metadata: {
        targetEntityType: entityType,
        targetEntityId: entityId,
        description: dto?.description || '',
        checksum: dto?.checksum || '',
        actualSize: dto?.actualSize || dto?.size || 0,
        confirmedAt: new Date().toISOString(),
      },
    });

    return {
      confirmed: true,
      file_id: fileId,
      fileId,
      id: fileId,
      entity_type: entityType,
      entity_id: entityId,
    };
  }

  async listTemplates() {
    return [
      { id: 'tmpl-quotation', name: 'Standard Quotation Template', type: 'QUOTATION', format: 'PDF', active: true },
      { id: 'tmpl-invoice-dp', name: 'Faktur Uang Muka (DP)', type: 'INVOICE_DP', format: 'PDF', active: true },
      { id: 'tmpl-invoice-final', name: 'Faktur Pelunasan', type: 'INVOICE_FINAL', format: 'PDF', active: true },
      { id: 'tmpl-po', name: 'Purchase Order Standard', type: 'PURCHASE_ORDER', format: 'PDF', active: true },
      { id: 'tmpl-delivery-order', name: 'Delivery Order (DO)', type: 'DELIVERY_ORDER', format: 'PDF', active: true },
      { id: 'tmpl-surat-jalan', name: 'Surat Jalan Resmi', type: 'SURAT_JALAN', format: 'PDF', active: true },
      { id: 'tmpl-salary-slip', name: 'Slip Gaji Karyawan', type: 'SALARY_SLIP', format: 'PDF', active: true },
    ];
  }

  async listEmailTemplates() {
    return [
      { id: 'email-offering', title: 'Candidate Offering Letter', subject: 'Penawaran Kerjasama / Kerja NEX ERP', channel: 'EMAIL' },
      { id: 'email-interview', title: 'Undangan Interview Tahap Lanjut', subject: 'Undangan Wawancara Kandidat', channel: 'EMAIL' },
      { id: 'email-invoice-overdue', title: 'Pemberitahuan Tagihan Jatuh Tempo', subject: 'Pengingat Pembayaran Invoice', channel: 'EMAIL' },
      { id: 'email-sla-escalation', title: 'Eskalasi Approval Idle >24 Jam', subject: 'URGENT: Eskalasi Approval Tertunda', channel: 'EMAIL' },
    ];
  }

  async listSmsTemplates() {
    return [
      { id: 'wa-approval-req', title: 'WA Approval Request', body: 'Halo {name}, mohon review approval dokumen {docNumber}.', channel: 'WHATSAPP' },
      { id: 'wa-candidate-pass', title: 'WA Kelolosan Tahapan ATS', body: 'Selamat {name}, Anda lolos ke tahap {stage}.', channel: 'WHATSAPP' },
      { id: 'wa-payroll-ready', title: 'WA Notifikasi Slip Gaji', body: 'Slip gaji periode {period} telah diterbitkan.', channel: 'WHATSAPP' },
    ];
  }

  async listDocumentTemplates() {
    return this.listTemplates();
  }
}
