import { redirect } from "next/navigation";

export default function MarketingLeaderboardPage() {
  redirect("/marketing/management-task?tab=team");
}
