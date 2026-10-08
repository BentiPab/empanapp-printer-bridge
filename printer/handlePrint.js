"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.printTicket = printTicket;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_thermal_printer_1 = require("node-thermal-printer");
const utils_1 = require("./utils");
const ANCHO_TICKET = 41;
const SPACER = "-".repeat(Math.max(1, ANCHO_TICKET));
const PRINTER_IP = process.env.PRINTER_IP || "192.168.1.100";
const PRINTER_PORT = process.env.PRINTER_PORT || "9100";
const formatLine = (leftLine, rightLine, charAmount) => {
    const charQty = charAmount || ANCHO_TICKET;
    const availableSpaces = charQty - leftLine.length - rightLine.length;
    const fillingSpaces = " ".repeat(Math.max(1, availableSpaces));
    return leftLine + fillingSpaces + rightLine;
};
async function printTicket(data) {
    const printer = new node_thermal_printer_1.ThermalPrinter({
        type: node_thermal_printer_1.PrinterTypes.EPSON,
        interface: `tcp://${PRINTER_IP}`,
        characterSet: node_thermal_printer_1.CharacterSet.WPC1252, // Para tildes y Ñ
        removeSpecialCharacters: false,
    });
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        throw new Error("La impresora no responde");
    }
    printer.alignCenter();
    try {
        // Armamos la ruta absoluta hacia el archivo del logo
        const logoPath = path_1.default.join(process.cwd(), "public", "logo_negro.png");
        if (fs_1.default.existsSync(logoPath)) {
            // Leemos el archivo y lo transformamos en un buffer/string que la librería procesa al toque
            await printer.printImage(logoPath);
            await printer.execute();
            printer.clear();
        }
        else {
            console.error("El archivo del logo no existe en la ruta:", logoPath);
        }
    }
    catch (imageError) {
        // Si falla el logo (por ejemplo si borran el archivo), el ticket sale igual
        console.error("No se pudo cargar el logo, imprimiendo solo texto:", imageError);
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
    // Detalle de Items
    data.items.forEach((item) => {
        printer.alignLeft();
        printer.println(`${item.name}`); // Nombre arriba libre
        const line = formatLine(`${item.quantity} x ${(0, utils_1.priceParser)(item.price)}`, `${(0, utils_1.priceParser)(item.price * item.quantity)}`);
        printer.println(line);
    });
    if (data.discountAmount > 0) {
        const discountLine = formatLine("Descuentos aplicados", `- ${(0, utils_1.priceParser)(data.discountAmount)}`);
        printer.println(discountLine);
    }
    // El ancho estándar de caracteres por línea en EPSON (Font A) suele ser 42
    printer.alignCenter();
    printer.println(SPACER);
    printer.alignLeft();
    printer.setTextDoubleHeight();
    printer.setTextDoubleWidth();
    const totalLine = formatLine("Total", `${(0, utils_1.priceParser)(data.total)}`, 20);
    printer.println(totalLine);
    printer.setTextNormal();
    const cashLine = formatLine("Efectivo -10%", `${(0, utils_1.priceParser)(data.total * 0.9)}`);
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
    printer.println(`${data.customer.toUpperCase()} #${data.orderNumber.toString().padStart(4, "0")}`);
    data.items
        .filter((i) => !!i.code)
        .forEach((item) => {
        printer.alignLeft();
        printer.println(`${item.quantity} ${item.code}`); // Nombre arriba libre
    });
    printer.cut();
    try {
        await printer.execute();
        return { success: true };
    }
    catch (error) {
        console.error("Error de impresión:", error);
        return { success: false, message: "Printer Error" };
    }
}
