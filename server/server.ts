import express from 'express';
import cors from 'cors';
import { printTicket } from "../printer/handlePrint";


const app = express();
app.use(cors()); 
app.use(express.json());

app.post('/print', async (req, res) => {
  const sale = req.body;
    try {

      const printRes = await printTicket(sale)
      if (!printRes.success) {
        res.status(500).json({ success: false, error: printRes.message });
      } 
      res.status(200).json({message: "Printing confirmed!"})
  } catch (error) {
    console.error("Error en el puente de impresión:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.listen(3001, () => {
  console.log('🚀 Puente de Impresión Empanapp corriendo en http://localhost:3001');
});