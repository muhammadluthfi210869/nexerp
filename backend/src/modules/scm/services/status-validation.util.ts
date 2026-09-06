/**
 * Item 63: Next Status Validation Helper
 * Validates that status transitions are allowed based on milestone dependencies.
 * Reject if nextStatus === DONE but dependent milestone belum done.
 */

export interface MilestoneEntry {
  id: string;
  name: string;
  status: string;
}

export interface StatusValidationResult {
  valid: boolean;
  error?: string;
  blockedBy?: string[];
}

export function validateNextStatus(
  currentStatus: string,
  nextStatus: string,
  milestoneHistory: MilestoneEntry[],
): StatusValidationResult {
  if (nextStatus !== "DONE") {
    return { valid: true };
  }

  const pendingMilestones = milestoneHistory
    .filter((m) => m.status !== "DONE")
    .map((m) => m.name);

  if (pendingMilestones.length > 0) {
    return {
      valid: false,
      error: "Tidak bisa set DONE karena milestone belum selesai: " + pendingMilestones.join(", "),
      blockedBy: pendingMilestones,
    };
  }

  return { valid: true };
}

export async function getRealStok() {
  return null;
}
