import { redirect } from "next/navigation";

export default function MarketingReportsPage() {
 // PROTOTYPE: tab "reports" tidak ada di ManagementTask → arahkan ke overview.
 redirect("/marketing/management-task?tab=overview");
}
