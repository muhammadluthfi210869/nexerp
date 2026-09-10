import { redirect } from "next/navigation";

export default function MarketingReportsPage() {
  redirect("/marketing/management-task?tab=reports");
}
