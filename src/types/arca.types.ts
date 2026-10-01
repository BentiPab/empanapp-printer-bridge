export interface CreateInvoiceDTO {
  cuit: number;
  total: number;
  tipoComprobante?: number; // 11 = Factura C, 6 = Factura B
  customerDni?: string;
}

export interface InvoiceFiscalData {
  cuit: number;
  cae: string;
  caeVto: string;
  puntoVenta: number;
  numeroComprobante: number;
  tipoComprobante: number;
  qrUrl: string;
}

export interface ARCAData {
  razonSocial: string;
  domicilio: string;
  inicAct: string;
  iibb: string;
  ptoVenta: number;
}
