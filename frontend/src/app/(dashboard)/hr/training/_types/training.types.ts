export interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePosition?: string;
  department?: string;
  trainingType: string;
  hours: number;
  goal: string;
  trainingDate: string;
  certificateUrl?: string;
  onboardingStatus?: string;
  createdAt?: string;
}

export interface AddTrainingPayload {
  employeeId: string;
  trainingType: string;
  hours: number;
  goal: string;
  trainingDate: string;
  certificateUrl?: string;
}
