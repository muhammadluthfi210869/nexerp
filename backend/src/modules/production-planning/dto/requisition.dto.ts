import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class IssueRequisitionDto {
  @IsNumber()
  @IsNotEmpty()
  qtyIssued!: number;
}

export class CreateRequisitionDto {
  @IsUUID()
  @IsNotEmpty()
  woId!: string;

  @IsUUID()
  @IsNotEmpty()
  materialId!: string;

  @IsNumber()
  @IsNotEmpty()
  qtyRequested!: number;
}
