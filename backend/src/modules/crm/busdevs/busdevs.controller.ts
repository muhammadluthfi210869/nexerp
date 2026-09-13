import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../auth/roles.guard";
import { Roles } from "../../auth/roles.decorator";
import { PrismaService } from "../../../prisma/prisma/prisma.service";

@ApiTags("crm")
@ApiBearerAuth()
@Controller(["crm", "v1/crm"])
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusDevsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /crm/busdevs — for the filter dropdown on the OmniCRM overview.
   * Returns active BussdevStaff rows (existence proves the user is a BusDev
   * for assignment; the canonical assignment table for Omni CRM MVP).
   */
  @Get("busdevs")
  @Roles(
    UserRole.SUPER_ADMIN, UserRole.HEAD_OPS, UserRole.MARKETING,
    UserRole.COMMERCIAL, UserRole.DIRECTOR, UserRole.DIGIMAR,
  )
  async list(@Query("isActive") isActive?: string) {
    const where = isActive === "true" ? { isActive: true } : {};
    const rows = await this.prisma.bussdevStaff.findMany({
      where,
      orderBy: { name: "asc" },
      select: { id: true, name: true, userId: true, isActive: true, totalLeads: true },
    });
    return rows;
  }
}
