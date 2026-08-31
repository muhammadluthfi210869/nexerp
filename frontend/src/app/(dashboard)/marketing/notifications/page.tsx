import { redirect } from "next/navigation";

export default function MarketingNotificationsPage() {
 // PROTOTYPE: tab "reports" tidak ada di ManagementTask → arahkan ke overview.
 redirect("/marketing/management-task?tab=overview");
}
