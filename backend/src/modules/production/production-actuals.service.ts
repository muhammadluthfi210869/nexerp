/**
 * production-actuals.service.ts — Fase 3C (part 5).
 *
 * Recording what actually happened. The four slices before this one were cut on
 * mutability, on one record type, and on deciding when work happens; this one
 * holds the two methods that take a schedule that already exists and write down
 * its outcome — actual output, actual per-step consumption — plus the interlock
 * gates that refuse an impossible number before it is stored.
 *
 * Measured before the move, not assumed:
 *   lines 914-1371 — two methods, contiguous, nothing interleaved
 *   `this.X` inside the block: prisma (2), eventEmitter (5), logger (1),
 *     idGenerator (1)
 *   zero references to either name elsewhere in the facade
 *   both methods reach the database through `tx` inside their own
 *     `$transaction`, which is why `this.prisma` counts 2 while the models
 *     touched number nine
 *
 * It emits four domain events and writes one best-effort mirror. That mirror is
 * why this service keeps its own Logger instead of being pure prisma — a service
 * that cannot log its own failed mirror would have to stay fused to the facade.
 *
 * ProductionService keeps two thin delegators, so the controller routes and the
 * test modules that build a ProductionService did not have to change because a
 * file was split.
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { rel } from '../../common/helpers/prisma.helper';
import { logBestEffort } from '../../common/helpers/best-effort';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { IdGeneratorService } from '../system/id-generator.service';

@Injectable()
export class ProductionActualsService {
  private readonly logger = new Logger(ProductionActualsService.name);

  constructor(
    private prisma: PrismaService,
    private idGenerator: IdGeneratorService,
    private eventEmitter: EventEmitter2,
  ) {}

  async updateScheduleResult(
    scheduleId: string,
    resultQty: number,
    notes?: string,
    elapsedSeconds?: number,
    downtimeMinutes?: number,
  ) {
    const isUuid =
      typeof scheduleId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        scheduleId,
      );
    if (!isUuid) {
      throw new BadRequestException(`Invalid schedule ID: ${scheduleId}`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      const schedule = await tx.productionSchedule.findUnique({
        where: { id: scheduleId },
        include: {
          stepDetails: true,
          machine: true,
        },
      });

      if (!schedule) throw new NotFoundException('Schedule not found');

      // PHASE 3 & P13: Sequential Stage Order Enforcement (BUS-RULE-029)
      if (schedule.stage === 'FILLING') {
        const mixingSchedule = await tx.productionSchedule.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'MIXING',
          },
        });
        if (mixingSchedule && mixingSchedule.status !== 'COMPLETED') {
          throw new BadRequestException({
            code: 'STAGE_ORDER_VIOLATION',
            message: `Tidak bisa menyelesaikan Filling sebelum Mixing selesai. Progresi harus sequential (BUS-RULE-029).`,
          });
        }
      } else if (schedule.stage === 'PACKAGING' || schedule.stage === 'PACKING') {
        const fillingSchedule = await tx.productionSchedule.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'FILLING',
          },
        });
        if (fillingSchedule && fillingSchedule.status !== 'COMPLETED') {
          throw new BadRequestException({
            code: 'STAGE_ORDER_VIOLATION',
            message: `Tidak bisa menyelesaikan Packaging sebelum Filling selesai. Progresi harus sequential (BUS-RULE-029).`,
          });
        }
      }

      // Synchronize accurate duration from terminal to calculate precise overhead cost
      const actualDurationMinutes = elapsedSeconds
        ? Math.ceil(elapsedSeconds / 60)
        : 0;

      const machineRate = schedule.machine?.costPerHour || 50000;
      const laborRate = 25000; // Standard operator rate

      // PHASE 3: QC Interlock (Filling Stage) - BUS-RULE-032
      // Prevent FILLING if Mixing QC has not passed.
      if (schedule.stage === 'FILLING') {
        const mixingLog = await tx.productionLog.findFirst({
          where: {
            workOrderId: schedule.workOrderId,
            stage: 'MIXING',
          },
          orderBy: { loggedAt: 'desc' },
        });

        const bulkQcPass = mixingLog
          ? await tx.qCAudit.findFirst({
              where: { stepLogId: mixingLog.id, status: 'GOOD' as any },
            })
          : null;
        const isBulkPassed = !!bulkQcPass;

        if (!isBulkPassed) {
          this.eventEmitter.emit('production.qc_interlock_triggered', {
            scheduleId,
            workOrderId: schedule.workOrderId,
            stage: schedule.stage,
            reason: 'MIXING QC not passed',
          });
          this.eventEmitter.emit('activity.logged', {
            senderDivision: 'PRODUCTION',
            notes: `QC Interlock: FILLING blocked for schedule ${scheduleId} — MIXING QC not passed`,
            loggedBy: 'SYSTEM:PRODUCTION',
          });
          throw new BadRequestException({
            code: 'QC_BULK_NOT_PASSED',
            message: `[AKSES DITOLAK: CURAH BELUM LULUS UJI LAB] Curah (Mixing) belum lulus uji lab atau status belum PASS. Dilarang melakukan pengisian! (BUS-RULE-032)`,
          });
        }
      }

      // PHASE 3b: Physical Law Validation (All Stages) - BUS-RULE-033
      // Prevent Good Output (pcs) from exceeding the logic limit of Actual Bulk (kg) consumed.
      if (schedule.stage === 'FILLING' || schedule.stage === 'MIXING') {
        const bulkComponent = schedule.stepDetails.find(
          (d: any) => d.category === 'BULK',
        );
        if (bulkComponent && bulkComponent.qtyTheoretical) {
          const actualBulk = Number(
            bulkComponent.qtyActual ?? bulkComponent.qtyTheoretical,
          );
          const theoreticalBulk = Number(bulkComponent.qtyTheoretical);
          const targetPcs = Number(schedule.targetQty);

          // Max possible output based on actual bulk consumed
          const maxPhysicalLimit = (actualBulk / theoreticalBulk) * targetPcs;

          // Tolerance of 1% for scaling/rounding in machine filling
          if (resultQty > maxPhysicalLimit * 1.01) {
            throw new BadRequestException({
              code: 'OUTPUT_EXCEEDS_PHYSICAL_LIMIT',
              message: `Hukum Fisika: Output (${resultQty} pcs) melebihi batas maksimal dari cairan curah yang dikonsumsi (${maxPhysicalLimit.toFixed(0)} pcs). Indikasi under-fill atau manipulasi volume (BUS-RULE-033).`,
              limit: maxPhysicalLimit.toFixed(0),
            });
          }
        }
      }

      // PHASE 3: Artwork Interlock (Packing Stage) - BUS-RULE-034
      // Ensure that final packaging is blocked if Artwork has not been approved by Legal.
      if (schedule.stage === 'PACKING' || schedule.stage === 'PACKAGING') {
        const wo = await tx.workOrder.findUnique({
          where: { id: schedule.workOrderId },
          include: {
            lead: {
              include: {
                registrations: { include: { artworkReviews: true } },
                designTasks: true,
              },
            },
          },
        });

        const hasApprovedArtwork =
          wo?.lead?.registrations?.some((p: any) =>
            p.artworkReviews?.some((a: any) => a.isApproved),
          ) ||
          wo?.lead?.designTasks?.some(
            (t: any) =>
              t.isFinal ||
              t.kanbanState === 'LOCKED' ||
              t.status === 'APPROVED',
          );

        if (!hasApprovedArtwork) {
          throw new BadRequestException({
            code: 'ARTWORK_NOT_APPROVED',
            message: `Artwork belum APPROVED. Packaging terkunci demi mencegah recall produk masif (BUS-RULE-034).`,
          });
        }
      }

      const updatedSchedule = await tx.productionSchedule.update({
        where: { id: scheduleId },
        data: {
          resultQty,
          status: 'COMPLETED',
          notes: notes || `COMPLETED: Yield ${resultQty} pcs`,
        },
        include: {
          stepDetails: true,
          machine: true,
        },
      });

      // BUS-RULE-035 & BUS-RULE-037: Packaging creates Quarantined Finished Goods & Traceability Data
      let qrCodeData: any = null;
      if (schedule.stage === 'PACKING' || schedule.stage === 'PACKAGING') {
        qrCodeData = {
          batchRecordNumber: schedule.scheduleNumber,
          workOrderId: schedule.workOrderId,
          goodFGOutput: resultQty,
          status: 'QUARANTINE',
          availableQty: 0,
          operator: schedule.machine?.name || 'OPERATOR_PACKAGING',
          finishedAt: new Date().toISOString(),
          traceability: {
            stage: 'PACKAGING',
            components: schedule.stepDetails.map((d: any) => ({
              materialId: d.materialId,
              materialCode: d.materialCode,
              qtyActual: d.qtyActual,
            })),
          },
        };

        const existingFg = await tx.finishedGood.findFirst({
          where: { woId: schedule.workOrderId },
        });
        if (existingFg) {
          await tx.finishedGood.update({
            where: { id: existingFg.id },
            data: { stockQty: resultQty },
          });
        } else {
          try {
            await tx.finishedGood.create({
              data: {
                woId: schedule.workOrderId,
                stockQty: resultQty,
              },
            });
          } catch (err) {
            // Best-effort mirror: the schedule result is the authoritative row
            // and is already written, so a failed finished-good row must not
            // roll it back. It must not vanish either.
            logBestEffort(this.logger, 'production:finished-good-mirror', err);
          }
        }
      }

      const laborCost = (actualDurationMinutes / 60) * Number(laborRate);
      const overheadCost = (actualDurationMinutes / 60) * Number(machineRate);

      const scheduleInput = schedule.targetQty;
      const scheduleGood = 0; // Wait for QC
      const scheduleReject = Math.max(0, schedule.targetQty - resultQty);
      const scheduleQuarantine = resultQty;
      const scheduleShrinkage = Math.max(
        0,
        scheduleInput - scheduleGood - scheduleReject - scheduleQuarantine,
      );

      await tx.productionLog.create({
        data: {
          logNumber: await this.idGenerator.generateStageId(schedule.stage),
          workOrder: rel(schedule.workOrderId),
          stage: schedule.stage,
          inputQty: scheduleInput,
          goodQty: scheduleGood,
          quarantineQty: scheduleQuarantine,
          rejectQty: scheduleReject,
          shrinkageQty: scheduleShrinkage,
          startTime: schedule.startTime,
          loggedAt: new Date(),
          machine: rel(schedule.machineId),
          downtimeMinutes: downtimeMinutes || 0,
          notes: `TERMINAL_SYNC: Duration ${actualDurationMinutes}m. ${notes || ''}`,
          laborCost,
          overheadCost,
          actualLaborRate: laborRate,
          actualMachineRate: machineRate,
        },
      });

      // World-Class Communication Protocol: Auto-trigger stock deduction in Warehouse
      console.log(
        `[EVENT_BUS] Emitting production.schedule_completed for ${scheduleId} with precise duration: ${actualDurationMinutes}m`,
      );
      this.eventEmitter.emit('production.schedule_completed', {
        scheduleId,
        workOrderId: schedule.workOrderId,
        materialsConsumed: schedule.stepDetails.map((d: any) => ({
          materialId: d.materialId,
          qty: Number(d.qtyActual || d.qtyTheoretical),
        })),
        qrCodeData,
      });

      return {
        scheduleId: updatedSchedule.id,
        scheduleNumber: updatedSchedule.scheduleNumber,
        workOrderId: updatedSchedule.workOrderId,
        stage: updatedSchedule.stage,
        resultQty: updatedSchedule.resultQty,
        status: updatedSchedule.status,
        machine: updatedSchedule.machine,
        stepDetails: updatedSchedule.stepDetails,
        qrCodeData,
        costing: {
          laborCost: Number(laborCost),
          overheadCost: Number(overheadCost),
          totalCost: Number(laborCost) + Number(overheadCost),
          actualDurationMinutes,
        },
      };
    });
  }

  async submitStepActuals(
    scheduleId: string,
    actuals: { detailId: string; qtyActual: number; inventoryId?: string }[],
    supervisorPin?: string,
    supervisorId?: string,
  ) {
    return this.prisma.$transaction(async (tx: any) => {
      const schedule = await tx.productionSchedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) throw new BadRequestException('Schedule not found');

      // PHASE 3: Atomic Phase Enforcement
      // Order of items in actuals or insertion order
      const allDetails = await tx.productionStepDetail.findMany({
        where: { scheduleId },
      });

      for (const item of actuals) {
        const detail = await tx.productionStepDetail.findUnique({
          where: { id: item.detailId },
          include: { material: true },
        });

        if (!detail) continue;

        // Atomic check: Are there any previous items not yet filled?
        const currentIndex = allDetails.findIndex(
          (d: any) => d.id === detail.id,
        );
        const previousUnfilled = allDetails
          .slice(0, currentIndex)
          .filter((d: any) => !d.qtyActual);

        if (previousUnfilled.length > 0) {
          throw new BadRequestException({
            code: 'ATOMIC_SEQUENCE_VIOLATION',
            message: `Pelanggaran Protokol Atomic: Anda mencoba scan ${detail.material.name}, padahal komponen sebelumnya (${previousUnfilled[0].materialCode}) belum diselesaikan. Proses harus berurutan!`,
          });
        }

        // FEFO & Material Validation Gate (Phase 2)
        if (item.inventoryId) {
          const inventory = await tx.materialInventory.findUnique({
            where: { id: item.inventoryId },
          });

          if (!inventory) {
            throw new BadRequestException(
              'Invalid material barcode/batch scanned.',
            );
          }

          // 1. FEFO Validation against older available unexpired stock (BUS-RULE-031)
          if (inventory.expDate) {
            const olderBatch = await tx.materialInventory.findFirst({
              where: {
                materialId: inventory.materialId,
                expDate: { not: null, lt: inventory.expDate },
                currentStock: { gt: 0 },
                qcStatus: 'GOOD',
                id: { not: item.inventoryId },
              },
              orderBy: { expDate: 'asc' },
            });
            if (olderBatch) {
              const expStr = olderBatch.expDate
                ? olderBatch.expDate.toISOString().split('T')[0]
                : 'N/A';
              throw new BadRequestException({
                code: 'FEFO_VIOLATION',
                message: `FEFO Violation: Batch ${olderBatch.batchNumber} (exp: ${expStr}) masih tersedia dan lebih tua dari batch yang dipilih ${inventory.batchNumber}. Gunakan batch tertua terlebih dahulu (BUS-RULE-031).`,
              });
            }
          }

          // 1b. FEFO Validation against SCM Allocation
          const fulfillment = await tx.requisitionFulfillment.findFirst({
            where: {
              requisition: {
                workOrderId: schedule.workOrderId,
                materialId: detail.materialId,
              },
              inventoryId: item.inventoryId,
            },
          });

          if (!fulfillment && detail.category !== 'BULK') {
            const anyFulfillment = await tx.requisitionFulfillment.findFirst({
              where: {
                requisition: {
                  workOrderId: schedule.workOrderId,
                  materialId: detail.materialId,
                },
              },
            });
            if (anyFulfillment) {
              throw new BadRequestException({
                code: 'FEFO_MISMATCH',
                message: `The scanned batch (${inventory.batchNumber}) for ${detail.material.name} does not match the Warehouse SCM FEFO allocation. Please use the exact material batch issued.`,
              });
            }
          }

          // 2. QC Status Validation
          if (inventory.qcStatus !== 'GOOD') {
            this.eventEmitter.emit('production.qc_gate_blocked', {
              scheduleId,
              materialId: detail.materialId,
              inventoryId: item.inventoryId,
              qcStatus: inventory.qcStatus,
              batchNumber: inventory.batchNumber,
            });
            this.eventEmitter.emit('activity.logged', {
              senderDivision: 'PRODUCTION',
              notes: `QC Gate: Material ${detail.material.name} (${inventory.batchNumber}) blocked — status ${inventory.qcStatus}`,
              loggedBy: 'SYSTEM:PRODUCTION',
            });
            throw new BadRequestException({
              code: 'QC_FAILED',
              message: `The material ${detail.material.name} (Batch: ${inventory.batchNumber}) is in ${inventory.qcStatus} status and cannot be used in production.`,
            });
          }
        }

        const theoretical = Number(detail.qtyTheoretical);
        const actual = Number(item.qtyActual);
        const deviation = Math.abs(actual - theoretical) / theoretical;

        // Constraint 2a: Hard-Stop 10% — Fraud Prevention (even supervisor PIN cannot bypass)
        if (deviation > 0.1) {
          throw new BadRequestException({
            code: 'DEVIATION_EXCESSIVE',
            message: `Deviasi ${(deviation * 100).toFixed(2)}% untuk ${detail.material.name} melebihi batas maksimal 10%. Transaksi ditolak. Hubungi PPIC untuk koreksi BOM/formula.`,
            deviation: (deviation * 100).toFixed(2),
            limit: '10%',
          });
        }

        // Constraint 2b: Weight Tolerance Hard-Stop (0.5%)
        if (deviation > 0.005) {
          if (!supervisorPin || !supervisorId) {
            throw new BadRequestException({
              code: 'TOLERANCE_EXCEEDED',
              message: `Deviation for ${detail.material.name} is ${(deviation * 100).toFixed(2)}%. Supervisor PIN required.`,
              deviation: (deviation * 100).toFixed(2),
            });
          }

          // Verify Supervisor PIN
          const supervisor = await tx.user.findUnique({
            where: { id: supervisorId },
            select: { managerPin: true },
          });

          if (!supervisor || supervisor.managerPin !== supervisorPin) {
            throw new BadRequestException('Invalid Supervisor PIN.');
          }

          console.log(
            `[SECURITY_GATE] Weight deviation approved by ${supervisorId}`,
          );
        }

        await tx.productionStepDetail.update({
          where: { id: item.detailId },
          data: { qtyActual: item.qtyActual },
        });
      }

      return tx.productionSchedule.findUnique({
        where: { id: scheduleId },
        include: { stepDetails: { include: { material: true } } },
      });
    });
  }
}
