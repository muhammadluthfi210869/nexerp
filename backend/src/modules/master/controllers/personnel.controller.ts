import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PersonnelService, CreateUserDto, UpdateUserDto, UserQueryOptions } from '../services/personnel.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

function extractActor(req: any) {
  const user = req?.user;
  return {
    id: user?.id,
    roles: Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []),
    organizationId: user?.organizationId || user?.tenantId,
    divisionId: user?.divisionId,
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Get('users')
  async findAllUsers(@Query() query: UserQueryOptions, @Req() req: any) {
    return this.personnelService.findAllUsers(extractActor(req), query);
  }

  @Get('users/:id')
  async findUserById(@Param('id') id: string, @Req() req: any) {
    return this.personnelService.findUserById(extractActor(req), id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto, @Req() req: any) {
    const actor = extractActor(req);
    return this.personnelService.createUser(actor, dto, actor.id);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: any
  ) {
    const actor = extractActor(req);
    return this.personnelService.updateUser(actor, id, dto, actor.id);
  }

  @Delete('users/:id')
  async deactivateUser(@Param('id') id: string, @Req() req: any) {
    const actor = extractActor(req);
    return this.personnelService.deactivateUser(actor, id, actor.id);
  }

  @Get('roles')
  async findAllRoles(@Req() req: any) {
    return this.personnelService.findAllRoles(extractActor(req));
  }
}
