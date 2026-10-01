import { createCanvas, loadImage } from "@napi-rs/canvas";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { TicketData } from "../types/ticket.types";
import { priceParser, SPACER } from "../utils/printer.utils";
import { getCuitData } from "../utils/arca.utils";
import { ARCAData } from "../types/arca.types";

export class TicketPreviewService {
  static async generateTicketImage(
    data: TicketData,
    outputPath?: string,
  ): Promise<Buffer> {
    const width = 576; // Ancho estándar de papel 80mm
    const lineHeight = 26;
    const padding = 28;
    const rightMargin = width - padding;

    let arcaData = {} as ARCAData;
    if (data.isFiscal && data.cuit) {
      arcaData = getCuitData(data?.cuit);
    }

    // Altura calculada para contener comanda y factura
    const baseLinesCount = 38 + data.items.length * 3;
    const extraFiscalHeight = data.isFiscal && data.isFiscal ? 320 : 0;
    const height = baseLinesCount * lineHeight + extraFiscalHeight;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // Fondo blanco papel
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // Tipografía base térmica idéntica a ESC/POS
    ctx.fillStyle = "#111111";
    ctx.textBaseline = "top";

    let cursorY = padding;

    // Helper: Separador con guiones de texto idéntico al ticket real
    const printSpacer = () => {
      ctx.save();
      ctx.textAlign = "center";
      ctx.font = "19px 'Courier New', monospace";
      ctx.fillText(SPACER, width / 2, cursorY);
      ctx.restore();
      cursorY += lineHeight;
    };

    // 1. Logo
    const logoPath = path.join(process.cwd(), "public", "logo_negro.png");
    if (fs.existsSync(logoPath)) {
      try {
        const logo = await loadImage(logoPath);
        const logoW = 190;
        const logoH = (logo.height / logo.width) * logoW;
        ctx.drawImage(logo, (width - logoW) / 2, cursorY, logoW, logoH);
        cursorY += logoH + 20;
      } catch {
        ctx.textAlign = "center";
        ctx.font = "bold 26px 'Courier New', monospace";
        ctx.fillText("EMPANÁ", width / 2, cursorY);
        cursorY += lineHeight * 1.5;
      }
    }

    // 2. Encabezado
    if (data.fiscalData && data.isFiscal) {
      const letra = data.fiscalData.tipoComprobante === 11 ? "C" : "B";
      const ptoVta = String(data.fiscalData.puntoVenta).padStart(4, "0");
      const nroComp = String(data.fiscalData.numeroComprobante).padStart(
        8,
        "0",
      );

      ctx.textAlign = "center";
      ctx.font = "bold 32px 'Courier New', monospace";
      ctx.fillText(`[ ${letra} ]`, width / 2, cursorY);
      cursorY += lineHeight * 1.3;

      ctx.font = "18px 'Courier New', monospace";
      ctx.fillText("Codigo N 011", width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(`FACTURA ${letra}`, width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(`${ptoVta}-${nroComp}`, width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(
        `Fecha: ${new Date().toLocaleString("es-AR")}`,
        width / 2,
        cursorY,
      );
      cursorY += lineHeight;

      printSpacer();

      ctx.fillText(arcaData.razonSocial || "EMPANÁ", width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(
        `Domicilio: ${arcaData.domicilio || ""}`,
        width / 2,
        cursorY,
      );
      cursorY += lineHeight;
      ctx.fillText(`CUIT: ${process.env.AFIP_CUIT}`, width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText("IVA: RESPONSABLE MONOTRIBUTO", width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(`IIBB: ${arcaData.iibb || ""}`, width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(
        `Inicio Act.: ${arcaData.inicAct || ""}`,
        width / 2,
        cursorY,
      );
      cursorY += lineHeight;

      printSpacer();

      ctx.fillText("Receptor: Consumidor Final", width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText("Cond IVA: Consumidor Final", width / 2, cursorY);
      cursorY += lineHeight;
    } else {
      ctx.textAlign = "center";
      ctx.font = "19px 'Courier New', monospace";
      ctx.fillText("¡GRACIAS POR SU COMPRA!", width / 2, cursorY);
      cursorY += lineHeight;

      printSpacer();

      ctx.textAlign = "left";
      ctx.font = "18px 'Courier New', monospace";
      ctx.fillText(`Empleado: ${"RECEPCIÓN"}`, padding, cursorY);
      cursorY += lineHeight;
      ctx.fillText(`TPV: ${"TPV 1"}`, padding, cursorY);
      cursorY += lineHeight;
      ctx.fillText(
        `Cliente: ${data.customer || "PABLO BENTIVENGO"}`,
        padding,
        cursorY,
      );
      cursorY += lineHeight;
    }

    printSpacer();

    // 3. Detalle de Items
    const groupedItems: Record<string, TicketData["items"][number]> = {};
    data.items.forEach((item) => {
      const key = item.code || item.name;
      if (groupedItems[key]) {
        groupedItems[key].quantity += item.quantity;
      } else {
        groupedItems[key] = { ...item };
      }
    });

    ctx.font = "18px 'Courier New', monospace";
    Object.values(groupedItems).forEach((item) => {
      // Línea 1: Nombre del producto
      ctx.textAlign = "left";
      ctx.fillText(item.name, padding, cursorY);
      cursorY += lineHeight;

      // Línea 2: "X x $ Precio" a la izquierda | "$ Subtotal" a la derecha
      ctx.textAlign = "left";
      ctx.fillText(
        `${item.quantity} x ${priceParser(item.price)}`,
        padding,
        cursorY,
      );

      ctx.textAlign = "right";
      ctx.fillText(
        priceParser(item.price * item.quantity),
        rightMargin,
        cursorY,
      );
      cursorY += lineHeight;
    });

    // Descuentos si existen
    if (data.discountAmount > 0) {
      ctx.textAlign = "left";
      ctx.fillText("Descuentos aplicados", padding, cursorY);
      ctx.textAlign = "right";
      ctx.fillText(
        `- ${priceParser(data.discountAmount)}`,
        rightMargin,
        cursorY,
      );
      cursorY += lineHeight;
    }

    printSpacer();

    // 4. Totales
    ctx.textAlign = "left";
    ctx.font = "bold 24px 'Courier New', monospace";
    ctx.fillText("Total", padding, cursorY);

    ctx.textAlign = "right";
    ctx.fillText(priceParser(data.total), rightMargin, cursorY);
    cursorY += lineHeight * 1.2;

    if (!data.fiscalData || !data.isFiscal) {
      ctx.font = "18px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillText("Efectivo -10%", padding, cursorY);

      ctx.textAlign = "right";
      ctx.fillText(priceParser(data.total * 0.9), rightMargin, cursorY);
      cursorY += lineHeight;
    }

    // 5. Pie Fiscal con QR real
    if (data.fiscalData && data.isFiscal) {
      printSpacer();

      const qrBuffer = await QRCode.toBuffer(data.fiscalData.qrUrl, {
        width: 170,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      const qrImg = await loadImage(qrBuffer);
      ctx.drawImage(qrImg, (width - 170) / 2, cursorY);
      cursorY += 180;

      ctx.textAlign = "center";
      ctx.font = "18px 'Courier New', monospace";
      ctx.fillText(`CAE: ${data.fiscalData.cae}`, width / 2, cursorY);
      cursorY += lineHeight;
      ctx.fillText(`Vto. CAE: ${data.fiscalData.caeVto}`, width / 2, cursorY);
      cursorY += lineHeight;
    }

    printSpacer();

    // 6. Pie Comercial
    ctx.textAlign = "center";
    ctx.font = "18px 'Courier New', monospace";
    ctx.fillText("Take away", width / 2, cursorY);
    cursorY += lineHeight;
    ctx.fillText("11 7891-4632", width / 2, cursorY);
    cursorY += lineHeight * 1.5;

    // Fecha / Hora a la izquierda y #Ticket a la derecha
    const now = new Date();
    const fechaHora = `${now.toLocaleDateString("es-AR")}, ${now.toLocaleTimeString("es-AR")}`;
    ctx.textAlign = "left";
    ctx.fillText(fechaHora, padding, cursorY);

    ctx.textAlign = "right";
    ctx.fillText(
      `#${data.orderNumber.toString().padStart(4, "0")}`,
      rightMargin,
      cursorY,
    );
    cursorY += lineHeight * 1.8;

    // Línea de corte
    ctx.save();
    ctx.strokeStyle = "#999999";
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(padding, cursorY);
    ctx.lineTo(rightMargin, cursorY);
    ctx.stroke();
    ctx.restore();
    cursorY += lineHeight * 1.2;

    // 7. Comanda de cocina
    ctx.textAlign = "center";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillText(
      `${data.customer.toUpperCase()} #${data.orderNumber.toString().padStart(4, "0")}`,
      width / 2,
      cursorY,
    );
    cursorY += lineHeight * 1.5;

    ctx.textAlign = "left";
    ctx.font = "bold 20px 'Courier New', monospace";
    Object.values(groupedItems)
      .filter((i) => !!i.code)
      .forEach((item) => {
        ctx.fillText(`${item.quantity}  ${item.code}`, padding + 15, cursorY);
        cursorY += lineHeight;
      });

    // 8. Crop final dinámico del canvas
    const finalHeight = cursorY + padding;
    const finalCanvas = createCanvas(width, finalHeight);
    const finalCtx = finalCanvas.getContext("2d");
    finalCtx.drawImage(canvas, 0, 0);

    const imageBuffer = finalCanvas.toBuffer("image/jpeg");

    fs.writeFileSync(
      outputPath || `${data.isFiscal ? "fiscal" : "non-fiscal"}-ticket.jpg`,
      imageBuffer,
    );

    return imageBuffer;
  }
}
