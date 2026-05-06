import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { HrService } from './hr.service';

@ApiTags('hr')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  @ApiOperation({ summary: 'Get all employees' })
  getEmployees() {
    return this.hrService.getAllEmployees();
  }

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

  @Get('employees/:id/attendance')
  @ApiOperation({ summary: 'Get attendance stats for an employee' })
  getEmployeeAttendance(@Param('id') id: string, @Query('days') days: string) {
    return this.hrService.getEmployeeAttendance(id, parseInt(days) || 30);
  }

  @Post('attendance/clock-in')
  clockIn(@Body() body: { employeeId: string; lat: number; lng: number }) {
    return this.hrService.clockIn(body.employeeId, body.lat, body.lng);
  }

  @Get('kpi/employee/:id')
  getEmployeeKPI(@Param('id') id: string, @Query('period') period: string) {
    return this.hrService.calculateEmployeeKPI(id, period);
  }

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
