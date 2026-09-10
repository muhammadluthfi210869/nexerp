import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  assertSocialTransition,
  assertTaskTransition,
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
    ).toThrow(ConflictException);
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
});
