import { redirect } from "next/navigation";

// SPEC: DM-TASK-001
// The canonical entry point is deterministic. Viewer-specific scope belongs to
// the authenticated API response, never to editable browser-owned identity data.
export default function ManagementTaskPage() {
  redirect("/marketing/management-task/overview");
}
