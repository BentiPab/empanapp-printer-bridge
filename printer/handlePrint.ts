import path from "path";
import fs from "fs";
import { TicketData } from "./types";
import {
  ThermalPrinter,
  PrinterTypes,
  CharacterSet,
} from "node-thermal-printer";
import { priceParser } from "./utils";
const ANCHO_TICKET = 41;
const SPACER = "-".repeat(Math.max(1, ANCHO_TICKET));

const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.100";
const PRINTER_PORT = process.env.PRINTER_PORT || "9100";

const formatLine = (
  leftLine: string,
  rightLine: string,
  charAmount?: number,
) => {
  const charQty = charAmount || ANCHO_TICKET;
  const availableSpaces = charQty - leftLine.length - rightLine.length;

  const fillingSpaces = " ".repeat(Math.max(1, availableSpaces));

  return leftLine + fillingSpaces + rightLine;
};

export async function printTicket(data: TicketData) {
	
 const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}`,
    characterSet: CharacterSet.WPC1252, // Para tildes y Ñ
    removeSpecialCharacters: false,
  });
  
  const isConnected = await printer.isPrinterConnected();
  if (!isConnected) {
    throw new Error("La impresora no responde");
  }
  printer.alignCenter();

  try {
    // Armamos la ruta absoluta hacia el archivo del logo
    const logoPath = path.join(process.cwd(), "public", "logo_negro.png");

    if (fs.existsSync(logoPath)) {
      // Leemos el archivo y lo transformamos en un buffer/string que la librería procesa al toque
      await printer.printImage(logoPath);
      await printer.execute();
      printer.clear();
    } else {
      console.error("El archivo del logo no existe en la ruta:", logoPath);
    }
  } catch (imageError) {
    // Si falla el logo (por ejemplo si borran el archivo), el ticket sale igual
    console.error(
      "No se pudo cargar el logo, imprimiendo solo texto:",
      imageError,
    );
    printer.newLine();
    printer.setTextDoubleHeight();
    printer.println("EMPANÁ"); // Nombre de fantasía
    printer.setTextNormal();
  }

  // --- DISEÑO DEL TICKET ---
  printer.println("¡GRACIAS POR SU COMPRA!"); // Teléfono
  printer.println(SPACER);

  printer.alignLeft();
  printer.println(`Empleado: ${data.employeeName || "RECEPCIÓN"}`);
  printer.println(`TPV: ${data.terminalId || "TPV 1"}`);
  printer.println(`Cliente: ${data.customer || "TPV 1"}`);
  printer.alignCenter();
  printer.println(SPACER);
  printer.alignLeft();
const groupedItems: Record<string, TicketData["items"][number]> = {};

data.items.forEach((item: any) => {
  if (groupedItems[item.code]) {
    // Si ya existe el código, sumamos la cantidad
    groupedItems[item.code].quantity += item.quantity;
  } else {
    // Si no existe, creamos una copia para no mutar los datos originales
    groupedItems[item.code] = { ...item };
  }
});
  // Detalle de Items
  Object.values(groupedItems).forEach((item: any) => {
    printer.alignLeft();
    printer.println(`${item.name}`); // Nombre arriba libre

    const line = formatLine(
      `${item.quantity} x ${priceParser(item.price)}`,
      `${priceParser(item.price * item.quantity)}`,
    );
    printer.println(line);
  });
  if (data.discountAmount > 0) {
    const discountLine = formatLine(
      "Descuentos aplicados",
      `- ${priceParser(data.discountAmount)}`,
    );
    printer.println(discountLine);
  }

  // El ancho estándar de caracteres por línea en EPSON (Font A) suele ser 42
  printer.alignCenter();
  printer.println(SPACER);
  printer.alignLeft();
  printer.setTextDoubleHeight();
  printer.setTextDoubleWidth();

  const totalLine = formatLine("Total", `${priceParser(data.total)}`, 20);
  printer.println(totalLine);
  printer.setTextNormal();

  const cashLine = formatLine(
    "Efectivo -10%",
    `${priceParser(data.total * 0.9)}`,
  );
  printer.println(cashLine);

  printer.alignCenter();
  printer.println(SPACER);

  printer.newLine();
  printer.println("Take away");
  printer.println("11 7891-4632");

  printer.newLine();

  printer.alignLeft();
  printer.println(`${new Date().toLocaleString()}`);
  printer.alignRight();
  printer.println(`#${data.orderNumber.toString().padStart(4, "0")}`); // Número de orden/ticket

  printer.cut();

  printer.alignCenter();
  printer.setTextSize(3, 3);
  printer.println(
    `${data.customer.toUpperCase()} #${data.orderNumber.toString().padStart(4, "0")}`,
  );

  Object.values(groupedItems)
    .filter((i) => !!i.code)
    .forEach((item: TicketData["items"][number]) => {
      printer.alignLeft();
      printer.println(`${item.quantity} ${item.code}`); // Nombre arriba libre
    });
  printer.cut();
  try {
    await printer.execute();
    return { success: true };
  } catch (error) {
    console.error("Error de impresión:", error);
    return { success: false, message: "Printer Error" };
  }
}
