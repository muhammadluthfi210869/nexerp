import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  assertSocialTransition,
  assertTaskTransition,
  canAssignMarketingTask,
  ensureMarketingTaskRole,
  ensureSocialWriteRole,
  isMarketingManager,
  normalizeSocialStatus,
  normalizeTaskStatus,
} from '../marketing-domain.policy';

describe('canonical marketing domain policy', () => {
  const member = { id: 'member', roles: ['DIGIMAR'] };
  const manager = { id: 'manager', roles: ['MARKETING'] };

  it('recognizes only management roles as task managers', () => {
    expect(isMarketingManager(manager)).toBe(true);
    expect(isMarketingManager(member)).toBe(false);
    expect(isMarketingManager({ id: 'director', roles: ['DIRECTOR'] })).toBe(
      false,
    );
  });

  it('rejects non-marketing task roles', () => {
    expect(() =>
      ensureMarketingTaskRole({ id: 'director', roles: ['DIRECTOR'] }),
    ).toThrow(ForbiddenException);
  });

  it('allows DIGIMAR social writes but not COMMERCIAL', () => {
    expect(() => ensureSocialWriteRole(member)).not.toThrow();
    expect(() =>
      ensureSocialWriteRole({ id: 'sales', roles: ['COMMERCIAL'] }),
    ).toThrow(ForbiddenException);
  });

  it.each([
    ['NOT_STARTED', 'IN_PROGRESS'],
    ['IN_PROGRESS', 'IN_REVIEW'],
    ['IN_REVIEW', 'REVISION'],
    ['REVISION', 'IN_PROGRESS'],
    ['IN_REVIEW', 'DONE'],
  ] as const)('allows task transition %s -> %s', (from, to) => {
    expect(() =>
      assertTaskTransition({
        from,
        to,
        isManager: false,
        incompleteRequiredItems: 0,
      }),
    ).not.toThrow();
  });

  it('blocks DONE while mandatory checklist remains', () => {
    expect(() =>
      assertTaskTransition({
        from: 'IN_REVIEW',
        to: 'DONE',
        isManager: false,
        incompleteRequiredItems: 1,
      }),
    ).toThrow(UnprocessableEntityException);
  });

  it('requires manager and reason to cancel', () => {
    expect(() =>
      assertTaskTransition({
        from: 'IN_PROGRESS',
        to: 'CANCELLED',
        isManager: false,
        reason: 'stop',
      }),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertTaskTransition({
        from: 'IN_PROGRESS',
        to: 'CANCELLED',
        isManager: true,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      assertTaskTransition({
        from: 'IN_PROGRESS',
        to: 'CANCELLED',
        isManager: true,
        reason: 'campaign stopped',
      }),
    ).not.toThrow();
  });

  it('requires manager and reason to reopen DONE', () => {
    expect(() =>
      assertTaskTransition({
        from: 'DONE',
        to: 'IN_PROGRESS',
        isManager: false,
        reason: 'fix',
      }),
    ).toThrow(ForbiddenException);
    expect(() =>
      assertTaskTransition({
        from: 'DONE',
        to: 'IN_PROGRESS',
        isManager: true,
        reason: 'new correction',
      }),
    ).not.toThrow();
  });

  it('normalizes legacy task values at compatibility boundary', () => {
    expect(normalizeTaskStatus('Working on it')).toBe('IN_PROGRESS');
    expect(normalizeTaskStatus('Review')).toBe('IN_REVIEW');
    expect(normalizeTaskStatus('Completed')).toBe('DONE');
  });

  it('rejects an unknown legacy task value', () => {
    expect(() => normalizeTaskStatus('Almost maybe')).toThrow(
      BadRequestException,
    );
  });

  it('enforces the forward social workflow', () => {
    expect(() =>
      assertSocialTransition({ from: 'DRAFT', to: 'SCRIPTING' }),
    ).not.toThrow();
    expect(() =>
      assertSocialTransition({ from: 'DRAFT', to: 'PUBLISHED' }),
    ).toThrow(ConflictException);
  });

  it('requires scheduling identity and time', () => {
    expect(() =>
      assertSocialTransition({
        from: 'APPROVED',
        to: 'SCHEDULED',
        hasBrand: true,
        hasAssignee: false,
        scheduledAt: new Date(),
      }),
    ).toThrow(BadRequestException);
  });

  it('requires publication evidence and published time', () => {
    expect(() =>
      assertSocialTransition({
        from: 'SCHEDULED',
        to: 'PUBLISHED',
        publishedAt: new Date(),
        hasPublicationEvidence: false,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      assertSocialTransition({
        from: 'SCHEDULED',
        to: 'PUBLISHED',
        publishedAt: new Date(),
        hasPublicationEvidence: true,
      }),
    ).not.toThrow();
  });

  it('normalizes legacy social review status', () => {
    expect(normalizeSocialStatus('review')).toBe('IN_REVIEW');
    expect(normalizeSocialStatus('published')).toBe('PUBLISHED');
  });

  describe('canAssignMarketingTask delegation matrix', () => {
    const revita = { id: 'u-revita', email: 'revita@nexerp.id', fullName: 'Revita', roles: ['MARKETING', 'DIGIMAR'] };
    const rahmat = { id: 'u-rahmat', email: 'rahmat@nexerp.id', fullName: 'Rahmat Hidayat', roles: ['DIGIMAR'] };
    const gusti = { id: 'u-gusti', email: 'gusti@nexerp.id', fullName: 'Gusti Bagus', roles: ['DIGIMAR'] };
    const zarkasi = { id: 'u-zarkasi', email: 'zarkasi@nexerp.id', fullName: 'Muhammad Zarkasi', roles: ['DIGIMAR'] };
    const aurel = { id: 'u-aurel', email: 'aurel@nexerp.id', fullName: 'Aurelia Putri', roles: ['DIGIMAR'] };

    it('Revita as Marketing Manager can assign tasks to ALL staff', () => {
      expect(canAssignMarketingTask(revita, gusti)).toBe(true);
      expect(canAssignMarketingTask(revita, zarkasi)).toBe(true);
      expect(canAssignMarketingTask(revita, rahmat)).toBe(true);
      expect(canAssignMarketingTask(revita, aurel)).toBe(true);
      expect(canAssignMarketingTask(revita, revita)).toBe(true);
    });

    it('Rahmat has delegated access to assign tasks to Zarkasi, Gusti, and himself', () => {
      expect(canAssignMarketingTask(rahmat, gusti)).toBe(true);
      expect(canAssignMarketingTask(rahmat, zarkasi)).toBe(true);
      expect(canAssignMarketingTask(rahmat, rahmat)).toBe(true);
    });

    it('Rahmat CANNOT assign tasks to Revita or Aurel', () => {
      expect(canAssignMarketingTask(rahmat, revita)).toBe(false);
      expect(canAssignMarketingTask(rahmat, aurel)).toBe(false);
    });

    it('Gusti can only assign to himself, NOT to others', () => {
      expect(canAssignMarketingTask(gusti, gusti)).toBe(true);
      expect(canAssignMarketingTask(gusti, zarkasi)).toBe(false);
      expect(canAssignMarketingTask(gusti, rahmat)).toBe(false);
      expect(canAssignMarketingTask(gusti, revita)).toBe(false);
    });

    it('Zarkasi can only assign to himself, NOT to others', () => {
      expect(canAssignMarketingTask(zarkasi, zarkasi)).toBe(true);
      expect(canAssignMarketingTask(zarkasi, gusti)).toBe(false);
      expect(canAssignMarketingTask(zarkasi, rahmat)).toBe(false);
    });
  });
});
