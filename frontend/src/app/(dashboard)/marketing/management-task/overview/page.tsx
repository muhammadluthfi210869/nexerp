import TaskWorkspaceV2 from "../TaskWorkspaceV2";

// Overview workspace: aggregates all members' tasks. TaskWorkspaceV2 treats
// `memberSlug === "overview"` as a reserved value (see TaskWorkspaceV2.tsx)
// and skips the per-member profile render, instead showing the full task list
// + KPI tiles. This page exists so the sidebar "Task" entry lands somewhere
// real (previously a 307 ghost route) and so the unknown-slug redirect
// inside TaskWorkspaceV2 has a target.

export const dynamic = "force-dynamic";

export default function ManagementTaskOverviewPage() {
  return <TaskWorkspaceV2 memberSlug="overview" />;
}
