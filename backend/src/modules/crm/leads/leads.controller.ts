import {
  Controller, Get, Patch, Post, Param, Query, Body, UseGuards, Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CrmStage, UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { LeadsService } from "./leads.service";
import { UpdateStageDto } from "../dto/update-stage.dto";
import { UpdateDisplayNameDto } from "../dto/update-display-name.dto";

@ApiTags("crm")
@ApiBearerAuth()
@Controller(["crm", "v1/crm"])
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  /** GET /crm/leads?stage=HOT&assignedToId=... */
  @Get("leads")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  list(
    @Query("stage") stage?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.leadsService.list({
      stage: this.parseStage(stage),
      assignedToId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get("leads/:id")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  getById(@Param("id") id: string) {
    return this.leadsService.getById(id);
  }

  @Patch("leads/:id/stage")
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING)
  updateStage(@Param("id") id: string, @Body() dto: UpdateStageDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    return this.leadsService.updateStage(id, dto.stage, actorId);
  }

  @Patch("leads/:id/displayName")
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING)
  updateDisplayName(@Param("id") id: string, @Body() dto: UpdateDisplayNameDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    return this.leadsService.updateDisplayName(id, dto.displayName, actorId);
  }

  @Post("leads/:id/assign")
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING)
  assign(@Param("id") id: string, @Body() body: { assignedToId: string }, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    return this.leadsService.assign(id, body.assignedToId, actorId);
  }

  @Get("leads/:id/messages")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  getMessages(@Param("id") id: string) {
    return this.leadsService.getMessages(id);
  }

  private parseStage(value: string | undefined): CrmStage | undefined {
    if (!value) return undefined;
    const upper = value.toUpperCase() as CrmStage;
    return CrmStage[upper] ? upper : undefined;
  }
}
