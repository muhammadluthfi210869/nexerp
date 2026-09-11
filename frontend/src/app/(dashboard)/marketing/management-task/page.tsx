import { redirect } from "next/navigation";

export default function ManagementTaskEntryPage() {
  // phase-3 fix: route /marketing/management-task/overview does not exist on any
  // branch — drop the dead-link segment. Dynamic /[member] route handles the
  // real UX (member resolver per production-light).
  redirect("/marketing/management-task");
}
