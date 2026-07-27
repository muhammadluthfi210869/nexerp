import { redirect } from "next/navigation";
import { ManagementTaskBoard } from "../ManagementTaskBoard";

type ManagementTaskMemberPageProps = {
  params?: Promise<{
    member?: string;
  }>;
};

const validMembers = new Set(["overview", "aurel", "revi", "zarka", "gusti", "luthfi"]);

export default async function ManagementTaskMemberPage({ params }: ManagementTaskMemberPageProps) {
  const resolvedParams = (await params) ?? {};
  const member = (resolvedParams.member ?? "overview").toLowerCase();

  if (!validMembers.has(member)) {
    redirect("/marketing/management-task/overview");
  }

  return <ManagementTaskBoard activeMember={member} />;
}
