import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SOCIAL_STATUSES, TASK_STATUSES } from './marketing-domain.policy';

export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @IsString() @MaxLength(120) q?: string;
  @IsOptional() @IsString() @MaxLength(50) sort?: string;
}

export class TaskListQueryDto extends PaginationQueryDto {
  @IsOptional() @IsIn(TASK_STATUSES) status?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() brandId?: string;
}

export class CreateChecklistItemDto {
  @IsString() @MinLength(1) @MaxLength(255) text!: string;
  @IsOptional() @IsBoolean() isRequired = true;
  @IsOptional() @IsInt() @Min(0) sortOrder = 0;
}

export class CreateCanonicalTaskDto {
  @IsIn(['DAILY', 'PROJECT']) type!: 'DAILY' | 'PROJECT';
  @IsString() @MinLength(1) @MaxLength(255) title!: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsString() @MinLength(1) @MaxLength(100) channel!: string;
  @IsString() @MinLength(1) @MaxLength(100) category!: string;
  @IsUUID() assigneeId!: string;
  @IsOptional() @IsUUID() reviewerId?: string;
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) priority!: string;
  @IsDateString() startDate!: string;
  @IsDateString() dueDate!: string;
  @IsOptional() @IsString() @MaxLength(20_000) brief?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  outputUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  referenceUrl?: string;
  @IsOptional() @IsInt() @Min(0) estimatedMinutes = 0;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  checklist?: CreateChecklistItemDto[];
}

export class UpdateCanonicalTaskDto {
  @IsInt() @Min(1) version!: number;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(255) title?: string;
  @IsOptional() @IsUUID() projectId?: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) channel?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(100) category?: string;
  @IsOptional() @IsUUID() assigneeId?: string;
  @IsOptional() @IsUUID() reviewerId?: string;
  @IsOptional() @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']) priority?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() @MaxLength(20_000) brief?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  outputUrl?: string;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  referenceUrl?: string;
  @IsOptional() @IsInt() @Min(0) estimatedMinutes?: number;
  @IsOptional() @IsInt() @Min(0) actualMinutes?: number;
}

export class UpdateTaskStatusDto {
  @IsIn(TASK_STATUSES) status!: (typeof TASK_STATUSES)[number];
  @IsInt() @Min(1) version!: number;
  @IsOptional() @IsString() @MaxLength(1_000) reason?: string;
}

export class UpdateChecklistItemDto {
  @IsInt() @Min(1) version!: number;
  @IsBoolean() done!: boolean;
}

export class CreateTaskCommentDto {
  @IsString() @MinLength(1) @MaxLength(5_000) body!: string;
}

export class CreateCanonicalProjectDto {
  @IsString() @MinLength(1) @MaxLength(255) name!: string;
  @IsString() @MinLength(1) @MaxLength(100) channel!: string;
  @IsString() @MinLength(1) @MaxLength(100) category!: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsString() @MaxLength(10_000) summary?: string;
}

export class UpdateCanonicalProjectDto {
  @IsInt() @Min(1) version!: number;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(255) name?: string;
  @IsOptional()
  @IsIn(['PLANNED', 'ON_TRACK', 'AT_RISK', 'ON_HOLD', 'COMPLETED', 'CANCELLED'])
  status?: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() deadline?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) progress?: number;
  @IsOptional() @IsString() @MaxLength(10_000) summary?: string;
  @IsOptional() @IsString() @MaxLength(10_000) blockers?: string;
}

export class CreateBrandDto {
  @IsString() @Matches(/^[A-Z0-9_]{2,50}$/) code!: string;
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(120) handle?: string;
  @IsOptional() @IsString() @MaxLength(50) primaryPlatform?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsString() @MaxLength(10_000) notes?: string;
  @IsOptional()
  @IsIn(['blue', 'amber', 'emerald', 'violet', 'rose', 'slate'])
  accentToken?: string;
}

export class UpdateBrandDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(120) handle?: string;
  @IsOptional() @IsString() @MaxLength(50) primaryPlatform?: string;
  @IsOptional() @IsUUID() ownerId?: string;
  @IsOptional() @IsString() @MaxLength(10_000) notes?: string;
  @IsOptional()
  @IsIn(['blue', 'amber', 'emerald', 'violet', 'rose', 'slate'])
  accentToken?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReportingQueryDto extends PaginationQueryDto {
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsString() @MaxLength(50) channel?: string;
  @IsOptional() @IsDateString() periodStart?: string;
  @IsOptional() @IsDateString() periodEnd?: string;
}

export class UpsertChannelMetricDto {
  @IsUUID() brandId!: string;
  @IsDateString() periodStart!: string;
  @IsDateString() periodEnd!: string;
  @IsString() @MaxLength(50) channel!: string;
  @IsOptional()
  @IsIn(['MANUAL', 'META', 'TIKTOK', 'YOUTUBE', 'GA4', 'GADS'])
  source = 'MANUAL';
  @IsOptional() @IsInt() @Min(0) followersStart = 0;
  @IsOptional() @IsInt() @Min(0) followersEnd = 0;
  @IsOptional() @IsInt() @Min(0) reach = 0;
  @IsOptional() @IsInt() @Min(0) views = 0;
  @IsOptional() @IsInt() @Min(0) impressions = 0;
  @IsOptional() @IsInt() @Min(0) likes = 0;
  @IsOptional() @IsInt() @Min(0) comments = 0;
  @IsOptional() @IsInt() @Min(0) shares = 0;
  @IsOptional() @IsInt() @Min(0) saves = 0;
  @IsOptional() @IsInt() @Min(0) clicks = 0;
  @IsOptional() @IsInt() @Min(0) leads = 0;
  @IsOptional() @IsInt() @Min(0) sampleRequests = 0;
  @IsOptional() @IsInt() @Min(0) deals = 0;
  @IsOptional() @Type(() => Number) @Min(0) spend = 0;
  @IsOptional() @Type(() => Number) @Min(0) revenue = 0;
}

export class ConfigureIntegrationDto {
  @IsUUID() brandId!: string;
  @IsIn(['META', 'TIKTOK', 'YOUTUBE', 'GA4', 'GADS']) provider!: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(20_000) secret?: string;
  @IsOptional() @IsObject() config?: Record<string, unknown>;
  @IsOptional() @IsArray() @IsString({ each: true }) scopes?: string[];
}

export class TriggerIntegrationSyncDto {
  @IsUUID() connectionId!: string;
}

export { SOCIAL_STATUSES };
