import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ScmPembelianCreateRedirect() {
  redirect("/pembelian/scm-pembelian?action=create");
}
