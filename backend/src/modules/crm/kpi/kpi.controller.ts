import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { KpiService } from "./kpi.service";

@ApiTags("crm")
@ApiBearerAuth()
@Controller(["crm", "v1/crm"])
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  /** GET /crm/kpi/summary — 7 KPI tiles. */
  @Get("kpi/summary")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR,
  )
  summary() {
    return this.kpiService.summary();
  }
}
