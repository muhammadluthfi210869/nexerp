-- CreateEnum: Project status values used by RND projects
DO $$ BEGIN
  CREATE TYPE "RndProjectStatus" AS ENUM ('IN_PROGRESS', 'DONE', 'ON_HOLD', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- CreateTable: rnd_daily_tasks
-- Aktivitas & target harian semua staff R&D
CREATE TABLE IF NOT EXISTS "rnd_daily_tasks" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pic" TEXT NOT NULL,
    "noNpf" TEXT,
    "projectName" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'New Sample',
    "busdev" TEXT,
    "task" TEXT,
    "targetSampleCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'On Progress',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "kendala" TEXT,
    "nextAction" TEXT,
    "deadline" DATE,
    "tanggalMasuk" DATE NOT NULL,
    "tanggalDone" DATE,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rnd_daily_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rnd_projects
-- Status semua project R&D secara global
CREATE TABLE IF NOT EXISTS "rnd_projects" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "client" TEXT,
    "category" TEXT,
    "noNpf" TEXT,
    "busdev" TEXT,
    "status" TEXT NOT NULL DEFAULT 'In Progress',
    "startDate" DATE NOT NULL,
    "deadline" DATE,
    "totalDays" INTEGER,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "trialCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rnd_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rnd_weekly_performance
-- Rekap performa mingguan per staff R&D
CREATE TABLE IF NOT EXISTS "rnd_weekly_performance" (
    "id" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "weekLabel" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "weekEnd" DATE NOT NULL,
    "totalTask" INTEGER NOT NULL DEFAULT 0,
    "doneCount" INTEGER NOT NULL DEFAULT 0,
    "delayedCount" INTEGER NOT NULL DEFAULT 0,
    "failedTrial" INTEGER NOT NULL DEFAULT 0,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "ontimePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trialSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initiativeScore" INTEGER NOT NULL DEFAULT 0,
    "weeklyScore" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rnd_weekly_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rnd_failed_trials
-- Knowledge base trial gagal R&D
CREATE TABLE IF NOT EXISTS "rnd_failed_trials" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "projectFormula" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "problemSymptom" TEXT NOT NULL,
    "rootCause" TEXT,
    "correctionAttempted" TEXT,
    "solution" TEXT,
    "finalLearning" TEXT,
    "applicableTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rnd_failed_trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rnd_head_tracker
-- Strategic contribution Head R&D
CREATE TABLE IF NOT EXISTS "rnd_head_tracker" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "strategicTask" TEXT,
    "teamSupport" TEXT,
    "approvalGiven" TEXT,
    "innovationConcept" TEXT,
    "escalationHandled" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rnd_head_tracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rnd_monthly_kpi
-- Rekap KPI bulanan untuk dashboard analytics
CREATE TABLE IF NOT EXISTS "rnd_monthly_kpi" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "pic" TEXT NOT NULL,
    "ontimePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trialSuccessRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revisionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "initiativeScore" INTEGER NOT NULL DEFAULT 0,
    "knowledgeContribution" INTEGER NOT NULL DEFAULT 0,
    "compositeScore" DOUBLE PRECISION,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rnd_monthly_kpi_pkey" PRIMARY KEY ("id")
);

