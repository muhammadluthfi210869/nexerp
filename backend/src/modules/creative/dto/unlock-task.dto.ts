import { IsOptional, IsIn, IsString } from 'class-validator';

export type UnlockAction = 'CHARGE' | 'WAIVE';

export class UnlockTaskDto {
  @IsOptional()
  @IsIn(['CHARGE', 'WAIVE'])
  action?: UnlockAction;

  @IsOptional()
  @IsString()
  managerPin?: string;

  /**
   * BUS-RULE-111 / DEC-2026-09-20-056. Required by the service for a supervisor
   * reopen: the reopen is recorded in the design history, so it needs a reason.
   */
  @IsOptional()
  @IsString()
  reason?: string;
}
