import { IsOptional, IsString, IsBoolean, IsEnum, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class DateRangeQueryDto {
  @IsOptional()
  @IsString()
  date_from?: string;

  @IsOptional()
  @IsString()
  date_to?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class ProfitLossQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  compare?: boolean;
}

export class BalanceSheetQueryDto {
  @IsOptional()
  @IsString()
  as_of?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  compare?: boolean;
}

export class GeneralLedgerQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsString()
  coa_id?: string;

  @IsOptional()
  @IsString()
  accountId?: string;
}

export class ArAgingQueryDto {
  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  as_of?: string;
}

export class ApAgingQueryDto {
  @IsOptional()
  @IsString()
  supplier_id?: string;

  @IsOptional()
  @IsString()
  as_of?: string;
}

export class StockReportQueryDto {
  @IsOptional()
  @IsString()
  warehouse_id?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  as_of?: string;
}

export enum ValuationMethod {
  FIFO = 'FIFO',
  AVERAGE = 'AVERAGE',
}

export class StockValuationQueryDto {
  @IsOptional()
  @IsString()
  as_of?: string;

  @IsOptional()
  @IsEnum(ValuationMethod)
  method?: ValuationMethod = ValuationMethod.AVERAGE;
}

export class GoodsMutationQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsString()
  goods_id?: string;

  @IsOptional()
  @IsString()
  warehouse_id?: string;
}

export enum SalesSummaryGroupBy {
  CUSTOMER = 'customer',
  GOODS = 'goods',
  OWNER = 'owner',
  MONTH = 'month',
}

export class SalesSummaryQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsEnum(SalesSummaryGroupBy)
  group_by?: SalesSummaryGroupBy = SalesSummaryGroupBy.CUSTOMER;
}

export class FollowUpCustomerQueryDto extends DateRangeQueryDto {
  @IsOptional()
  @IsString()
  owner_user_id?: string;
}

export class BudgetVsActualQueryDto {
  @IsOptional()
  @IsString()
  period?: string; // YYYY-MM
}

export class CostVarianceQueryDto {
  @IsOptional()
  @IsString()
  batch_record_id?: string;
}
