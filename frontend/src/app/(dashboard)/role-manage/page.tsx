import { redirect } from "next/navigation";

export default function RoleManageRedirect() {
  redirect("/master/personnel?tab=roles");
}
