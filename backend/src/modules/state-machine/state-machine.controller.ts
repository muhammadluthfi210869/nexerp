// Wave 1/A1 — State Machine REST surface.
//
// Two read-only endpoints:
//   GET /state-machine/entities           -> list registered entity types
//   GET /state-machine/diagram/:entityType -> trigger map for one entity
//
// Writes happen via StateMachineService.transition() called from
// domain services (DP, AP, AR, ...). No POST endpoints on this controller
// — the orchestrator is invoked programmatically, not over HTTP.

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { StateMachineService } from './state-machine.service';

@Controller('state-machine')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StateMachineController {
  constructor(private readonly service: StateMachineService) {}

  @Get('entities')
  listEntities() {
    return this.service.listEntityTypes();
  }

  @Get('diagram/:entityType')
  getDiagram(@Param('entityType') entityType: string) {
    const triggers = this.service.getAllowedTriggers(entityType);
    return { entityType, triggers };
  }
}