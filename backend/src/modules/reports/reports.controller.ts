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
  ProfitLossQueryDto,
  BalanceSheetQueryDto,
  DateRangeQueryDto,
  GeneralLedgerQueryDto,
  ArAgingQueryDto,
  ApAgingQueryDto,
  BudgetVsActualQueryDto,
  CostVarianceQueryDto,
  StockReportQueryDto,
  StockValuationQueryDto,
  GoodsMutationQueryDto,
  SalesSummaryQueryDto,
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

  // ==========================================
  // 1. FINANCIAL REPORTS
  // ==========================================

  @Get('profit-loss')
  @ApiOperation({ summary: 'Profit & Loss Statement with BUS-RULE-070 card ordering' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getProfitLoss(@Query() query: ProfitLossQueryDto) {
    return this.financialReports.getProfitLoss(query);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance sheet with Assets == Liabilities + Equity proof' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getBalanceSheet(@Query() query: BalanceSheetQueryDto) {
    return this.financialReports.getBalanceSheet(query);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Trial balance with debit == credit balancing proof' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getTrialBalance(@Query() query: DateRangeQueryDto) {
    return this.financialReports.getTrialBalance(query);
  }

  @Get('general-ledger')
  @ApiOperation({ summary: 'General ledger journal entries per COA' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getGeneralLedger(@Query() query: GeneralLedgerQueryDto) {
    return this.financialReports.getGeneralLedger(query);
  }

  @Get('cash-flow')
  @ApiOperation({ summary: 'Cash flow statement (operating, investing, financing)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS)
  getCashFlow(@Query() query: DateRangeQueryDto) {
    return this.financialReports.getCashFlow(query);
  }

  @Get('ar-aging')
  @ApiOperation({ summary: 'AR aging with H-3, H-7, >tempo buckets per BUS-RULE-059' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.COMMERCIAL)
  getArAging(@Query() query: ArAgingQueryDto) {
    return this.financialReports.getArAging(query);
  }

  @Get('ap-aging')
  @ApiOperation({ summary: 'AP aging for vendor invoices' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.SCM)
  getApAging(@Query() query: ApAgingQueryDto) {
    return this.financialReports.getApAging(query);
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

  @Get('stock-valuation')
  @ApiOperation({ summary: 'Stock valuation using FIFO or AVERAGE method' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  getStockValuation(@Query() query: StockValuationQueryDto) {
    return this.operationalReports.getStockValuation(query);
  }

  @Get('mutation-goods')
  @ApiOperation({ summary: 'Goods mutation with opening, in, out, adj, closing quantities' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.WAREHOUSE)
  getGoodsMutation(@Query() query: GoodsMutationQueryDto) {
    return this.operationalReports.getGoodsMutation(query);
  }

  @Get('sales-summary')
  @ApiOperation({ summary: 'Sales summary per customer, goods, owner, or month (BUS-RULE-069)' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR, UserRole.HEAD_OPS, UserRole.COMMERCIAL)
  getSalesSummary(@Query() query: SalesSummaryQueryDto) {
    return this.operationalReports.getSalesSummary(query);
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
