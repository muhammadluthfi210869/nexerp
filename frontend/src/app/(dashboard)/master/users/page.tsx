import { redirect } from "next/navigation";

export default function MasterUsersRedirect() {
  redirect("/master/personnel?tab=users");
}
