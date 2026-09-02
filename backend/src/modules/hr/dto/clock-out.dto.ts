import { IsUUID } from 'class-validator';

export class ClockOutDto {
  @IsUUID()
  employeeId!: string;
}
