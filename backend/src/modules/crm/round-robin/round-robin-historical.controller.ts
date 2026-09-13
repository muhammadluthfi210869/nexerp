// RoundRobinHistoricalController — exposes GET /crm/round-robin/historical.
// Returns a snapshot of the dreamlab-side round-robin distribution: busdev roster,
// per-busdev lead counts (all-time, last 30d, last 7d), round-robin counter state,
// and a balance verdict (CV-based).
//
// RBAC: SUPER_ADMIN, HEAD_OPS, MARKETING, DIGIMAR — same gate as kpi/summary.
// 503 if DREAMLAB_DATABASE_URL is not set on the backend (graceful degradation).

import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { RoundRobinHistoricalService, HistoricalSnapshot } from "./round-robin-historical.service";

@ApiTags("crm")
@ApiBearerAuth()
@Controller(["crm", "v1/crm"])
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoundRobinHistoricalController {
  constructor(private readonly service: RoundRobinHistoricalService) {}

  @Get("round-robin/historical")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.DIGIMAR,
  )
  async historical(): Promise<HistoricalSnapshot> {
    return this.service.snapshot();
  }
}
