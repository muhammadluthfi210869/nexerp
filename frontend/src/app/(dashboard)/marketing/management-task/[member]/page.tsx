import { notFound } from "next/navigation";
import TaskWorkspaceV2 from "../TaskWorkspaceV2";

export default async function ManagementTaskMemberPage({ params }: { params: Promise<{ member: string }> }) {
  const { member } = await params;
  if (!/^[a-z0-9-]+$/i.test(member)) notFound();
  return <TaskWorkspaceV2 memberSlug={member.toLowerCase()} />;
}
