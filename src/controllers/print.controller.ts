import { Request, Response } from "express";
import { SaleData } from "../types/ticket.types";
import { ArcaService } from "../services/arca.service";
import { PrinterService } from "../services/printer.service";
import { TicketPreviewService } from "../services/ticket-preview-service";

export class PrintController {
  public async printTicket(
    req: Request<any, any, { data: SaleData }>,
    res: Response,
  ) {
    const sale = req.body.data;
    console.log(
      `🖨️ Procesando ticket de orden #${sale.orderNumber} (Fiscal: ${Boolean(sale.isFiscal)})`,
    );

    try {
      let fiscalData = undefined;

      // Si viene flag de factura fiscal, autorizamos contra ARCA
      if (sale.isFiscal && sale.cuit) {
        fiscalData = await ArcaService.generateInvoice({
          cuit: sale.cuit,
          total: sale.total,
        });
      }
      let printRes: { success: boolean; message?: string } = {
        success: true,
        message: "",
      };
      if (process.env.PRINTER_PRODUCTION === "true") {
        printRes = await PrinterService.printTicket({
          ...sale,
          fiscalData,
        });
      } else {
        await TicketPreviewService.generateTicketImage({ ...sale, fiscalData });
      }
      // Se imprime con o sin datos fiscales según corresponda

      if (!printRes.success) {
        return res
          .status(500)
          .json({ success: false, error: printRes.message });
      }

      return res.status(200).json({
        success: true,
        message: "Ticket impreso correctamente",
        fiscal: Boolean(fiscalData),
        fiscalData,
      });
    } catch (error) {
      console.error("❌ Error en el puente de impresión:", error);
      return res
        .status(500)
        .json({ success: false, error: (error as Error).message });
    }
  }
}
