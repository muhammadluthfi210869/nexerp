import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { LandingTrackerService } from './landing-tracker.service';
import {
  CreateVisitDto,
  CreateConversionDto,
  GetVisitsQueryDto,
  GetConversionsQueryDto,
  GetStatsQueryDto,
} from './dto/landing-tracker.dto';

@Controller('marketing/landing-tracker')
export class LandingTrackerController {
  constructor(private readonly landingTrackerService: LandingTrackerService) {}

  // ========== BACKWARD COMPATIBILITY FOR CRM WIDGET (google-apps-script.gs emulation) ==========
  @Get()
  async handleWidgetGet(@Query('action') action?: string) {
    const act = (action || '').toLowerCase();

    if (act === 'pick') {
      const assigned = await this.landingTrackerService.pickNextSales();
      return {
        ok: true,
        assignedTo: assigned.name,
        assignedPhone: assigned.phone,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      ok: true,
      message:
        'Dreamlab CRM API Emulated by NexERP. Use ?action=pick or POST a lead.',
    };
  }

  @Post()
  async handleWidgetPost(@Body() body: any) {
    if (body.action === 'lead' && body.lead) {
      const lead = body.lead;
      await this.landingTrackerService.createConversion({
        pageUrl: lead.sourceUrl || lead.source || '/',
        pageTitle: lead.source || 'Dreamlab Widget',
        source: lead.source || 'Dreamlab',
        nama: lead.nama,
        perusahaan: lead.perusahaan,
        hp: lead.hp,
        produk: lead.produk,
        trafficSource: lead.traffic,
        utmSource: lead.utmSource,
        utmMedium: lead.utmMedium,
        utmCampaign: lead.utmCampaign,
        assignedTo: lead.assignedTo,
        assignedPhone: lead.assignedPhone,
        status: lead.status || 'New',
      });
      return { ok: true, message: 'Lead saved' };
    }

    // Fallback: If it's a standard CreateVisitDto, handle it as a visit
    if (body.pageUrl && !body.action) {
      return await this.landingTrackerService.createVisit(body);
    }

    return { ok: false, error: 'Unknown action' };
  }

  // ========== REST ENDPOINTS FOR SALES ROTATION AND CONFIG ==========
  @Get('sales')
  async getSales(): Promise<any[]> {
    return await this.landingTrackerService.getSales();
  }

  @Post('sales')
  async saveSales(@Body() sales: any[]) {
    return {
      success: await this.landingTrackerService.saveSales(sales),
    };
  }

  @Post('sales/reset-counter')
  async resetRotationCounter() {
    return {
      success: await this.landingTrackerService.resetRotationCounter(),
    };
  }

  // ========== ORIGINAL VISITS & CONVERSIONS LOGGING ==========
  @Post('track')
  async createVisit(@Body() data: CreateVisitDto) {
    return await this.landingTrackerService.createVisit(data);
  }

  @Post('conversion')
  async createConversion(@Body() data: CreateConversionDto) {
    return await this.landingTrackerService.createConversion(data);
  }

  @Get('visits')
  async getVisits(@Query() query: GetVisitsQueryDto) {
    return await this.landingTrackerService.getVisits(query);
  }

  @Get('conversions')
  async getConversions(@Query() query: GetConversionsQueryDto) {
    return await this.landingTrackerService.getConversions(query);
  }

  @Get('stats')
  async getStats(@Query() query: GetStatsQueryDto) {
    return await this.landingTrackerService.getStats(
      query.startDate,
      query.endDate,
    );
  }

  @Get('recent')
  async getRecentVisits(@Query('limit') limit?: number) {
    return await this.landingTrackerService.getRecentVisits(limit || 20);
  }

  // ========== ADMIN ACTION PERSISTENCE ==========
  @Put('conversions/:id/status')
  async updateConversionStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return await this.landingTrackerService.updateConversionStatus(id, status);
  }

  @Delete('conversions/:id')
  async deleteConversion(@Param('id') id: string) {
    return await this.landingTrackerService.deleteConversion(id);
  }

  @Delete('conversions')
  async clearAllConversions() {
    return await this.landingTrackerService.clearAllConversions();
  }
}
