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

@Controller()
@UseGuards(JwtAuthGuard)
export class PersonnelController {
  constructor(private readonly personnelService: PersonnelService) {}

  @Get('users')
  async findAllUsers(@Query() query: UserQueryOptions) {
    return this.personnelService.findAllUsers(query);
  }

  @Get('users/:id')
  async findUserById(@Param('id') id: string) {
    return this.personnelService.findUserById(id);
  }

  @Post('users')
  async createUser(@Body() dto: CreateUserDto, @Req() req?: any) {
    const creatorId = req?.user?.id;
    return this.personnelService.createUser(dto, creatorId);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req?: any
  ) {
    const updaterId = req?.user?.id;
    return this.personnelService.updateUser(id, dto, updaterId);
  }

  @Delete('users/:id')
  async deactivateUser(@Param('id') id: string, @Req() req?: any) {
    const deleterId = req?.user?.id;
    return this.personnelService.deactivateUser(id, deleterId);
  }

  @Get('roles')
  async findAllRoles() {
    return this.personnelService.findAllRoles();
  }
}
