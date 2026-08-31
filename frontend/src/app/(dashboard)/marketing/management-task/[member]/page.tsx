import { redirect } from "next/navigation";
import { ManagementTaskBoard } from "../ManagementTaskBoard";

type ManagementTaskMemberPageProps = {
 params?: Promise<{
 member?: string;
 }>;
};

// "overview" sengaja valid: dropdown member menyediakan opsi Overview yang
// menuju /marketing/management-task/overview (sebelumnya 404-bounce karena
// tidak ada di daftar → Overview tidak pernah bisa dibuka).
const validMembers = new Set(["overview", "aurel", "revi", "zarka", "gusti", "luthfi", "rahmat"]);

export default async function ManagementTaskMemberPage({ params }: ManagementTaskMemberPageProps) {
 const resolvedParams = (await params) ?? {};
 const member = (resolvedParams.member ?? "overview").toLowerCase();

 if (!validMembers.has(member)) {
 redirect("/marketing/management-task");
 }

 return <ManagementTaskBoard activeMember={member} />;
}
