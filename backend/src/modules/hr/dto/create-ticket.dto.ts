export class CreateTicketDto {
  type!: any;
  reason!: string;
  startDate!: string;
  endDate?: string;
  amount?: number;
}
