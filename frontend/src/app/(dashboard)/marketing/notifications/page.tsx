import { redirect } from "next/navigation";

export default function MarketingNotificationsPage() {
  redirect("/marketing/management-task?tab=reports");
}
