import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';

export const TASK_STATUSES = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'IN_REVIEW',
  'REVISION',
  'DONE',
  'CANCELLED',
] as const;

export const SOCIAL_STATUSES = [
  'IDEA',
  'DRAFT',
  'SCRIPTING',
  'PRODUCTION',
  'IN_REVIEW',
  'REVISION',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type SocialStatus = (typeof SOCIAL_STATUSES)[number];

export type MarketingViewer = {
  id: string;
  email?: string | null;
  roles: string[];
};

const TASK_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['IN_REVIEW'],
  IN_REVIEW: ['DONE', 'REVISION'],
  REVISION: ['IN_PROGRESS'],
  DONE: [],
  CANCELLED: [],
};

const SOCIAL_TRANSITIONS: Record<SocialStatus, readonly SocialStatus[]> = {
  IDEA: ['DRAFT'],
  DRAFT: ['SCRIPTING'],
  SCRIPTING: ['PRODUCTION'],
  PRODUCTION: ['IN_REVIEW'],
  IN_REVIEW: ['APPROVED', 'REVISION'],
  REVISION: ['PRODUCTION'],
  APPROVED: ['SCHEDULED'],
  SCHEDULED: ['PUBLISHED'],
  PUBLISHED: [],
  ARCHIVED: [],
};

export function isMarketingManager(viewer: MarketingViewer) {
  return viewer.roles.some((role) =>
    ['SUPER_ADMIN', 'HEAD_OPS', 'MARKETING'].includes(role),
  );
}

export function ensureMarketingTaskRole(viewer: MarketingViewer) {
  if (
    !viewer.roles.some((role) =>
      ['SUPER_ADMIN', 'HEAD_OPS', 'MARKETING', 'DIGIMAR'].includes(role),
    )
  ) {
    throw new ForbiddenException({
      code: 'MARKETING_TASK_FORBIDDEN',
      message: 'Akses Management Task ditolak.',
    });
  }
}

export function ensureSocialWriteRole(viewer: MarketingViewer) {
  if (
    !viewer.roles.some((role) =>
      ['SUPER_ADMIN', 'MARKETING', 'DIGIMAR'].includes(role),
    )
  ) {
    throw new ForbiddenException({
      code: 'SOCIAL_WRITE_FORBIDDEN',
      message: 'Akses tulis Social Media ditolak.',
    });
  }
}

export function assertTaskTransition(input: {
  from: TaskStatus;
  to: TaskStatus;
  isManager: boolean;
  incompleteRequiredItems?: number;
  reason?: string;
}) {
  if (input.from === input.to) return;
  const reason = input.reason?.trim();

  if (input.to === 'CANCELLED') {
    if (!input.isManager)
      throw new ForbiddenException({
        code: 'TASK_CANCEL_MANAGER_REQUIRED',
        message: 'Pembatalan task memerlukan manager.',
      });
    if (!reason)
      throw new BadRequestException({
        code: 'TASK_CANCEL_REASON_REQUIRED',
        message: 'Alasan pembatalan wajib diisi.',
        fieldErrors: { reason: 'required' },
      });
    return;
  }

  if (input.from === 'DONE') {
    if (!input.isManager)
      throw new ForbiddenException({
        code: 'TASK_REOPEN_MANAGER_REQUIRED',
        message: 'Membuka ulang task memerlukan manager.',
      });
    if (input.to !== 'IN_PROGRESS' || !reason) {
      throw new BadRequestException({
        code: 'TASK_REOPEN_REASON_REQUIRED',
        message: 'Task hanya dapat dibuka ulang ke IN_PROGRESS dengan alasan.',
        fieldErrors: { reason: 'required' },
      });
    }
    return;
  }

  if (input.from === 'CANCELLED') {
    throw new ConflictException({
      code: 'TASK_TERMINAL_STATE',
      message: 'Task yang dibatalkan tidak dapat dipindahkan.',
    });
  }

  if (!TASK_TRANSITIONS[input.from].includes(input.to)) {
    throw new ConflictException({
      code: 'TASK_INVALID_TRANSITION',
      message: `Transisi ${input.from} ke ${input.to} tidak diizinkan.`,
    });
  }
  if (input.to === 'DONE' && (input.incompleteRequiredItems ?? 0) > 0) {
    throw new UnprocessableEntityException({
      code: 'TASK_CHECKLIST_INCOMPLETE',
      message: 'Semua checklist wajib harus selesai sebelum task ditutup.',
    });
  }
}

export function assertSocialTransition(input: {
  from: SocialStatus;
  to: SocialStatus;
  hasBrand?: boolean;
  hasAssignee?: boolean;
  scheduledAt?: Date | null;
  publishedAt?: Date | null;
  hasPublicationEvidence?: boolean;
}) {
  if (input.from === input.to) return;
  if (input.to === 'ARCHIVED') return;
  if (!SOCIAL_TRANSITIONS[input.from].includes(input.to)) {
    throw new ConflictException({
      code: 'SOCIAL_INVALID_TRANSITION',
      message: `Transisi ${input.from} ke ${input.to} tidak diizinkan.`,
    });
  }
  if (
    input.to === 'SCHEDULED' &&
    (!input.hasBrand || !input.hasAssignee || !input.scheduledAt)
  ) {
    throw new BadRequestException({
      code: 'SOCIAL_SCHEDULE_REQUIREMENTS',
      message:
        'Brand, assignee, dan waktu terjadwal wajib sebelum penjadwalan.',
      fieldErrors: {
        brandId: 'required',
        assigneeId: 'required',
        scheduledAt: 'required',
      },
    });
  }
  if (
    input.to === 'PUBLISHED' &&
    (!input.publishedAt || !input.hasPublicationEvidence)
  ) {
    throw new BadRequestException({
      code: 'SOCIAL_PUBLICATION_EVIDENCE_REQUIRED',
      message: 'Waktu publikasi dan bukti publikasi wajib diisi.',
      fieldErrors: { publishedAt: 'required', publicationEvidence: 'required' },
    });
  }
}

export function normalizeTaskStatus(value: string): TaskStatus {
  const normalized = value.trim().toUpperCase().replaceAll(' ', '_');
  const aliases: Record<string, TaskStatus> = {
    OPEN: 'NOT_STARTED',
    NOT_STARTED: 'NOT_STARTED',
    WORKING_ON_IT: 'IN_PROGRESS',
    PROGRESS: 'IN_PROGRESS',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'IN_REVIEW',
    IN_REVIEW: 'IN_REVIEW',
    REVISION: 'REVISION',
    DONE: 'DONE',
    COMPLETED: 'DONE',
    CANCELLED: 'CANCELLED',
    CANCELED: 'CANCELLED',
  };
  const result = aliases[normalized];
  if (!result)
    throw new BadRequestException({
      code: 'TASK_STATUS_INVALID',
      message: `Status task '${value}' tidak dikenal.`,
    });
  return result;
}

export function normalizeSocialStatus(value: string): SocialStatus {
  const normalized = value.trim().toUpperCase().replaceAll(' ', '_');
  const aliases: Record<string, SocialStatus> = { REVIEW: 'IN_REVIEW' };
  const candidate = aliases[normalized] ?? normalized;
  if (!SOCIAL_STATUSES.includes(candidate)) {
    throw new BadRequestException({
      code: 'SOCIAL_STATUS_INVALID',
      message: `Status social '${value}' tidak dikenal.`,
    });
  }
  return candidate;
}
