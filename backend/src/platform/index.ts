/**
 * NEX ERP - Platform Cross-Cutting Module Barrel
 *
 * P05 owns this directory. Every exported symbol below is the canonical
 * implementation invoked by the gates in scripts/ssot/lib/p05_gates.js
 * and by the 31 production-path mutations in test_p05_platform_negative.js.
 */

export * from './auth/session.service';
export * from './auth/mfa.service';
export * from './policy/policy.service';
export * from './scope/scope.service';
export * from './audit/audit.service';
export * from './approval/approval.service';
export * from './outbox/outbox.service';
export * from './communication/acl.adapter';
export * from './errors/error.factory';
export * from './config/config.module';
