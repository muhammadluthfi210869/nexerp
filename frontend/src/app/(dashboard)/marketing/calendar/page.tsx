import { redirect } from "next/navigation";

export default function MarketingCalendarPage() {
  redirect("/marketing/management-task?tab=calendar");
}
