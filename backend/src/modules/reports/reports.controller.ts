import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { FinancialReportsService } from './services/financial-reports.service';
import { OperationalReportsService } from './services/operational-reports.service';
import {
  DateRangeQueryDto,
  GeneralLedgerQueryDto,
  BudgetVsActualQueryDto,
  CostVarianceQueryDto,
  StockReportQueryDto,
  GoodsMutationQueryDto,
  FollowUpCustomerQueryDto,
} from './dto/report-query.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly financialReports: FinancialReportsService,
    private readonly operationalReports: OperationalReportsService,
  ) {}

  // This module owns only the /reports/* paths no other controller declares.
  //
  // It used to also declare profit-loss, balance-sheet, trial-balance, cash-flow,
  // ar-aging, ap-aging, stock-valuation and sales-summary. ExecutiveModule is
  // imported before ReportsModule in `app.module.ts`, so Express answered every
  // one of those eight from `executive/reports.controller.ts` and these handlers
  // could never run — a second, contradicting implementation of the same report
  // (this one groups AR/AP per customer, the live one per invoice; this one emits
  // `coa_code`, the live one `code`). They were removed rather than the live ones
  // because the frontend is built against the live shapes, including the
  // `summary` block this module never returns.
  //
  // A new /reports path belongs here; re-declaring one of those eight will be
  // caught by `scripts/__tests__/backend-route-uniqueness.test.sh`.

  // ==========================================
  // 1. FINANCIAL REPORTS
  // ==========================================

  @Get('general-ledger')
  @ApiOperation({ summary: 'General ledger journal entries per COA' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getGeneralLedger(@Query() query: GeneralLedgerQueryDto) {
    return this.financialReports.getGeneralLedger(query);
  }

  @Get('budget-vs-actual')
  @ApiOperation({ summary: 'Budget vs actual variance report' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getBudgetVsActual(@Query() query: BudgetVsActualQueryDto) {
    return this.financialReports.getBudgetVsActual(query);
  }

  @Get('cost-variance')
  @ApiOperation({ summary: 'Standard vs actual cost variance report' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.PRODUCTION)
  getCostVariance(@Query() query: CostVarianceQueryDto) {
    return this.financialReports.getCostVariance(query);
  }

  @Get('product-profitability')
  @ApiOperation({ summary: 'Product profitability & margin analysis' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.COMMERCIAL)
  getProductProfitability(@Query() query: DateRangeQueryDto) {
    return this.financialReports.getProductProfitability(query);
  }

  // ==========================================
  // 2. OPERATIONAL, WAREHOUSE & SCM REPORTS
  // ==========================================

  @Get('stock')
  @ApiOperation({ summary: 'Stock report with BUS-RULE-053 Bagus/Reject/Free pillars' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.WAREHOUSE, UserRole.SCM)
  getStockReport(@Query() query: StockReportQueryDto) {
    return this.operationalReports.getStockReport(query);
  }

  @Get('mutation-goods')
  @ApiOperation({ summary: 'Goods mutation with opening, in, out, adj, closing quantities' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  getGoodsMutation(@Query() query: GoodsMutationQueryDto) {
    return this.operationalReports.getGoodsMutation(query);
  }

  @Get('follow-up-customer')
  @ApiOperation({ summary: 'BusDev follow-up report (leads to conversion)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.COMMERCIAL)
  getFollowUpCustomer(@Query() query: FollowUpCustomerQueryDto) {
    return this.operationalReports.getFollowUpCustomer(query);
  }

  @Get('guest-book')
  @ApiOperation({ summary: 'Guest book report (buku tamu)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.COMMERCIAL)
  getGuestBook(@Query() query: DateRangeQueryDto) {
    return this.operationalReports.getGuestBook(query);
  }

  @Post('goods-receipts')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate goods receipt report (asynchronous 202)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  generateGoodsReceiptReport() {
    return this.operationalReports.generateGoodsReceiptReport();
  }
}
