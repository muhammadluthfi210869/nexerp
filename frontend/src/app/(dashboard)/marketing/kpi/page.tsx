import { redirect } from "next/navigation";

export default function MarketingKpiPage() {
  redirect("/marketing/management-task?tab=team");
}
