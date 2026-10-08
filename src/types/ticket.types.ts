import { InvoiceFiscalData } from "./arca.types";

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  code?: string;
}

export interface SaleData {
  orderNumber: number;
  customer: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  isFiscal?: boolean;
  cuit?: number;
  items: TicketItem[];
  newInvoice: boolean;
  fiscalData?: InvoiceFiscalData;
}
