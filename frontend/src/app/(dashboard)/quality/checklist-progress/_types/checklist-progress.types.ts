export interface ChecklistProgress {
  id: string;
  code: string;
  salesOrderNo: string;
  brandProduct: string;
  customer: string;
  category: string;
  name: string;
  pic: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: string;
  deadline: string | null;
  totalItems: number;
  completedItems: number;
  bpomRegNumber?: string;
  bpomIssuedDate?: string;
}
