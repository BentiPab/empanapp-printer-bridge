import path from "path";
import fs from "fs";
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";
import { SaleData } from "../types/ticket.types";
import { formatLine, priceParser, SPACER } from "../utils/printer.utils";

const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.100";

export class PrinterService {
  static async printTicket(
    data: SaleData,
  ): Promise<{ success: boolean; message?: string }> {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${PRINTER_IP}`,
      characterSet: CharacterSet.WPC1252,
      removeSpecialCharacters: false,
    });

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      throw new Error("La impresora no responde en la red local");
    }

    printer.alignCenter();

    // 1. Logo
    try {
      const logoPath = path.join(process.cwd(), "public", "logo_negro.png");
      if (fs.existsSync(logoPath)) {
        await printer.printImage(logoPath);
        await printer.execute();
        printer.clear();
      } else {
        console.error("El logo no existe en:", logoPath);
      }
    } catch (imageError) {
      console.error("Error al imprimir logo, imprimiendo texto:", imageError);
      printer.newLine();
      printer.setTextDoubleHeight();
      printer.println("EMPANÁ");
      printer.setTextNormal();
    }

    // 2. Encabezado: Fiscal vs No Fiscal
    if (data.fiscalData) {
      const {
        invoiceNumber,
        iibbId,
        invoiceType,
        legalEntity,
        salePoint,
        startActivities,
        address,
        cuit,
        createdAt,
      } = data.fiscalData;
      const letra = invoiceType === 11 ? "C" : "B";
      const ptoVta = String(salePoint).padStart(4, "0");
      const nroComp = String(invoiceNumber).padStart(8, "0");

      printer.setTextDoubleHeight();
      printer.setTextDoubleWidth();
      printer.println(`[ ${letra} ]`);
      printer.setTextNormal();

      printer.println("Codigo N 011");
      printer.println(`FACTURA ${letra}`);
      printer.println(`${ptoVta}-${nroComp}`);
      printer.println(`Fecha: ${new Date(createdAt).toLocaleString("es-AR")}`);

      printer.println(SPACER);

      printer.println(legalEntity || "EMPANÁ");
      printer.println(`Domicilio: ${address || ""}`);
      printer.println(`CUIT: ${cuit}`);
      printer.println("IVA: RESPONSABLE MONOTRIBUTO");
      printer.println(`IIBB: ${iibbId || ""}`);
      printer.println(
        `Inicio Act.: ${new Date(startActivities).toISOString().split("T")[0]}`,
      );

      printer.println(SPACER);

      printer.println("Receptor: Consumidor Final");
      printer.println("Cond IVA: Consumidor Final");
    } else {
      printer.println("¡GRACIAS POR SU COMPRA!");
      printer.println(SPACER);

      printer.alignLeft();
      printer.println(`Empleado: RECEPCIÓN`);
      printer.println(`TPV:  TPV 1`);
      printer.println(`Cliente: ${data.customer || "PABLO BENTIVENGO"}`);
    }

    printer.alignCenter();
    printer.println(SPACER);

    // 3. Detalle de Items agrupados
    const groupedItems: Record<string, SaleData["items"][number]> = {};
    data.items.forEach((item) => {
      const key = item.code || item.name;
      if (groupedItems[key]) {
        groupedItems[key].quantity += item.quantity;
      } else {
        groupedItems[key] = { ...item };
      }
    });

    Object.values(groupedItems).forEach((item) => {
      // Línea 1: Nombre del producto
      printer.alignLeft();
      printer.println(item.name);

      // Línea 2: "Cantidad x Unitario" a la izquierda | "Subtotal" a la derecha
      const line = formatLine(
        `${item.quantity} x ${priceParser(item.price)}`,
        `${priceParser(item.price * item.quantity)}`,
      );
      printer.println(line);
    });

    // Descuentos si aplican
    if (data.discountAmount > 0) {
      const discountLine = formatLine(
        "Descuentos aplicados",
        `- ${priceParser(data.discountAmount)}`,
      );
      printer.println(discountLine);
    }

    printer.alignCenter();
    printer.println(SPACER);

    // 4. Totales
    printer.alignLeft();
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    printer.println(formatLine("Total", `${priceParser(data.total)}`, 20));
    printer.setTextNormal();

    // Descuento en efectivo (solo visible en venta no fiscal)
    if (!data.fiscalData) {
      printer.println(
        formatLine("Efectivo -10%", `${priceParser(data.total * 0.9)}`),
      );
    }

    // 5. Pie Fiscal (QR oficial + CAE)
    if (data.fiscalData) {
      printer.alignCenter();
      printer.println(SPACER);
      printer.newLine();

      printer.printQR(data.fiscalData.qrUrl, {
        cellSize: 4,
        correction: "M",
      });

      printer.newLine();
      printer.println(`CAE: ${data.fiscalData.cae}`);
      printer.println(`Vto. CAE: ${data.fiscalData.caeExpirationDate}`);
    }

    printer.alignCenter();
    printer.println(SPACER);

    // 6. Pie Comercial
    printer.newLine();
    printer.println("Take away");
    printer.println("11 7891-4632");
    printer.newLine();

    const now = new Date();
    const fechaHora = `${now.toLocaleDateString("es-AR")}, ${now.toLocaleTimeString("es-AR")}`;
    const orderNro = `#${data.orderNumber.toString().padStart(4, "0")}`;

    printer.println(formatLine(fechaHora, orderNro));
    printer.cut();

    if (!data.fiscalData) {
      // 7. Comanda de cocina / empaque
      printer.alignCenter();
      printer.setTextSize(3, 3);
      printer.println(
        `${data.customer.toUpperCase()} #${data.orderNumber.toString().padStart(4, "0")}`,
      );

      Object.values(groupedItems)
        .filter((i) => !!i.code)
        .forEach((item) => {
          printer.alignLeft();
          printer.println(`${item.quantity}   ${item.code}`);
        });

      printer.cut();
    }

    try {
      await printer.execute();
      return { success: true };
    } catch (error) {
      console.error("Error al enviar comandos a la impresora:", error);
      return { success: false, message: "Printer Execution Error" };
    }
  }
}
