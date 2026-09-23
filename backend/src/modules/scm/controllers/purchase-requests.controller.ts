import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, User } from '@prisma/client';
import { PurchaseRequestsService } from '../services/purchase-requests.service';
import {
  CreatePurchaseRequestDto,
  UpdatePurchaseRequestStatusDto,
} from '../dto/purchase-request.dto';

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase/requests')
export class PurchaseRequestsController {
  constructor(private readonly prService: PurchaseRequestsService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.SCM,
    UserRole.WAREHOUSE,
    UserRole.PRODUCTION,
    UserRole.RND,
    UserRole.COMMERCIAL,
  )
  @ApiOperation({ summary: 'Create a new Purchase Request (PR)' })
  @ApiResponse({ status: 201, description: 'PR created successfully' })
  create(
    @Request() req: { user: User },
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.prService.create(req.user.id, dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.SCM,
    UserRole.DIRECTOR,
    UserRole.FINANCE,
    UserRole.WAREHOUSE,
    UserRole.PRODUCTION,
  )
  @ApiOperation({ summary: 'Get all Purchase Requests' })
  findAll(
    @Query('status') status?: any,
    @Query('search') search?: string,
  ) {
    return this.prService.findAll({ status, search });
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.SCM,
    UserRole.DIRECTOR,
    UserRole.FINANCE,
  )
  @ApiOperation({ summary: 'Get a single Purchase Request by ID' })
  findOne(@Param('id') id: string) {
    return this.prService.findOne(id);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Approve a Purchase Request' })
  approve(@Request() req: { user: User }, @Param('id') id: string) {
    return this.prService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.PURCHASING, UserRole.DIRECTOR)
  @ApiOperation({ summary: 'Reject a Purchase Request' })
  reject(
    @Request() req: { user: User },
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.prService.reject(id, req.user.id, reason);
  }
}

@ApiTags('purchase')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase/mrp')
export class MrpShortageController {
  constructor(private readonly prService: PurchaseRequestsService) {}

  @Post('shortage')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.PURCHASING,
    UserRole.SCM,
    UserRole.PRODUCTION,
    UserRole.WAREHOUSE,
  )
  @ApiOperation({ summary: 'Calculate MRP material shortages against inventory' })
  calculateShortage(
    @Body() body: {
      salesOrderId?: string;
      items?: Array<{ materialId: string; requiredQty: number }>;
    },
  ) {
    return this.prService.calculateMrpShortage(body);
  }
}
