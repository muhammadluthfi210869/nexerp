import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { SubjectiveScoreDto } from './dto/subjective-score.dto';
import { TicketStatus, TicketType } from '@prisma/client';

@ApiTags('hr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.HR, UserRole.ADMIN, UserRole.DIRECTOR, UserRole.HEAD_OPS)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // --- EMPLOYEE CRUD ---

  @Post('employees')
  @ApiOperation({ summary: 'Create a new employee' })
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Get('employees')
  @ApiOperation({ summary: 'Get all active employees' })
  getEmployees() {
    return this.hrService.getAllEmployees();
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  getEmployee(@Param('id') id: string) {
    return this.hrService.getEmployeeById(id);
  }

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update an employee' })
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Soft-delete an employee' })
  deleteEmployee(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  // --- CONTRACT EXPIRING AUDIT (BUS-RULE-071) ---

  @Get('contracts/expiring')
  @ApiOperation({ summary: 'List contracts expiring within 30 days' })
  getExpiringContracts(@Query('days') days?: string) {
    return this.hrService.getExpiringContracts(days ? parseInt(days) : 30);
  }

  @Get('contract-audit')
  @ApiOperation({ summary: 'Get contract expiry audit' })
  getContractAudit() {
    return this.hrService.getContractAudit();
  }

  // --- DASHBOARD ---

  @Get('dashboard')
  @ApiOperation({ summary: 'Get HR dashboard metrics' })
  getDashboard() {
    return this.hrService.getHrDashboard();
  }

  @Get('executive-summary')
  @ApiOperation({ summary: 'Get executive summary cards' })
  getExecutiveSummary() {
    return this.hrService.getExecutiveSummary();
  }

  @Get('department-scores')
  @ApiOperation({ summary: 'Get average KPI scores per department' })
  getDepartmentScores() {
    return this.hrService.getDepartmentScores();
  }

  @Get('department/:division/employees')
  @ApiOperation({ summary: 'Get employees with KPI by division' })
  getDepartmentEmployees(@Param('division') division: string) {
    return this.hrService.getDepartmentEmployees(division);
  }

  // --- ATTENDANCE ---

  @Get('attendance')
  @ApiOperation({ summary: 'Get all attendance records for date' })
  getAttendanceRecords(
    @Query('date') date?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.hrService.getAttendanceRecords(date, employeeId);
  }

  @Get('employees/:id/attendance')
  @ApiOperation({ summary: 'Get attendance stats for an employee' })
  getEmployeeAttendance(@Param('id') id: string, @Query('days') days: string) {
    return this.hrService.getEmployeeAttendance(id, parseInt(days) || 30);
  }

  @Post('attendance/clock-in')
  @Roles(...Object.values(UserRole))
  clockIn(@Body() body: { employeeId: string; lat: number; lng: number }) {
    return this.hrService.clockIn(body.employeeId, body.lat, body.lng);
  }

  @Post('attendance/clock-out')
  @Roles(...Object.values(UserRole))
  clockOut(@Body() dto: ClockOutDto) {
    return this.hrService.clockOut(dto.employeeId);
  }

  // --- TICKETS (CUTI, IZIN, LEMBUR, REIMBURSE) (BUS-RULE-075) ---

  @Post('tickets')
  @Roles(...Object.values(UserRole))
  @ApiOperation({ summary: 'Create a request ticket (Leave, Overtime, Reimbursement)' })
  createTicket(
    @Body()
    dto: {
      employeeId: string;
      type: TicketType;
      reason: string;
      startDate: string;
      endDate?: string;
      amount?: string;
    },
  ) {
    return this.hrService.createTicket(dto);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Get all tickets' })
  getTickets(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: TicketStatus,
    @Query('type') type?: TicketType,
  ) {
    return this.hrService.getTickets({ employeeId, status, type });
  }

  @Patch('tickets/:id/approve')
  @ApiOperation({ summary: 'Approve a ticket' })
  approveTicket(
    @Param('id') id: string,
    @Body('authorizedById') authorizedById: string,
  ) {
    return this.hrService.approveTicket(id, authorizedById);
  }

  @Patch('tickets/:id/reject')
  @ApiOperation({ summary: 'Reject a ticket' })
  rejectTicket(
    @Param('id') id: string,
    @Body('authorizedById') authorizedById: string,
    @Body('reason') reason?: string,
  ) {
    return this.hrService.rejectTicket(id, authorizedById, reason);
  }

  // --- RECRUITMENT & CANDIDATES ATS (BUS-RULE-115) ---

  @Post('candidates')
  @ApiOperation({ summary: 'Create a recruitment candidate' })
  createCandidate(
    @Body()
    dto: {
      name: string;
      department: string;
      email: string;
      phone?: string;
      cvUrl?: string;
      cvReviewScore?: number;
      cvReviewNotes?: string;
    },
  ) {
    return this.hrService.createCandidate(dto);
  }

  @Get('candidates')
  @ApiOperation({ summary: 'Get all recruitment candidates' })
  getCandidates(
    @Query('stage') stage?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    return this.hrService.getCandidates({ stage, status, department });
  }

  @Get('candidates/:id')
  @ApiOperation({ summary: 'Get candidate by ID' })
  getCandidate(@Param('id') id: string) {
    return this.hrService.getCandidateById(id);
  }

  @Patch('candidates/:id/stage')
  @ApiOperation({ summary: 'Update candidate selection stage' })
  updateCandidateStage(
    @Param('id') id: string,
    @Body('stage') stage: string,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.hrService.updateCandidateStage(id, stage, rejectionReason);
  }

  // --- TRAINING MANAGEMENT (BUS-RULE-116) ---

  @Post('employees/:id/training')
  @ApiOperation({ summary: 'Record employee training session' })
  addEmployeeTraining(
    @Param('id') id: string,
    @Body()
    dto: {
      trainingType: string;
      hours: number;
      goal: string;
      trainingDate: string;
      certificateUrl?: string;
    },
  ) {
    return this.hrService.addEmployeeTraining(id, dto);
  }

  @Get('employees/:id/trainings')
  @ApiOperation({ summary: 'Get all trainings for an employee' })
  getEmployeeTrainings(@Param('id') id: string) {
    return this.hrService.getEmployeeTrainings(id);
  }

  // --- EMPLOYEE LOANS / KASBON (BUS-RULE-117) ---

  @Post('loans')
  @ApiOperation({ summary: 'Create an employee loan (kasbon)' })
  createEmployeeLoan(
    @Body()
    dto: {
      employeeId: string;
      totalAmount: number;
      monthlyDeduction: number;
      reason?: string;
    },
  ) {
    return this.hrService.createEmployeeLoan(dto);
  }

  @Get('loans')
  @ApiOperation({ summary: 'Get all employee loans with remaining balance' })
  getEmployeeLoans(@Query('employeeId') employeeId?: string) {
    return this.hrService.getEmployeeLoans(employeeId);
  }

  // --- KPI ---

  @Get('kpi/departments')
  @ApiOperation({ summary: 'Get all department KPIs with governance & employee aggregation' })
  getKpiDepartments() {
    return this.hrService.getKpiDepartments();
  }

  @Get('kpi/departments/:id')
  @ApiOperation({ summary: 'Get department KPI detail' })
  getKpiDepartmentById(@Param('id') id: string) {
    return this.hrService.getKpiDepartmentById(id);
  }

  @Get('kpi/department/:id')
  @ApiOperation({ summary: 'Get department KPI detail alias' })
  getKpiDepartmentByIdAlias(@Param('id') id: string) {
    return this.hrService.getKpiDepartmentById(id);
  }

  @Get('kpi/employees')
  @ApiOperation({ summary: 'Get all employee individual KPIs' })
  getKpiEmployees() {
    return this.hrService.getKpiEmployees();
  }

  @Get('kpi/individual/:id')
  @ApiOperation({ summary: 'Get individual employee KPI detail' })
  getKpiIndividualById(@Param('id') id: string) {
    return this.hrService.getKpiIndividualById(id);
  }

  @Get('kpi/employee/:id')
  getEmployeeKPI(@Param('id') id: string, @Query('period') period: string) {
    return this.hrService.calculateEmployeeKPI(id, period);
  }

  @Post('kpi/subjective')
  recordSubjectiveScore(@Body() dto: SubjectiveScoreDto) {
    return this.hrService.recordSubjectiveScore(
      dto.employeeId,
      dto.period,
      dto.score,
    );
  }

  // --- PAYROLL & SALARY SLIP (BUS-RULE-117) ---

  @Get('payrolls')
  @ApiOperation({ summary: 'Get all payroll records' })
  getAllPayrolls() {
    return this.hrService.getAllPayrolls();
  }

  @Post('payroll/generate')
  generatePayroll(@Body('period') period: string) {
    return this.hrService.generateDraftPayroll(period);
  }

  @Get('payroll/:id')
  getPayrollById(@Param('id') id: string) {
    return this.hrService.getPayrollById(id);
  }

  @Get('payroll/slip/:itemId')
  getSalarySlip(@Param('itemId') itemId: string) {
    return this.hrService.getSalarySlip(itemId);
  }

  @Post('payroll/authorize/:id')
  authorizePayroll(
    @Param('id') id: string,
    @Body('authorizedById') authorizedById: string,
  ) {
    return this.hrService.authorizePayroll(id, authorizedById);
  }
}
