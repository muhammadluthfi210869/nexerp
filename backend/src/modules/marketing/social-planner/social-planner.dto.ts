import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

const PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'threads',
  'youtube',
  'linkedin',
];
const CONTENT_TYPES = [
  'reel',
  'carousel',
  'single_post',
  'story',
  'video',
  'live',
];
const POST_STATUSES = [
  'idea',
  'draft',
  'scripting',
  'review',
  'scheduled',
  'published',
  'archived',
];

export class SocialChecklistItemDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(255)
  text!: string;

  @IsBoolean()
  done!: boolean;
}

export class SocialPostAuthorDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  @MaxLength(100)
  role!: string;
}

export class SocialPostPerformanceDto {
  @IsOptional() @IsNumber() @Min(0) reach?: number;
  @IsOptional() @IsNumber() @Min(0) impressions?: number;
  @IsOptional() @IsNumber() @Min(0) likes?: number;
  @IsOptional() @IsNumber() @Min(0) comments?: number;
  @IsOptional() @IsNumber() @Min(0) shares?: number;
  @IsOptional() @IsNumber() @Min(0) saves?: number;
  @IsOptional() @IsNumber() @Min(0) videoViews?: number;
  @IsOptional() @IsNumber() @Min(0) clicks?: number;
  @IsOptional() @IsNumber() @Min(0) engagementRate?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(100) viralityScore?: number;
  @IsOptional() @IsNumber() @Min(0) costPerResult?: number;
}

export class CreateSocialPostDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional() @IsIn(PLATFORMS) platform?: string;
  @IsOptional() @IsIn(CONTENT_TYPES) contentType?: string;
  @IsOptional() @IsIn(POST_STATUSES) status?: string;
  @IsOptional() @IsString() scheduledDate?: string;
  @IsOptional() @IsString() publishedDate?: string;
  @IsOptional() @IsString() @MaxLength(100) pillar?: string;
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) hooks?: string[];
  @IsOptional() @IsString() @MaxLength(255) cta?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) hashtags?: string[];
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) mediaUrls?: string[];
  @IsOptional() @IsString() metaPostId?: string;
  @IsOptional() @IsString() metaPermalink?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() @MaxLength(255) targetAudience?: string;
  @IsOptional() @IsString() @MaxLength(255) campaign?: string;
  @IsOptional() @IsString() calloutText?: string;
  @IsOptional() @IsString() @MaxLength(20) calloutEmoji?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialPostAuthorDto)
  author?: SocialPostAuthorDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialPostPerformanceDto)
  performance?: SocialPostPerformanceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialChecklistItemDto)
  checklist?: SocialChecklistItemDto[];
}

export class UpdateSocialPostDto extends PartialType(CreateSocialPostDto) {}

export class MetaConnectionDto {
  @IsOptional() @IsString() accessToken?: string;
  @IsOptional() @IsString() @MaxLength(100) pageId?: string;
  @IsOptional() @IsString() @MaxLength(100) igAccountId?: string;
}

export class MetaInsightsDto extends MetaConnectionDto {
  @IsOptional() @IsIn(['day', 'week', 'days_28', 'lifetime']) period?: string;
}

export class GenerateSocialCopyDto {
  @IsIn([
    'generate_hooks',
    'generate_caption',
    'generate_hashtags',
    'improve_caption',
  ])
  action!: string;

  @IsOptional() @IsString() topic?: string;
  @IsOptional() @IsString() platform?: string;
  @IsOptional() @IsString() pillar?: string;
  @IsOptional() @IsString() audience?: string;
  @IsOptional() @IsString() existingCaption?: string;
}
