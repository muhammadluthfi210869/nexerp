import WhatsAppSalesClient from "./WhatsAppSalesClient";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata = {
  title: "WhatsApp Sales | Marketing",
};

export default function WhatsAppSalesPage() {
  return (
    <DashboardShell
      title="WhatsApp"
      titleAccent="Sales"
      subtitle="Hubungkan perangkat WhatsApp resmi Sales ke Self QR collector. Status koneksi terlihat langsung dari sini."
    >
      <WhatsAppSalesClient />
    </DashboardShell>
  );
}
