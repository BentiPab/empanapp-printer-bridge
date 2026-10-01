import { InvoiceFiscalData } from "./arca.types";

export interface TicketItem {
  name: string;
  quantity: number;
  price: number;
  code?: string;
}

export interface TicketData extends SaleData {
  fiscalData?: InvoiceFiscalData; // Datos inyectados si fue fiscal
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
}
