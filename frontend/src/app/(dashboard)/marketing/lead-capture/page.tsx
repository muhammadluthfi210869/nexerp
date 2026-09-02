import { Metadata } from "next";
import LeadCaptureDashboard from "./LeadCaptureDashboard";

export const metadata: Metadata = {
  title: "Lead Capture | DreamLab",
  description: "Zero-friction WhatsApp lead management",
};

export default function Page() {
  return <LeadCaptureDashboard />;
}
