export interface TicketData {
  orderNumber: number;
  customer: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  cashPayment: boolean;
  employeeName?: string;
  terminalId?: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    code?: string;
  }[];
}
