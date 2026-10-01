export type GuestBookCategory = "BRANDED" | "PEMULA" | "KLINIK" | "DISTRIBUTOR";

export interface GuestBookEntry {
  id: string;
  no: number;
  dateTime: string;
  clientName: string;
  instansi: string;
  contact: string;
  city: string;
  meetingPic: string;
  productInterest: string;
  moq: number;
  targetMarket: string;
  category: GuestBookCategory;
}

export interface GuestBookFormData {
  clientName: string;
  instansi: string;
  phone: string;
  city: string;
  productInterest: string;
  moqPlan: string;
  targetMarket: string;
  category: GuestBookCategory;
  busDev: string;
  visitDate?: string;
}
