import { Controller, Get, Patch, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SystemConfigService, OrganizationConfigDto, MasterKodeDto } from '../services/system-config.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { IsString, MaxLength } from 'class-validator';
import { PolicyActor } from '../../../platform/policy/policy.service';

class SystemConfigKeyValueDto {
  @IsString()
  @MaxLength(200)
  key!: string;

  @IsString()
  @MaxLength(2000)
  value!: string;
}

function extractActor(req: any): PolicyActor | undefined {
  const user = req?.user;
  if (!user) return undefined;
  return {
    id: user.id,
    roles: Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []),
    organizationId: user?.organizationId || user?.tenantId,
    divisionId: user?.divisionId,
  };
}

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('config')
  async getAllConfigs(@Req() req: any) {
    return this.configService.findAll(extractActor(req));
  }

  @Get('config/:key')
  async getConfigByKey(@Param('key') key: string, @Req() req: any) {
    return this.configService.findByKey(key, extractActor(req));
  }

  @Patch('config')
  async updateConfig(@Body() body: SystemConfigKeyValueDto, @Req() req: any) {
    return this.configService.update(extractActor(req), body.key, body.value);
  }

  @Get('config/organization')
  async getOrganizationConfig() {
    return this.configService.getOrganizationConfig();
  }

  @Patch('config/organization')
  async updateOrganizationConfig(@Body() dto: OrganizationConfigDto, @Req() req: any) {
    return this.configService.updateOrganizationConfig(extractActor(req), dto);
  }

  @Get('kodes')
  async getAllKodes(@Req() req: any) {
    return this.configService.findAllKodes(extractActor(req));
  }

  @Get('kodes/:type')
  async getKodeByType(@Param('type') type: string, @Req() req: any) {
    return this.configService.findKodeByType(type, extractActor(req));
  }

  @Post('kodes')
  async createOrUpdateKode(@Body() dto: MasterKodeDto, @Req() req: any) {
    return this.configService.createOrUpdateKode(extractActor(req), dto);
  }
}
