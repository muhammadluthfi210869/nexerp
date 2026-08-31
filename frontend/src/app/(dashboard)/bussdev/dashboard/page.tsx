import BussdevDashboardClient from "./BussdevDashboardClient";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function BussdevDashboardPage() {
 return (
 <DashboardShell title="Command" titleAccent="Center" subtitle="Bussdev performance overview and pipeline analytics.">
 <BussdevDashboardClient />
 </DashboardShell>
 );
}
