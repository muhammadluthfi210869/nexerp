import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class RndTasksService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════
  // DAILY TASKS
  // ════════════════════════════════════════════

  async getDailyTasks(filters?: { pic?: string; status?: string; startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters?.pic) where.pic = filters.pic;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }
    return this.prisma.rndDailyTask.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getDailyTask(id: string) {
    const task = await this.prisma.rndDailyTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Daily task not found');
    return task;
  }

  async createDailyTask(data: {
    date: string;
    pic: string;
    noNpf?: string;
    projectName: string;
    category: string;
    busdev?: string;
    task?: string;
    targetSampleCount?: number;
    status?: string;
    progress?: number;
    kendala?: string;
    nextAction?: string;
    deadline?: string;
    tanggalMasuk: string;
    tanggalDone?: string;
    createdById?: string;
  }) {
    return this.prisma.rndDailyTask.create({
      data: {
        date: new Date(data.date),
        pic: data.pic,
        noNpf: data.noNpf || null,
        projectName: data.projectName,
        category: data.category || 'New Sample',
        busdev: data.busdev || null,
        task: data.task || null,
        targetSampleCount: data.targetSampleCount ?? 1,
        status: data.status || 'On Progress',
        progress: data.progress ?? 0,
        kendala: data.kendala || null,
        nextAction: data.nextAction || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        tanggalMasuk: new Date(data.tanggalMasuk),
        tanggalDone: data.tanggalDone ? new Date(data.tanggalDone) : null,
        createdById: data.createdById || null,
      },
    });
  }

  async updateDailyTask(
    id: string,
    data: {
      date?: string;
      pic?: string;
      noNpf?: string;
      projectName?: string;
      category?: string;
      busdev?: string;
      task?: string;
      targetSampleCount?: number;
      status?: string;
      progress?: number;
      kendala?: string;
      nextAction?: string;
      deadline?: string;
      tanggalMasuk?: string;
      tanggalDone?: string;
    },
  ) {
    const existing = await this.prisma.rndDailyTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Daily task not found');

    const updateData: any = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.pic !== undefined) updateData.pic = data.pic;
    if (data.noNpf !== undefined) updateData.noNpf = data.noNpf;
    if (data.projectName !== undefined) updateData.projectName = data.projectName;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.busdev !== undefined) updateData.busdev = data.busdev;
    if (data.task !== undefined) updateData.task = data.task;
    if (data.targetSampleCount !== undefined) updateData.targetSampleCount = data.targetSampleCount;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.kendala !== undefined) updateData.kendala = data.kendala;
    if (data.nextAction !== undefined) updateData.nextAction = data.nextAction;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.tanggalMasuk !== undefined) updateData.tanggalMasuk = new Date(data.tanggalMasuk);
    if (data.tanggalDone !== undefined) updateData.tanggalDone = data.tanggalDone ? new Date(data.tanggalDone) : null;

    return this.prisma.rndDailyTask.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteDailyTask(id: string) {
    const existing = await this.prisma.rndDailyTask.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Daily task not found');
    return this.prisma.rndDailyTask.delete({ where: { id } });
  }

  // ════════════════════════════════════════════
  // PROJECT MONITORING
  // ════════════════════════════════════════════

  async getProjects(filters?: { pic?: string; status?: string }) {
    const where: any = {};
    if (filters?.pic) where.pic = filters.pic;
    if (filters?.status) where.status = filters.status;
    return this.prisma.rndProject.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getProject(id: string) {
    const project = await this.prisma.rndProject.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async createProject(data: {
    projectName: string;
    pic: string;
    client?: string;
    category?: string;
    noNpf?: string;
    busdev?: string;
    status?: string;
    startDate: string;
    deadline?: string;
    totalDays?: number;
    revisionCount?: number;
    trialCount?: number;
    notes?: string;
    createdById?: string;
  }) {
    return this.prisma.rndProject.create({
      data: {
        projectName: data.projectName,
        pic: data.pic,
        client: data.client || null,
        category: data.category || null,
        noNpf: data.noNpf || null,
        busdev: data.busdev || null,
        status: data.status || 'In progress',
        startDate: new Date(data.startDate),
        deadline: data.deadline ? new Date(data.deadline) : null,
        totalDays: data.totalDays ?? null,
        revisionCount: data.revisionCount ?? 0,
        trialCount: data.trialCount ?? 0,
        notes: data.notes || null,
        createdById: data.createdById || null,
      },
    });
  }

  async updateProject(
    id: string,
    data: {
      projectName?: string;
      pic?: string;
      client?: string;
      category?: string;
      noNpf?: string;
      busdev?: string;
      status?: string;
      startDate?: string;
      deadline?: string;
      totalDays?: number;
      revisionCount?: number;
      trialCount?: number;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.rndProject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Project not found');

    const updateData: any = {};
    if (data.projectName !== undefined) updateData.projectName = data.projectName;
    if (data.pic !== undefined) updateData.pic = data.pic;
    if (data.client !== undefined) updateData.client = data.client;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.noNpf !== undefined) updateData.noNpf = data.noNpf;
    if (data.busdev !== undefined) updateData.busdev = data.busdev;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.totalDays !== undefined) updateData.totalDays = data.totalDays;
    if (data.revisionCount !== undefined) updateData.revisionCount = data.revisionCount;
    if (data.trialCount !== undefined) updateData.trialCount = data.trialCount;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.rndProject.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteProject(id: string) {
    const existing = await this.prisma.rndProject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Project not found');
    return this.prisma.rndProject.delete({ where: { id } });
  }

  // ════════════════════════════════════════════
  // RND PICS (users with RND role)
  // ════════════════════════════════════════════

  async getPics() {
    const users = await this.prisma.user.findMany({
      where: {
        roles: { has: 'RND' },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: { fullName: 'asc' },
    });
    return users.map(u => ({
      id: u.id,
      name: u.fullName || u.email.split('@')[0],
      email: u.email,
    }));
  }

  // ════════════════════════════════════════════
  // WEEKLY PERFORMANCE
  // ════════════════════════════════════════════

  async getWeeklyPerformances(filters?: { pic?: string }) {
    const where: any = {};
    if (filters?.pic) where.pic = filters.pic;
    return this.prisma.rndWeeklyPerformance.findMany({
      where,
      orderBy: [{ weekStart: 'desc' }, { pic: 'asc' }],
    });
  }

  async getWeeklyPerformance(id: string) {
    const item = await this.prisma.rndWeeklyPerformance.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Weekly performance not found');
    return item;
  }

  async createWeeklyPerformance(data: {
    pic: string;
    weekLabel: string;
    weekStart: string;
    weekEnd: string;
    totalTask?: number;
    doneCount?: number;
    delayedCount?: number;
    failedTrial?: number;
    revisionCount?: number;
    ontimePct?: number;
    trialSuccessRate?: number;
    initiativeScore?: number;
    weeklyScore?: number;
    notes?: string;
  }) {
    return this.prisma.rndWeeklyPerformance.create({
      data: {
        pic: data.pic,
        weekLabel: data.weekLabel,
        weekStart: new Date(data.weekStart),
        weekEnd: new Date(data.weekEnd),
        totalTask: data.totalTask ?? 0,
        doneCount: data.doneCount ?? 0,
        delayedCount: data.delayedCount ?? 0,
        failedTrial: data.failedTrial ?? 0,
        revisionCount: data.revisionCount ?? 0,
        ontimePct: data.ontimePct ?? 0,
        trialSuccessRate: data.trialSuccessRate ?? 0,
        initiativeScore: data.initiativeScore ?? 0,
        weeklyScore: data.weeklyScore ?? null,
        notes: data.notes ?? null,
      },
    });
  }

  async updateWeeklyPerformance(
    id: string,
    data: {
      pic?: string;
      weekLabel?: string;
      weekStart?: string;
      weekEnd?: string;
      totalTask?: number;
      doneCount?: number;
      delayedCount?: number;
      failedTrial?: number;
      revisionCount?: number;
      ontimePct?: number;
      trialSuccessRate?: number;
      initiativeScore?: number;
      weeklyScore?: number;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.rndWeeklyPerformance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Weekly performance not found');

    const updateData: any = {};
    if (data.pic !== undefined) updateData.pic = data.pic;
    if (data.weekLabel !== undefined) updateData.weekLabel = data.weekLabel;
    if (data.weekStart !== undefined) updateData.weekStart = new Date(data.weekStart);
    if (data.weekEnd !== undefined) updateData.weekEnd = new Date(data.weekEnd);
    if (data.totalTask !== undefined) updateData.totalTask = data.totalTask;
    if (data.doneCount !== undefined) updateData.doneCount = data.doneCount;
    if (data.delayedCount !== undefined) updateData.delayedCount = data.delayedCount;
    if (data.failedTrial !== undefined) updateData.failedTrial = data.failedTrial;
    if (data.revisionCount !== undefined) updateData.revisionCount = data.revisionCount;
    if (data.ontimePct !== undefined) updateData.ontimePct = data.ontimePct;
    if (data.trialSuccessRate !== undefined) updateData.trialSuccessRate = data.trialSuccessRate;
    if (data.initiativeScore !== undefined) updateData.initiativeScore = data.initiativeScore;
    if (data.weeklyScore !== undefined) updateData.weeklyScore = data.weeklyScore;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.rndWeeklyPerformance.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteWeeklyPerformance(id: string) {
    const existing = await this.prisma.rndWeeklyPerformance.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Weekly performance not found');
    return this.prisma.rndWeeklyPerformance.delete({ where: { id } });
  }

  // ════════════════════════════════════════════
  // FAILED TRIAL LEARNING
  // ════════════════════════════════════════════

  async getFailedTrials(filters?: { pic?: string }) {
    const where: any = {};
    if (filters?.pic) where.pic = filters.pic;
    return this.prisma.rndFailedTrial.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getFailedTrial(id: string) {
    const item = await this.prisma.rndFailedTrial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Failed trial not found');
    return item;
  }

  async createFailedTrial(data: {
    date: string;
    projectFormula: string;
    pic: string;
    problemSymptom: string;
    rootCause?: string;
    correctionAttempted?: string;
    solution?: string;
    finalLearning?: string;
    applicableTo?: string;
  }) {
    return this.prisma.rndFailedTrial.create({
      data: {
        date: new Date(data.date),
        projectFormula: data.projectFormula,
        pic: data.pic,
        problemSymptom: data.problemSymptom,
        rootCause: data.rootCause ?? null,
        correctionAttempted: data.correctionAttempted ?? null,
        solution: data.solution ?? null,
        finalLearning: data.finalLearning ?? null,
        applicableTo: data.applicableTo ?? null,
      },
    });
  }

  async updateFailedTrial(
    id: string,
    data: {
      date?: string;
      projectFormula?: string;
      pic?: string;
      problemSymptom?: string;
      rootCause?: string;
      correctionAttempted?: string;
      solution?: string;
      finalLearning?: string;
      applicableTo?: string;
    },
  ) {
    const existing = await this.prisma.rndFailedTrial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Failed trial not found');

    const updateData: any = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.projectFormula !== undefined) updateData.projectFormula = data.projectFormula;
    if (data.pic !== undefined) updateData.pic = data.pic;
    if (data.problemSymptom !== undefined) updateData.problemSymptom = data.problemSymptom;
    if (data.rootCause !== undefined) updateData.rootCause = data.rootCause;
    if (data.correctionAttempted !== undefined) updateData.correctionAttempted = data.correctionAttempted;
    if (data.solution !== undefined) updateData.solution = data.solution;
    if (data.finalLearning !== undefined) updateData.finalLearning = data.finalLearning;
    if (data.applicableTo !== undefined) updateData.applicableTo = data.applicableTo;

    return this.prisma.rndFailedTrial.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteFailedTrial(id: string) {
    const existing = await this.prisma.rndFailedTrial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Failed trial not found');
    return this.prisma.rndFailedTrial.delete({ where: { id } });
  }

  // ════════════════════════════════════════════
  // HEAD R&D TRACKER
  // ════════════════════════════════════════════

  async getHeadTrackerEntries() {
    return this.prisma.rndHeadTracker.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async getHeadTrackerEntry(id: string) {
    const item = await this.prisma.rndHeadTracker.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Head tracker entry not found');
    return item;
  }

  async createHeadTrackerEntry(data: {
    date: string;
    strategicTask?: string;
    teamSupport?: string;
    approvalGiven?: string;
    innovationConcept?: string;
    escalationHandled?: string;
    notes?: string;
    createdById?: string;
  }) {
    return this.prisma.rndHeadTracker.create({
      data: {
        date: new Date(data.date),
        strategicTask: data.strategicTask ?? null,
        teamSupport: data.teamSupport ?? null,
        approvalGiven: data.approvalGiven ?? null,
        innovationConcept: data.innovationConcept ?? null,
        escalationHandled: data.escalationHandled ?? null,
        notes: data.notes ?? null,
        createdById: data.createdById ?? null,
      },
    });
  }

  async updateHeadTrackerEntry(
    id: string,
    data: {
      date?: string;
      strategicTask?: string;
      teamSupport?: string;
      approvalGiven?: string;
      innovationConcept?: string;
      escalationHandled?: string;
      notes?: string;
    },
  ) {
    const existing = await this.prisma.rndHeadTracker.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Head tracker entry not found');

    const updateData: any = {};
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.strategicTask !== undefined) updateData.strategicTask = data.strategicTask;
    if (data.teamSupport !== undefined) updateData.teamSupport = data.teamSupport;
    if (data.approvalGiven !== undefined) updateData.approvalGiven = data.approvalGiven;
    if (data.innovationConcept !== undefined) updateData.innovationConcept = data.innovationConcept;
    if (data.escalationHandled !== undefined) updateData.escalationHandled = data.escalationHandled;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.rndHeadTracker.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteHeadTrackerEntry(id: string) {
    const existing = await this.prisma.rndHeadTracker.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Head tracker entry not found');
    return this.prisma.rndHeadTracker.delete({ where: { id } });
  }

  // ════════════════════════════════════════════
  // MONTHLY KPI
  // ════════════════════════════════════════════

  async getMonthlyKpis(filters?: { pic?: string; month?: string }) {
    const where: any = {};
    if (filters?.pic) where.pic = filters.pic;
    if (filters?.month) where.month = filters.month;
    return this.prisma.rndMonthlyKpi.findMany({
      where,
      orderBy: [{ month: 'desc' }, { pic: 'asc' }],
    });
  }

  async getMonthlyKpi(id: string) {
    const item = await this.prisma.rndMonthlyKpi.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Monthly KPI not found');
    return item;
  }

  async createMonthlyKpi(data: {
    month: string;
    pic: string;
    ontimePct?: number;
    trialSuccessRate?: number;
    revisionRate?: number;
    initiativeScore?: number;
    knowledgeContribution?: number;
    compositeScore?: number;
    grade?: string;
  }) {
    return this.prisma.rndMonthlyKpi.create({
      data: {
        month: data.month,
        pic: data.pic,
        ontimePct: data.ontimePct ?? 0,
        trialSuccessRate: data.trialSuccessRate ?? 0,
        revisionRate: data.revisionRate ?? 0,
        initiativeScore: data.initiativeScore ?? 0,
        knowledgeContribution: data.knowledgeContribution ?? 0,
        compositeScore: data.compositeScore ?? null,
        grade: data.grade ?? null,
      },
    });
  }

  async updateMonthlyKpi(
    id: string,
    data: {
      month?: string;
      pic?: string;
      ontimePct?: number;
      trialSuccessRate?: number;
      revisionRate?: number;
      initiativeScore?: number;
      knowledgeContribution?: number;
      compositeScore?: number;
      grade?: string;
    },
  ) {
    const existing = await this.prisma.rndMonthlyKpi.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Monthly KPI not found');

    const updateData: any = {};
    if (data.month !== undefined) updateData.month = data.month;
    if (data.pic !== undefined) updateData.pic = data.pic;
    if (data.ontimePct !== undefined) updateData.ontimePct = data.ontimePct;
    if (data.trialSuccessRate !== undefined) updateData.trialSuccessRate = data.trialSuccessRate;
    if (data.revisionRate !== undefined) updateData.revisionRate = data.revisionRate;
    if (data.initiativeScore !== undefined) updateData.initiativeScore = data.initiativeScore;
    if (data.knowledgeContribution !== undefined) updateData.knowledgeContribution = data.knowledgeContribution;
    if (data.compositeScore !== undefined) updateData.compositeScore = data.compositeScore;
    if (data.grade !== undefined) updateData.grade = data.grade;

    return this.prisma.rndMonthlyKpi.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteMonthlyKpi(id: string) {
    const existing = await this.prisma.rndMonthlyKpi.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Monthly KPI not found');
    return this.prisma.rndMonthlyKpi.delete({ where: { id } });
  }

  // ════════════════════════════════════════════
  // ANALYTICS / KPI DATA
  // ════════════════════════════════════════════

  async getAnalyticsTrends() {
    const [tasks, projects] = await Promise.all([
      this.prisma.rndDailyTask.findMany({ orderBy: { date: 'asc' } }),
      this.prisma.rndProject.findMany({ orderBy: { startDate: 'asc' } }),
    ]);

    const monthlyMap = new Map<string, { total: number; done: number; onTime: number; failed: number }>();
    tasks.forEach((t) => {
      const month = t.date.toISOString().slice(0, 7);
      const e = monthlyMap.get(month) || { total: 0, done: 0, onTime: 0, failed: 0 };
      e.total++;
      if (t.status === 'Done') e.done++;
      if (t.status === 'Failed Trial') e.failed++;
      monthlyMap.set(month, e);
    });

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        total: data.total,
        done: data.done,
        onTimeRate: data.done > 0 ? Math.round((data.onTime / data.done) * 100) : 0,
        failedCount: data.failed,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const picSet = new Set<string>();
    tasks.forEach((t) => picSet.add(t.pic));
    projects.forEach((p) => picSet.add(p.pic));

    const perPic = Array.from(picSet).map((pic) => {
      const myTasks = tasks.filter((t) => t.pic === pic);
      const done = myTasks.filter((t) => t.status === 'Done').length;
      const failed = myTasks.filter((t) => t.status === 'Failed Trial').length;
      const active = myTasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled').length;
      const avgProgress = myTasks.length > 0 ? Math.round(myTasks.reduce((s, t) => s + t.progress, 0) / myTasks.length) : 0;
      return {
        pic,
        totalTasks: myTasks.length,
        done,
        failed,
        active,
        avgProgress,
        completionRate: myTasks.length > 0 ? Math.round((done / myTasks.length) * 100) : 0,
      };
    });

    const catMap = new Map<string, number>();
    tasks.forEach((t) => catMap.set(t.category, (catMap.get(t.category) || 0) + 1));
    const categoryBreakdown = Array.from(catMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        totalTasks: tasks.length,
        totalProjects: projects.length,
        doneTasks: tasks.filter((t) => t.status === 'Done').length,
        activeTasks: tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled').length,
        failedTasks: tasks.filter((t) => t.status === 'Failed Trial').length,
        avgProgress: tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0,
      },
      monthlyTrend,
      perPic,
      categoryBreakdown,
    };
  }
}
