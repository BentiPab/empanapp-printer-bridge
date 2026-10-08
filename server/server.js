"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const handlePrint_1 = require("../printer/handlePrint");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/print', async (req, res) => {
    const sale = req.body;
    try {
        const printRes = await (0, handlePrint_1.printTicket)(sale);
        if (!printRes.success) {
            return res.status(500).json({ success: false, error: printRes.message });
        }
        return res.status(200).json({ message: "Printing confirmed!" });
    }
    catch (error) {
        console.error("Error en el puente de impresión:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
app.listen(3001, () => {
    console.log('🚀 Puente de Impresión Empanapp corriendo en http://localhost:3001');
});
