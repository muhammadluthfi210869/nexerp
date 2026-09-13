import {
  Controller, Get, Post, Param, Query, Body, UseGuards, Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { GuestbookApproval, UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { GuestbookService } from "./guestbook.service";
import { ApproveGuestbookDto } from "../dto/update-display-name.dto";

@ApiTags("crm")
@ApiBearerAuth()
@Controller(["crm", "v1/crm"])
@UseGuards(JwtAuthGuard, RolesGuard)
export class GuestbookController {
  constructor(private readonly guestbookService: GuestbookService) {}

  /** GET /crm/guestbook/events?status=PENDING&assignedToId=... */
  @Get("guestbook/events")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  list(
    @Query("status") status?: string,
    @Query("assignedToId") assignedToId?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const parsedStatus = status ? (GuestbookApproval[status.toUpperCase() as keyof typeof GuestbookApproval] ?? undefined) : undefined;
    return this.guestbookService.list({
      status: parsedStatus,
      assignedToId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get("guestbook/events/:id")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  getById(@Param("id") id: string) {
    return this.guestbookService.getById(id);
  }

  /** POST /crm/guestbook/events/:id/approve — flips PENDING → APPROVED. */
  @Post("guestbook/events/:id/approve")
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.COMMERCIAL)
  approve(@Param("id") id: string, @Body() dto: ApproveGuestbookDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    return this.guestbookService.decide(id, GuestbookApproval.APPROVED, actorId, dto.approverNote);
  }

  /** POST /crm/guestbook/events/:id/reject — flips PENDING → REJECTED. */
  @Post("guestbook/events/:id/reject")
  @Roles(UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING, UserRole.COMMERCIAL)
  reject(@Param("id") id: string, @Body() dto: ApproveGuestbookDto, @Req() req: Request) {
    const actorId = (req as any).user?.id;
    return this.guestbookService.decide(id, GuestbookApproval.REJECTED, actorId, dto.approverNote);
  }
}
