export interface InvoiceFiscalData {
  cuit: number;
  cae: string;
  caeExpirationDate: string;
  salePoint: number;
  invoiceNumber: number;
  invoiceType: number;
  qrUrl: string;
  legalEntity: string;
  iibbId: number;
  address: string;
  startActivities: Date;
  createdAt: Date;
}
