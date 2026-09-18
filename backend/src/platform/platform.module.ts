import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformConfigModule } from './config/config.module';
import { SessionService } from './auth/session.service';
import { MfaService } from './auth/mfa.service';
import { PolicyService } from './policy/policy.service';
import { ScopeService } from './scope/scope.service';
import { AuditService } from './audit/audit.service';
import { ApprovalService } from './approval/approval.service';
import { OutboxService } from './outbox/outbox.service';
import { CommunicationAclService } from './communication/acl.adapter';
import { CanonicalErrorFilter } from './errors/error.filter';
import { PolicyGuard } from './policy/policy.guard';

@Global()
@Module({
  imports: [PrismaModule, PlatformConfigModule],
  providers: [
    SessionService,
    MfaService,
    PolicyService,
    ScopeService,
    AuditService,
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
    ApprovalService,
    OutboxService,
    CommunicationAclService,
    CanonicalErrorFilter,
    PolicyGuard,
  ],
})
export class PlatformModule {}
