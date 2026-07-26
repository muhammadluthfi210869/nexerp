import { IsOptional, IsString } from 'class-validator';

export class MonthQueryDto {
  @IsOptional()
  @IsString()
  month?: string;
}

export class WeeklyQueryDto extends MonthQueryDto {
  @IsOptional()
  @IsString()
  platform?: 'Instagram' | 'TikTok';
}
