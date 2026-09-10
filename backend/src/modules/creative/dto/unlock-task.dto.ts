import { IsOptional, IsIn, IsString } from 'class-validator';

export type UnlockAction = 'CHARGE' | 'WAIVE';

export class UnlockTaskDto {
  @IsOptional()
  @IsIn(['CHARGE', 'WAIVE'])
  action?: UnlockAction;

  @IsOptional()
  @IsString()
  managerPin?: string;
}
