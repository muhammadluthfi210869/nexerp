import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ClockOutDto } from './dto/clock-out.dto';
import { SubjectiveScoreDto } from './dto/subjective-score.dto';

@ApiTags('hr')
@ApiBearerAuth()
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

  @Get('contract-audit')
  @ApiOperation({ summary: 'Get contract expiry audit' })
  getContractAudit() {
    return this.hrService.getContractAudit();
  }

  // --- ATTENDANCE ---

  @Get('employees/:id/attendance')
  @ApiOperation({ summary: 'Get attendance stats for an employee' })
  getEmployeeAttendance(@Param('id') id: string, @Query('days') days: string) {
    return this.hrService.getEmployeeAttendance(id, parseInt(days) || 30);
  }

  @Post('attendance/clock-in')
  clockIn(@Body() body: { employeeId: string; lat: number; lng: number }) {
    return this.hrService.clockIn(body.employeeId, body.lat, body.lng);
  }

  @Post('attendance/clock-out')
  clockOut(@Body() dto: ClockOutDto) {
    return this.hrService.clockOut(dto.employeeId);
  }

  // --- KPI ---

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

  // --- PAYROLL ---

  @Post('payroll/generate')
  generatePayroll(@Body('period') period: string) {
    return this.hrService.generateDraftPayroll(period);
  }

  @Post('payroll/authorize/:id')
  authorizePayroll(
    @Param('id') id: string,
    @Body('authorizedById') authorizedById: string,
  ) {
    return this.hrService.authorizePayroll(id, authorizedById);
  }
}
