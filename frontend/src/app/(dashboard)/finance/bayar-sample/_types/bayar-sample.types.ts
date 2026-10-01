export interface SamplePayment {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
}

export interface VerifyPaymentPayload {
  sampleId: string;
  formData: FormData;
}
