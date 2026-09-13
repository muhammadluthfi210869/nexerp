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

  /** GET /crm/leads?stage=HOT&assignedToId=...&from=&to=&source= */
  @Get("leads")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  list(
    @Query("stage") stage?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("source") source?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Req() req?: Request,
  ) {
    const filter = {
      stage: this.parseStage(stage),
      assignedToId,
      from,
      to,
      source,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };
    const scoped = this.leadsService.applyRbacScope(filter, (req as any)?.user);
    return this.leadsService.list(scoped);
  }

  /**
   * GET /crm/leads/live — overview-friendly list with guestbook status join.
   * Supports bukuTamuStatus filter. RBAC-scoped (DIGIMAR auto-filtered).
   */
  @Get("leads/live")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  live(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("source") source?: string,
    @Query("stage") stage?: string,
    @Query("bukuTamuStatus") bukuTamuStatus?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
    @Req() req?: Request,
  ) {
    const filter = {
      stage: this.parseStage(stage),
      assignedToId,
      from,
      to,
      source,
      bukuTamuStatus: (bukuTamuStatus as "PENDING" | "APPROVED" | "REJECTED" | undefined),
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    };
    const scoped = this.leadsService.applyRbacScope(filter, (req as any)?.user);
    return this.leadsService.listWithGuestbook(scoped);
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

  /**
   * POST /crm/leads/:id/reply — mark that busdev sent first outbound reply
   * to this lead. Idempotent. Unblocks KPI Avg First Response + per-busdev
   * reply rate (BUG #2). Optional body for future channel tag; ignored.
   */
  @Post("leads/:id/reply")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.DIGIMAR,
  )
  reply(@Param("id") id: string, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    return this.leadsService.markFirstOutbound(id, actorId);
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
