// Canonical Fund Request workspace lives at /finance/fund (the consolidated
// page that shows my-requests + approvals + create modal). This page is a
// redirect to preserve any stale bookmarks / deep links.
import { redirect } from "next/navigation";

export default function FundRequestsRedirect() {
 redirect("/finance/fund");
}