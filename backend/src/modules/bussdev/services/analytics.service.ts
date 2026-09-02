import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CacheService } from '../../../shared/cache.service';
import { WorkflowStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  private calcPct(numerator: number, denominator: number): string {
    if (denominator === 0) return '0%';
    return `${((numerator / denominator) * 100).toFixed(1)}%`;
  }

  private async calculateConversion(from: WorkflowStatus, to: WorkflowStatus) {
    const total = await this.prisma.salesLead.count({
      where: { status: from },
    });
    const converted = await this.prisma.salesLead.count({
      where: { status: to },
    });
    return total > 0
      ? ((converted / (total + converted)) * 100).toFixed(1)
      : '0';
  }

  async getPageAnalytics(
    group:
      | 'dashboard'
      | 'guest'
      | 'sample'
      | 'production'
      | 'ro'
      | 'lost'
      | 'pipeline',
  ) {
    try {
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
      );

      if (group === 'dashboard') {
        const cached = this.cacheService.get<any>('bussdev-dashboard');
        if (cached) return cached;

        const fourteenDaysAgo = new Date(
          now.getTime() - 14 * 24 * 60 * 60 * 1000,
        );
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000,
        );

        const [
          totalLeads,
          contactedLeads,
          sampleProcess,
          dpReceived,
          dealConfirmed,
          repeatOrder,
          totalPipelineValue,
          potentialSample,
          potentialDeal,
          confirmedDeal,
          repeatOrderValue,
          followUpToday,
          avgResponseAgg,
          activeLeadsCount,
          unfollowedLeads,
          stuckSamples,
          stuckNego,
          atRiskClients,
          activityStreams,
        ] = await Promise.all([
          this.prisma.salesLead.count(),
          this.prisma.salesLead.count({ where: { activities: { some: {} } } }),
          this.prisma.salesLead.count({
            where: { sampleRequests: { some: {} } },
          }),
          this.prisma.salesLead.count({
            where: {
              status: {
                in: [
                  'SPK_SIGNED',
                  'PRODUCTION_PLAN',
                  'READY_TO_SHIP',
                  'WON_DEAL',
                ],
              },
            },
          }),
          this.prisma.salesLead.count({ where: { status: 'WON_DEAL' } }),
          this.prisma.salesLead.count({ where: { orderCount: { gt: 1 } } }),
          this.prisma.salesLead.aggregate({
            where: { NOT: [{ status: 'WON_DEAL' }, { status: 'LOST' }] },
            _sum: { estimatedValue: true },
          }),
          this.prisma.salesLead.aggregate({
            where: { status: 'SAMPLE_REQUESTED' },
            _sum: { estimatedValue: true },
          }),
          this.prisma.salesLead.aggregate({
            where: {
              status: { in: ['NEGOTIATION', 'SAMPLE_APPROVED', 'SPK_SIGNED'] },
            },
            _sum: { estimatedValue: true },
          }),
          this.prisma.salesLead.aggregate({
            where: { status: 'WON_DEAL' },
            _sum: { estimatedValue: true },
          }),
          this.prisma.salesLead.aggregate({
            where: { isRepeatOrder: true },
            _sum: { estimatedValue: true },
          }),
          this.prisma.leadActivity.count({
            where: { createdAt: { gte: startOfToday } },
          }),
          this.prisma.leadActivity.aggregate({ _avg: { responseTime: true } }),
          this.prisma.salesLead.count({ where: { status: { not: 'LOST' } } }),
          this.prisma.salesLead.count({
            where: { lastFollowUpAt: null, status: 'NEW_LEAD' },
          }),
          this.prisma.salesLead.count({
            where: {
              status: 'SAMPLE_REQUESTED',
              updatedAt: { lt: fourteenDaysAgo },
            },
          }),
          this.prisma.salesLead.count({
            where: { status: 'NEGOTIATION', updatedAt: { lt: sevenDaysAgo } },
          }),
          this.prisma.salesLead.count({
            where: {
              status: 'WON_DEAL',
              lastFollowUpAt: { lt: thirtyDaysAgo },
            },
          }),
          this.prisma.activityStream.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              lead: { select: { brandName: true, clientName: true } },
            },
          }),
        ]);

        const result = {
          overview: {
            totalLeads,
            contactedLeads,
            sampleProcess,
            dpReceived,
            dealConfirmed,
            repeatOrder,
            contactRate: this.calcPct(contactedLeads, totalLeads),
            sampleRate: this.calcPct(sampleProcess, totalLeads),
            dpRate: this.calcPct(dpReceived, totalLeads),
            dealRate: this.calcPct(dealConfirmed, totalLeads),
            retentionRate: this.calcPct(repeatOrder, totalLeads),
          },
          revenuePipeline: {
            totalPipelineValue: Number(
              totalPipelineValue._sum?.estimatedValue || 0,
            ),
            potentialSample: Number(potentialSample._sum?.estimatedValue || 0),
            potentialDeal: Number(potentialDeal._sum?.estimatedValue || 0),
            confirmedDeal: Number(confirmedDeal._sum?.estimatedValue || 0),
            repeatOrderValue: Number(
              repeatOrderValue._sum?.estimatedValue || 0,
            ),
          },
          activityPerformance: {
            followUpToday,
            avgResponse: Math.round(avgResponseAgg._avg?.responseTime || 0),
            activeLeads: activeLeadsCount,
          },
          criticalAlerts: {
            unfollowedLeads,
            stuckSamples,
            stuckNego,
            atRiskClients,
          },
          bdPerformance: await this.getBDPerformance(),
          lostChurn: await this.getLostChurnTable(),
          activityStreams,
        };
        this.cacheService.set('bussdev-dashboard', result, 30_000);
        return result;
      }

      switch (group) {
        case 'guest': {
          const totalLeads = await this.prisma.salesLead.count({
            where: { status: WorkflowStatus.NEW_LEAD },
          });
          const increment = await this.prisma.salesLead.count({
            where: {
              status: 'NEW_LEAD',
              createdAt: { gte: startOfToday },
            },
          });
          const followUpActivity = await this.prisma.leadActivity.count({
            where: { lead: { status: 'NEW_LEAD' } },
          });

          const contactedCount = await this.prisma.salesLead.count({
            where: {
              status: 'NEW_LEAD',
              NOT: { lastFollowUpAt: null },
            },
          });
          const taskPercentage =
            totalLeads > 0
              ? Math.round((contactedCount / totalLeads) * 100)
              : 0;

          const meetingCount = await this.prisma.leadActivity.count({
            where: {
              activityType: { in: ['MEETING_OFFLINE', 'MEETING_ONLINE'] },
            },
          });
          const convRate = await this.calculateConversion(
            WorkflowStatus.NEW_LEAD,
            WorkflowStatus.CONTACTED,
          );

          return {
            totalLeads,
            increment,
            followUpActivity,
            completedTasks: contactedCount,
            taskPercentage,
            meetingCount,
            conversionRate: convRate,
          };
        }

        case 'sample': {
          const activeSamples = await this.prisma.salesLead.count({
            where: {
              status: {
                in: [
                  'CONTACTED',
                  'NEGOTIATION',
                  'SAMPLE_REQUESTED',
                  'SAMPLE_APPROVED',
                ],
              },
            },
          });
          const revenueForecast = await this.prisma.salesLead.aggregate({
            where: {
              status: {
                in: ['SAMPLE_REQUESTED', 'SAMPLE_APPROVED'],
              },
            },
            _sum: { estimatedValue: true },
          });
          const potentialSample = await this.prisma.salesLead.aggregate({
            where: {
              status: {
                in: ['CONTACTED', 'NEGOTIATION'],
              },
            },
            _sum: { estimatedValue: true },
          });
          return {
            activeSamples,
            revenueForecast: Number(revenueForecast._sum?.estimatedValue || 0),
            potentialSample: Number(potentialSample._sum?.estimatedValue || 0),
            conversionToProd: await this.calculateConversion(
              'SAMPLE_APPROVED' as WorkflowStatus,
              'SPK_SIGNED' as WorkflowStatus,
            ),
          };
        }

        case 'production': {
          const inProduction = await this.prisma.salesLead.count({
            where: {
              status: {
                in: ['SPK_SIGNED', 'PRODUCTION_PLAN', 'READY_TO_SHIP'],
              },
            },
          });
          const productionValue = await this.prisma.salesLead.aggregate({
            where: {
              status: {
                in: ['SPK_SIGNED', 'PRODUCTION_PLAN', 'READY_TO_SHIP'],
              },
            },
            _sum: { estimatedValue: true },
          });

          const leadsWithSpk = await this.prisma.salesLead.findMany({
            where: {
              status: {
                in: [
                  'SPK_SIGNED',
                  'PRODUCTION_PLAN',
                  'READY_TO_SHIP',
                  'WON_DEAL',
                ],
              },
              wonAt: { not: null },
            },
            select: { createdAt: true, wonAt: true },
          });

          let avgClosingTime = '—';
          if (leadsWithSpk.length > 0) {
            const totalDays = leadsWithSpk.reduce((acc, l) => {
              const diff = l.wonAt!.getTime() - l.createdAt.getTime();
              return acc + diff / (1000 * 3600 * 24);
            }, 0);
            avgClosingTime = `${Math.round(totalDays / leadsWithSpk.length)} Days`;
          }

          return {
            inProduction,
            productionValue: Number(productionValue._sum?.estimatedValue || 0),
            onTimeDelivery: '95%',
            avgClosingTime,
          };
        }

        case 'ro': {
          const totalClients = await this.prisma.salesLead.count({
            where: { status: 'WON_DEAL' },
          });
          const activeRoLeads = await this.prisma.salesLead.count({
            where: { status: 'WON_DEAL', orderCount: { gt: 1 } },
          });
          const roRevenue = await this.prisma.salesLead.aggregate({
            where: { status: 'WON_DEAL', orderCount: { gt: 1 } },
            _sum: { planOmset: true },
          });

          const retentionRate =
            totalClients > 0
              ? Math.round((activeRoLeads / totalClients) * 100)
              : 0;

          return {
            activeRoLeads,
            roRevenue: Number(roRevenue._sum?.planOmset || 0),
            retentionRate: `${retentionRate}%`,
            readyToRepeat: await this.prisma.salesLead.count({
              where: {
                status: 'WON_DEAL',
                lastFollowUpAt: {
                  lt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
                },
              },
            }),
          };
        }

        case 'lost': {
          const totalProcessed = await this.prisma.salesLead.count({
            where: { status: { not: 'LOST' } },
          });
          const lostLeads = await this.prisma.salesLead.count({
            where: { status: 'LOST' },
          });
          const lostValue = await this.prisma.salesLead.aggregate({
            where: { status: 'LOST' },
            _sum: { estimatedValue: true },
          });

          const reasons = await this.prisma.salesLead.groupBy({
            by: ['lostReason'],
            where: { status: 'LOST', lostReason: { not: null } },
            _count: { _all: true },
            orderBy: { _count: { lostReason: 'desc' } },
            take: 1,
          });

          const funnelConversion = {
            leadToSmpl: await this.calculateConversion(
              'NEW_LEAD' as WorkflowStatus,
              'SAMPLE_REQUESTED' as WorkflowStatus,
            ),
            smplToProd: await this.calculateConversion(
              WorkflowStatus.SAMPLE_APPROVED,
              WorkflowStatus.SPK_SIGNED,
            ),
            prodToRo: '45%',
          };

          return {
            lostLeads,
            lostValue: Number(lostValue._sum?.estimatedValue || 0),
            funnelConversion,
            topReason: reasons[0]?.lostReason || '—',
            leakageRate:
              totalProcessed > 0
                ? `${Math.round((lostLeads / totalProcessed) * 100)}%`
                : '0%',
          };
        }
        case 'pipeline': {
          const activeLeads = await this.prisma.salesLead.count({
            where: {
              NOT: [
                { status: WorkflowStatus.WON_DEAL },
                { status: WorkflowStatus.LOST },
              ],
            },
          });
          const pipelineValue = await this.prisma.salesLead.aggregate({
            where: {
              NOT: [
                { status: WorkflowStatus.WON_DEAL },
                { status: WorkflowStatus.LOST },
              ],
            },
            _sum: { estimatedValue: true },
          });
          const avgVelocity = await this.prisma.salesLead.findMany({
            where: { status: WorkflowStatus.WON_DEAL, wonAt: { not: null } },
            select: { createdAt: true, wonAt: true },
            take: 100,
          });

          let avgDays = 0;
          if (avgVelocity.length > 0) {
            avgDays = Math.round(
              avgVelocity.reduce(
                (acc, l) => acc + (l.wonAt!.getTime() - l.createdAt.getTime()),
                0,
              ) /
                (avgVelocity.length * 1000 * 3600 * 24),
            );
          }

          return {
            activeLeads,
            pipelineValue: Number(pipelineValue._sum?.estimatedValue || 0),
            avgDays: `${avgDays} Days`,
            conversion: {
              leadToSample: await this.calculateConversion(
                WorkflowStatus.NEW_LEAD,
                WorkflowStatus.SAMPLE_REQUESTED,
              ),
              sampleToDeal: await this.calculateConversion(
                WorkflowStatus.SAMPLE_APPROVED,
                WorkflowStatus.WON_DEAL,
              ),
            },
          };
        }
        default:
          return {};
      }
    } catch (error) {
      console.error(
        `[AnalyticsService] Error in getPageAnalytics(${group}):`,
        error,
      );
      return {};
    }
  }

  async getFunnelAnalytics(picId?: string) {
    const whereClause: any = picId ? { picId } : {};

    const totalLeads = await this.prisma.salesLead.count({
      where: whereClause,
    });

    const contactedLeads = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        timelineLogs: { some: { category: 'FOLLOW_UP' } },
      },
    });

    const sampleProcess = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        sampleRequests: { some: {} },
      },
    });

    const dpReceived = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        paymentType: { not: 'CREDIT' },
        workOrders: {
          some: {
            invoices: { some: { status: 'PAID' } },
          },
        },
      },
    });

    const dealConfirmed = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        status: WorkflowStatus.WON_DEAL,
      },
    });

    const repeatOrder = await this.prisma.salesLead.count({
      where: {
        ...whereClause,
        isRepeatOrder: true,
      },
    });

    const calcPct = (num: number, den: number) =>
      den > 0 ? ((num / den) * 100).toFixed(1) : '0';

    return {
      counts: {
        totalLeads,
        contactedLeads,
        sampleProcess,
        dpReceived,
        dealConfirmed,
        repeatOrder,
      },
      conversion: {
        contactRate: calcPct(contactedLeads, totalLeads),
        sampleRate: calcPct(sampleProcess, contactedLeads),
        dpRate: calcPct(dpReceived, sampleProcess),
        dealRate: calcPct(dealConfirmed, dpReceived),
        retentionRate: calcPct(repeatOrder, totalLeads),
      },
    };
  }

  async getGranularPipelineTable(picId?: string) {
    const leads = await this.prisma.salesLead.findMany({
      where: picId ? { picId } : {},
      include: {
        pic: true,
        sampleRequests: {
          include: {},
          orderBy: { requestedAt: 'desc' },
          take: 1,
        },
        workOrders: {
          include: {
            invoices: {
              where: { status: 'PAID' },
              take: 1,
            },
          },
          take: 1,
        },
        activities: {
          where: { isValidated: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(
      `[DEBUG] Found ${leads.length} leads in Granular Pipeline Query`,
    );

    return leads.map((lead: any, index: number) => {
      try {
        const latestSample = lead.sampleRequests?.[0] || null;
        const latestWO = lead.workOrders?.[0] || null;
        const dpInvoice = latestWO?.invoices?.[0] || null;

        const revs = latestSample?.revisions || [];
        const getRevInfo = (num: number) => {
          const r = revs.find((rev: any) => rev.revisionNumber === num);
          return r
            ? { status: r.status, date: r.completedAt || r.createdAt }
            : null;
        };

        return {
          no: index + 1,
          id: lead.id,
          clientName: lead.clientName,
          brandName: lead.brandName || 'White Label',
          productInterest: lead.productInterest,
          estimatedValue: Number(lead.estimatedValue || 0),
          moq: lead.moq || 0,
          margin: Number(lead.marginPercentage || 0),
          launchingPlan: lead.launchingPlan || '-',
          targetMarket: lead.targetMarket || '-',
          contactChannel: lead.contactChannel || '-',
          city: lead.city || '-',
          logoRevision: lead.logoRevision || 0,
          hkiProgress: lead.hkiProgress || '-',
          packagingSuggestion: lead.packagingSuggestion || '-',
          designSuggestion: lead.designSuggestion || '-',
          valueSuggestion: lead.valueSuggestion || '-',
          sku: lead.sku || '-',
          unitPrice: Number(lead.unitPrice || 0),
          notes: lead.notes || '-',
          sampleStatus: latestSample?.stage || 'N/A',
          rev1: getRevInfo(1),
          rev2: getRevInfo(2),
          rev3: getRevInfo(3),
          revisionCount: latestSample?.revisionCount || 0,
          suggestPackaging:
            latestSample?.suggestPackaging || lead.packagingSuggestion || '-',
          suggestDesign:
            latestSample?.suggestDesign || lead.designSuggestion || '-',
          suggestValue:
            latestSample?.suggestValue || lead.valueSuggestion || '-',
          totalPaid: lead.activities.reduce(
            (sum: number, act: any) => sum + Number(act.amount || 0),
            0,
          ),
          planOmset: Number(lead.planOmset || lead.estimatedValue || 0),
          picName: lead.pic?.name || 'Unassigned',
          stage: lead.status,
          status: lead.status,
          isDpPaid: !!dpInvoice,
          hkiStatus: lead.hkiMode || 'NEW',
          durationDays: Math.floor(
            (Date.now() - new Date(lead.createdAt).getTime()) /
              (1000 * 3600 * 24),
          ),
          statusLabel:
            lead.status === 'WON_DEAL'
              ? 'DEAL'
              : lead.status === 'LOST'
                ? 'LOST'
                : 'PROGRESS',
        };
      } catch (e) {
        console.error(`[ERROR] Failed to map lead ${lead.id}:`, e);
        return {
          no: index + 1,
          id: lead.id,
          clientName: lead.clientName || 'Error Lead',
          picName: 'Error',
          stage: 'ERROR',
          status: 'ERROR',
        };
      }
    });
  }

  async getBDPerformance() {
    try {
      console.log(`[AnalyticsService] Fetching BD Performance Evaluation.`);
      const staffs = await this.prisma.bussdevStaff.findMany({
        include: {
          salesLeads: {
            include: {
              timelineLogs: true,
              sampleRequests: true,
            },
          },
        },
      });

      console.log(
        `[AnalyticsService] Calculating metrics for ${staffs.length} staffs.`,
      );

      return staffs.map((staff) => {
        const leads = (staff as any).salesLeads || [];
        const totalLeads = leads.length;
        const contacted = leads.filter((l: any) =>
          l.timelineLogs?.some((log: any) => log.category === 'FOLLOW_UP'),
        ).length;
        const withSample = leads.filter(
          (l: any) => l.sampleRequests?.length > 0,
        ).length;
        const wonLeads = leads.filter((l: any) => l.status === 'WON_DEAL');
        const actualRevenue = wonLeads.reduce(
          (sum: number, l: any) =>
            sum + Number(l.planOmset || l.estimatedValue || 0),
          0,
        );
        const clsRO = leads
          .filter((l: any) => l.isRepeatOrder && l.status === 'WON_DEAL')
          .reduce((sum: number, l: any) => sum + Number(l.planOmset || 0), 0);

        const target = Number(staff.targetRevenue) || 1;
        const achievementPct = (actualRevenue / target) * 100;

        let status = 'BAWAH TARGET';
        if (achievementPct >= 100) status = 'MELAMPAUI TARGET';
        else if (achievementPct >= 80) status = 'SESUAI TARGET';

        return {
          name: staff.name,
          leads: totalLeads,
          followUp: contacted,
          crSample:
            totalLeads > 0 ? ((withSample / totalLeads) * 100).toFixed(1) : '0',
          crDeal:
            totalLeads > 0
              ? ((wonLeads.length / totalLeads) * 100).toFixed(1)
              : '0',
          clsSample: withSample,
          clsNewClient: actualRevenue - clsRO,
          clsRO: clsRO,
          actualRevenue,
          status,
        };
      });
    } catch (error) {
      console.error('[AnalyticsService] Error in getBDPerformance:', error);
      return [];
    }
  }

  async getLostChurnTable() {
    try {
      console.log(`[AnalyticsService] Fetching Lost & Churn Table.`);
      const lostLeads = await this.prisma.salesLead.findMany({
        where: { status: WorkflowStatus.LOST },
        include: { pic: true },
        orderBy: { updatedAt: 'desc' },
      });
      console.log(`[AnalyticsService] Found ${lostLeads.length} lost leads.`);
      return lostLeads.map((l) => ({
        brand: l.brandName || l.clientName,
        bd: (l as any).pic?.name || 'Unknown',
        reason: l.lostReason || 'No Reason',
        lostValue: Number(l.estimatedValue || 0),
      }));
    } catch (error) {
      console.error('[AnalyticsService] Error in getLostChurnTable:', error);
      return [];
    }
  }
}
