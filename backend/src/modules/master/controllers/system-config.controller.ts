import { Controller, Get, Patch, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SystemConfigService, OrganizationConfigDto, MasterKodeDto } from '../services/system-config.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('config')
  async getAllConfigs() {
    return this.configService.findAll();
  }

  @Get('config/:key')
  async getConfigByKey(@Param('key') key: string) {
    return this.configService.findByKey(key);
  }

  @Patch('config')
  async updateConfig(@Body() body: { key: string; value: string }, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.configService.update(body.key, body.value, userId);
  }

  @Get('config/organization')
  async getOrganizationConfig() {
    return this.configService.getOrganizationConfig();
  }

  @Patch('config/organization')
  async updateOrganizationConfig(@Body() dto: OrganizationConfigDto, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.configService.updateOrganizationConfig(dto, userId);
  }

  @Get('kodes')
  async getAllKodes() {
    return this.configService.findAllKodes();
  }

  @Get('kodes/:type')
  async getKodeByType(@Param('type') type: string) {
    return this.configService.findKodeByType(type);
  }

  @Post('kodes')
  async createOrUpdateKode(@Body() dto: MasterKodeDto, @Req() req?: any) {
    const userId = req?.user?.id;
    return this.configService.createOrUpdateKode(dto, userId);
  }
}
