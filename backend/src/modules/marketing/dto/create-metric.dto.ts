import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdPlatform, MarketingChannel } from '@prisma/client';

export class CreateMetricDto {
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsEnum(MarketingChannel)
  channel!: MarketingChannel;

  @IsEnum(AdPlatform)
  platform!: AdPlatform;

  @IsNumber()
  @IsOptional()
  reach?: number;

  @IsNumber()
  @IsOptional()
  impressions?: number;

  @IsNumber()
  @IsOptional()
  clicks?: number;

  @IsNumber()
  @IsOptional()
  leads?: number;

  @IsNumber()
  @IsOptional()
  ad_spend?: number;

  @IsString()
  @IsOptional()
  campaignName?: string;

  @IsString()
  @IsOptional()
  userId?: string;
}
