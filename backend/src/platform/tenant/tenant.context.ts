/**
 * NEX ERP - Tenant Context (AsyncLocalStorage)
 *
 * Provides thread-safe, request-scoped tenant isolation context.
 * Accessible across any service without passing Request object.
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextData {
  userId?: string;
  organizationId?: string;
  tenantId?: string;
  divisionId?: string;
  roles?: string[];
}

export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantContextData>();

  static run<T>(data: TenantContextData, callback: () => T): T {
    return this.storage.run(data, callback);
  }

  /**
   * Bind the store for the remainder of the current async execution. Used from an
   * interceptor, where guards have already verified `req.user` and there is no
   * callback boundary to nest `run()` inside.
   */
  static enterWith(data: TenantContextData): void {
    this.storage.enterWith(data);
  }

  static current(): TenantContextData | undefined {
    return this.storage.getStore();
  }

  static getTenantId(): string | undefined {
    const store = this.storage.getStore();
    return store?.tenantId || store?.organizationId;
  }

  static getOrganizationId(): string | undefined {
    const store = this.storage.getStore();
    return store?.organizationId || store?.tenantId;
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  static getRoles(): string[] {
    return this.storage.getStore()?.roles || [];
  }

  static isSuperAdmin(): boolean {
    const roles = this.getRoles();
    return roles.some((r) => {
      const lower = r.toLowerCase();
      return (
        lower === 'superadmin' ||
        lower === 'super_admin' ||
        lower === 'role-nex-super-admin'
      );
    });
  }
}
