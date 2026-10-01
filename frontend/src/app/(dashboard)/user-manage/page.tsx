import { redirect } from "next/navigation";

export default function UserManageRedirect() {
  redirect("/master/personnel?tab=users");
}
