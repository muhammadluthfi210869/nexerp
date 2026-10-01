export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFERED"
  | "HIRED"
  | "REJECTED";

export type CandidateStatus = "IN_PROCESS" | "HIRED" | "REJECTED";

export interface CandidateItem {
  id: string;
  name: string;
  department: string;
  appliedRole?: string;
  email: string;
  phone?: string;
  cvUrl?: string;
  cvReviewScore?: number;
  cvReviewNotes?: string;
  source?: string;
  interviewer?: string;
  interviewDate?: string;
  expectedJoinDate?: string;
  stage: CandidateStage;
  status: CandidateStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidatePayload {
  name: string;
  department: string;
  email: string;
  phone?: string;
  cvUrl?: string;
  cvReviewScore?: number;
  cvReviewNotes?: string;
}
