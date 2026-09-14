export interface SharedAuditLog {
  id: string;
  entityId: string;
  actor: string;
  role: string;
  action: string;
  timestamp: string;
  note?: string;
  notes?: string;
  details?: string;
  badge?: string;
  severity?: "info" | "warning" | "danger" | "critical" | string;
}

export interface SharedInternalNote {
  id: string;
  entityId: string;
  author?: string;
  authorName?: string;
  role?: string;
  authorRole?: string;
  content: string;
  timestamp?: string;
  createdAt?: string;
  department?: string;
  targetDepartment?: string;
  isUrgent?: boolean;
  urgency?: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | string;
  tags?: string[];
}

const auditStorage: Record<string, SharedAuditLog[]> = {};
const notesStorage: Record<string, SharedInternalNote[]> = {};

export function getSharedAuditLogs(entityId: string): SharedAuditLog[] {
  return auditStorage[entityId] || [
    {
      id: "log-init-" + entityId,
      entityId,
      actor: "Sistem Otomasi",
      role: "System",
      action: "Entitas Terdaftar",
      timestamp: new Date().toISOString(),
      note: "Dokumen masuk ke dalam sistem ERP terintegrasi",
      badge: "Inisiasi",
      severity: "info",
    },
  ];
}

export function addSharedAuditLog(log: Omit<SharedAuditLog, "id" | "timestamp">): SharedAuditLog {
  const newLog: SharedAuditLog = {
    ...log,
    id: "log-" + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
  };
  if (!auditStorage[log.entityId]) {
    auditStorage[log.entityId] = [];
  }
  auditStorage[log.entityId].unshift(newLog);
  return newLog;
}

export function getSharedInternalNotes(entityId: string): SharedInternalNote[] {
  return notesStorage[entityId] || [];
}

export function addSharedInternalNote(note: Partial<SharedInternalNote> & { entityId: string; content: string }): SharedInternalNote {
  const newNote: SharedInternalNote = {
    ...note,
    id: "note-" + Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  if (!notesStorage[note.entityId]) {
    notesStorage[note.entityId] = [];
  }
  notesStorage[note.entityId].unshift(newNote);
  return newNote;
}

export interface SharedLegalityTask {
  id: string;
  customerName: string;
  productName: string;
  bpomRegNumber?: string;
  status?: string;
  [key: string]: any;
}

export interface SharedSalesOrder {
  id: string;
  code: string;
  customerName: string;
  productName: string;
  status: string;
  category?: string;
  date?: string;
  [key: string]: any;
}

export function getSharedArtworkProjects(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("NEXERP_ARTWORK_PROJECTS");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveSharedArtworkProjects(projects: any[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("NEXERP_ARTWORK_PROJECTS", JSON.stringify(projects));
    window.dispatchEvent(new CustomEvent("nexerp:artwork-updated"));
  } catch (e) {
    console.error(e);
  }
}

export function getSharedLegalityTasks(): SharedLegalityTask[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("NEXERP_LEGALITY_TASKS");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function getSharedSalesOrders(): SharedSalesOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("NEXERP_SALES_ORDERS");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}
