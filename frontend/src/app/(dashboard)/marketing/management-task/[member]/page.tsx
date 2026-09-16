import { notFound } from "next/navigation";
import ManagementTaskWorkspace from "../ManagementTaskWorkspace";

export default async function ManagementTaskMemberPage({ params }: { params: Promise<{ member: string }> }) {
  const { member } = await params;
  if (!/^[a-z0-9-]+$/i.test(member)) notFound();
  return <ManagementTaskWorkspace initialMemberSlug={member.toLowerCase()} />;
}
