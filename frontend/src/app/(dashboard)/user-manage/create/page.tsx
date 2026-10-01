import { redirect } from "next/navigation";

export default function UserManageCreateRedirect() {
  redirect("/master/personnel?tab=users&action=create");
}
