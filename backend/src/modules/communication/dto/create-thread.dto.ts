import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  contextType!: string; // polymorphic: SalesOrder, PurchaseOrder, Invoice, ...

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  contextId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;
}

export class UpdateThreadDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  // PATCH only allows close/archive (NOT delete).
  @IsOptional()
  status?: 'OPEN' | 'CLOSED' | 'ARCHIVED';
}
