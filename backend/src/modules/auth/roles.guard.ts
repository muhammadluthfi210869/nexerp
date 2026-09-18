/**
 * P05 — RolesGuard is re-exported from the canonical policy guard.
 * This keeps existing @UseGuards(roles.guard.ts) imports working while
 * delegating enforcement to platform/policy/policy.guard.
 */
export { PolicyGuard as RolesGuard } from '../../platform/policy/policy.guard';
