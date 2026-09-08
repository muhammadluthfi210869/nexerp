import { redirect } from "next/navigation";
import { ManagementTaskBoard } from "../ManagementTaskBoard";
import { MEMBER_ALIASES } from "@/lib/marketing-members";

type ManagementTaskMemberPageProps = {
  params?: Promise<{
    member?: string;
  }>;
};

// "overview" valid: dropdown offers it as a direct route.
const validMembers = new Set(["overview", ...Object.values(MEMBER_ALIASES).flat()]);

export default async function ManagementTaskMemberPage({ params }: ManagementTaskMemberPageProps) {
  const resolvedParams = (await params) ?? {};
  const member = (resolvedParams.member ?? "overview").toLowerCase();

  if (!validMembers.has(member)) {
    redirect("/marketing/management-task");
  }

  return <ManagementTaskBoard activeMember={member} />;
}
