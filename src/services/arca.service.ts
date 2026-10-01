// @ts-ignore
import Afip from "@afipsdk/afip.js";
import path from "path";
import { CreateInvoiceDTO, InvoiceFiscalData } from "../types/arca.types";
import { getCuitData } from "../utils/arca.utils";

let afipInstance: any = null;
function getAfipClient(cuit: number) {
  if (!afipInstance) {
    const isProd = process.env.AFIP_PRODUCTION === "true";
    const cuitRaw = cuit || "";
    if (!cuitRaw) {
      throw new Error(
        "❌ AFIP_CUIT no está definido en las variables de entorno",
      );
    }

    const certPath = path.resolve(
      process.cwd(),
      `certs/${isProd ? "prod" : "dev"}/${cuit}-cert.crt`,
    );
    const keyPath = path.resolve(process.cwd(), `certs/${cuit}-key.key`);

    afipInstance = new Afip({
      CUIT: cuitRaw,
      cert: certPath,
      key: keyPath,
      production: isProd,
    });
  }
  return afipInstance;
}

export class ArcaService {
  static async generateInvoice(
    dto: CreateInvoiceDTO,
  ): Promise<InvoiceFiscalData> {
    const afip = getAfipClient(dto.cuit);
    const tipoComprobante = dto.tipoComprobante ?? 11;
    const arcaData = getCuitData(dto.cuit);
    const shopNumber = arcaData.ptoVenta;

    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
      shopNumber,
      tipoComprobante,
    );
    const nextVoucher = Number(lastVoucher) + 1;

    const today = new Date();
    const fechaISO = today.toISOString().split("T")[0];
    const fechaAfip = fechaISO.replace(/-/g, "");

    const docType = dto.customerDni ? 96 : 99; // 96: DNI, 99: Consumidor Final
    const docNr = dto.customerDni ? Number(dto.customerDni) : 0;
    const totalAmount = Math.round(dto.total * 100) / 100;

    const payload = {
      CantReg: 1,
      PtoVta: shopNumber,
      CbteTipo: tipoComprobante,
      Concepto: 1,
      DocTipo: docType,
      DocNro: docNr,
      CbteDesde: nextVoucher,
      CbteHasta: nextVoucher,
      CbteFch: fechaAfip,
      ImpTotal: totalAmount,
      ImpTotConc: 0,
      ImpNeto: totalAmount,
      ImpOpEx: 0,
      ImpTrib: 0,
      ImpIVA: 0,
      CondicionIVAReceptorId: 5, // Consumidor Final
      MonId: "PES",
      MonCotiz: 1,
    };

    const respCAE = await afip.ElectronicBilling.createVoucher(payload);
    const cuitNumber = parseInt(process.env.AFIP_CUIT!.replace(/\D/g, ""), 10);

    const qrPayload = {
      ver: 1,
      fecha: fechaISO,
      cuit: cuitNumber,
      ptoVta: shopNumber,
      tipoCmp: tipoComprobante,
      nroCmp: nextVoucher,
      importe: totalAmount,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: docType,
      nroDocRec: docNr,
      tipoCodAut: "E",
      codAut: Number(respCAE.CAE),
    };

    const base64Data = Buffer.from(JSON.stringify(qrPayload)).toString(
      "base64",
    );
    const qrUrl = `https://www.afip.gob.ar/fe/qr/?p=${base64Data}`;

    return {
      cae: respCAE.CAE,
      caeVto: respCAE.CAEFchVto,
      puntoVenta: shopNumber,
      numeroComprobante: nextVoucher,
      tipoComprobante,
      qrUrl,
      cuit: cuitNumber,
    };
  }
}
