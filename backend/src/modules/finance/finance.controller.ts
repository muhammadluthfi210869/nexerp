import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateJournalDto } from './dto/create-journal.dto';
import {
  CreateFundRequestDto,
  ApproveFundRequestDto,
  DisburseFundRequestDto,
  DirectorApproveFundRequestDto,
  RejectFundRequestDto,
} from './dto/fund-request.dto';
import { Req } from '@nestjs/common';
import { VerifyArPaymentDto } from './dto/verify-ar-payment.dto';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get finance dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Return metrics for dashboard.' })
  async getDashboard() {
    return this.financeService.getDashboardMetrics();
  }

  @Get('journal')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getJournalAlias() {
    return this.financeService.getJournalEntries();
  }

  @Post('verify-payment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async verifyPaymentFromSales(
    @Body() dto: { type: string; id: string; verifiedBy: string },
  ) {
    return this.financeService.verifyOrderPayment(dto);
  }

  @Post('bills')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async createBill(
    @Body()
    dto: {
      vendorId: string;
      billRef: string;
      issueDate: string;
      dueDate: string;
      amount: number;
    },
  ) {
    return this.financeService.createBill(dto);
  }

  @Get('fund-requests')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getAllFundRequests() {
    return this.financeService.getAllFundRequests();
  }

  @Get('reports/project-budgeting')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getProjectBudgeting() {
    return this.financeService.getProjectBudgetingReport();
  }

  @Get('accounts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getAccounts() {
    return this.financeService.getAccounts();
  }

  @Post('accounts/seed')
  @Roles(UserRole.SUPER_ADMIN)
  async seedAccounts() {
    return this.financeService.seedInitialAccounts();
  }

  @Get('journals')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get all journal entries' })
  async getLedger() {
    return this.financeService.getJournalEntries();
  }

  @Get('ledger')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getLedgerAlias() {
    return this.financeService.getJournalEntries();
  }

  @Get('ledger/recent')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getRecentLedger() {
    return this.financeService.getRecentJournals(5);
  }

  @Post('journals')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Create a new manual journal entry' })
  async createEntry(@Body() dto: CreateJournalDto) {
    return this.financeService.createJournalEntry(dto);
  }

  @Post('journals/:id/reverse')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async reverseEntry(@Param('id') id: string) {
    return this.financeService.reverseJournalEntry(id);
  }

  @Get('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getInvoices() {
    return this.financeService.getInvoices();
  }

  @Get('bills')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getBills() {
    return this.financeService.getInvoices('PAYABLE');
  }

  // --- SHOWCASE: FINALE ---

  @Get('dashboard/advanced')
  async getAdvancedStats() {
    return this.financeService.getAdvancedDashboardStats();
  }

  @Get('deliveries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getDeliveries() {
    return this.financeService.getDeliveries();
  }

  @Post('invoice/generate/:deliveryOrderId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async generateInvoice(@Param('deliveryOrderId') deliveryOrderId: string) {
    return this.financeService.generateFinalInvoice(deliveryOrderId);
  }

  @Get('invoices/final')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getFinalInvoices() {
    return this.financeService.getAllFinalInvoices();
  }

  @Get('invoices/final/active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getActiveInvoices() {
    return this.financeService.getActiveInvoices(5);
  }

  @Post('invoice/validate/:invoiceId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async validateInvoice(@Param('invoiceId') invoiceId: string) {
    return this.financeService.validatePayment(invoiceId);
  }

  @Get('sales-orders')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getSalesOrders() {
    return this.financeService.getSalesOrders();
  }

  @Patch('validate-payment/:activityId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async validateBussdevPayment(
    @Param('activityId') activityId: string,
    @Body() dto: { validatedBy: string },
  ) {
    return this.financeService.validateBussdevPayment(
      activityId,
      dto.validatedBy,
    );
  }

  // --- FUND REQUESTS ---

  @Post('fund-request')
  async createFundRequest(
    @Req() req: { user: { userId: string } },
    @Body() dto: CreateFundRequestDto,
  ) {
    return this.financeService.createFundRequest(req.user.userId, dto);
  }

  @Get('fund-requests/me')
  async getMyFundRequests(@Req() req: { user: { userId: string } }) {
    return this.financeService.getMyFundRequests(req.user.userId);
  }

  @Patch('fund-request/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE) // Finance or Admin can approve
  async approveFundRequest(
    @Param('id') id: string,
    @Body() dto: ApproveFundRequestDto,
  ) {
    return this.financeService.approveFundRequest(id, dto);
  }

  @Post('fund-request/:id/disburse')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async disburseFundRequest(
    @Param('id') id: string,
    @Body() dto: DisburseFundRequestDto,
  ) {
    return this.financeService.disburseFundRequest(id, dto);
  }

  @Post('fund-request/:id/director-approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  async directorApproveFundRequest(
    @Param('id') id: string,
    @Body() dto: DirectorApproveFundRequestDto,
  ) {
    return this.financeService.directorApproveFundRequest(id, dto);
  }

  @Patch('fund-request/:id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE, UserRole.DIRECTOR)
  async rejectFundRequest(
    @Param('id') id: string,
    @Body() dto: RejectFundRequestDto,
  ) {
    return this.financeService.rejectFundRequest(id, dto);
  }

  // --- AR VALIDATION HUB ---

  @Get('ar-hub/pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getArHubPending() {
    return this.financeService.getArHubPending();
  }

  @Post('ar-hub/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async verifyArHubPayment(@Body() dto: VerifyArPaymentDto, @Req() req: any) {
    return this.financeService.verifyArHubPayment(dto, req.user.userId);
  }

  @Get('reports/trial-balance')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getTrialBalance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getTrialBalance(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('reports/trial-balance/detailed')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getDetailedTrialBalance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getDetailedTrialBalance(
      new Date(
        startDate ||
          new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      ),
      new Date(endDate || new Date()),
    );
  }

  @Get('reports/balance-sheet')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getBalanceSheet(@Query('date') date?: string) {
    return this.financeService.getBalanceSheet(
      date ? new Date(date) : new Date(),
    );
  }

  @Get('reports/profit-loss')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getProfitLoss(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getProfitLoss(
      new Date(startDate || new Date(new Date().getFullYear(), 0, 1)),
      new Date(endDate || new Date()),
    );
  }

  @Get('reports/cash-flow')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getCashFlow(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getCashFlow(
      new Date(startDate || new Date(new Date().getFullYear(), 0, 1)),
      new Date(endDate || new Date()),
    );
  }

  @Get('reports/general-ledger/:accountId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE)
  async getGeneralLedger(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getGeneralLedger(
      accountId,
      new Date(startDate || new Date(new Date().getFullYear(), 0, 1)),
      new Date(endDate || new Date()),
    );
  }

  @Get('taxes')
  async getTaxes() {
    return this.financeService.getTaxes();
  }

  @Get('currencies')
  async getCurrencies() {
    return this.financeService.getCurrencies();
  }
}
