import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformConfigModule } from './config/config.module';
import { SessionService } from './auth/session.service';
import { MfaService } from './auth/mfa.service';
import { PolicyService } from './policy/policy.service';
import { ScopeService } from './scope/scope.service';
import { AuditService } from './audit/audit.service';
import { AuditLogInterceptor } from './audit/audit.interceptor';
import { ApprovalService } from './approval/approval.service';
import { OutboxService } from './outbox/outbox.service';
import { CommunicationAclService } from './communication/acl.adapter';
import { CanonicalErrorFilter } from './errors/error.filter';
import { PolicyGuard } from './policy/policy.guard';
import { DecisionController } from './approval/decision.controller';
import { TenantMiddleware } from './tenant/tenant.middleware';
import { TenantContextInterceptor } from './tenant/tenant.interceptor';

@Global()
@Module({
  imports: [PrismaModule, PlatformConfigModule],
  controllers: [DecisionController],
  providers: [
    SessionService,
    MfaService,
    PolicyService,
    ScopeService,
    AuditService,
    AuditLogInterceptor,
    TenantContextInterceptor,
    // Order matters: APP_INTERCEPTOR providers run in registration order, so the
    // tenant context is published before the audit interceptor reads it.
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
    TenantMiddleware,
    ApprovalService,
    OutboxService,
    CommunicationAclService,
    CanonicalErrorFilter,
    PolicyGuard,
  ],
  exports: [
    PlatformConfigModule,
    SessionService,
    MfaService,
    PolicyService,
    ScopeService,
    AuditService,
    AuditLogInterceptor,
    TenantContextInterceptor,
    TenantMiddleware,
    ApprovalService,
    OutboxService,
    CommunicationAclService,
    CanonicalErrorFilter,
    PolicyGuard,
  ],
})
export class PlatformModule {}
