import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import "dotenv/config";
import PrintRoutes from "./routes/print.router";

class App {
  private static instance: App;
  public app: express.Express;
  private port: number = Number(process.env.PORT) || 3001;

  constructor() {
    this.app = express();
    this.setMiddlewares();
    this.setRoutes();
    this.setErrorHandling();
    this.start();
  }

  private setMiddlewares = (): void => {
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(express.json());

    const allowedOrigins = [
      "https://www.empana.com.ar",
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:5173",
    ].filter(Boolean) as string[];

    this.app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new Error("Bloqueado por política CORS"));
        },
        methods: ["POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "ngrok-skip-browser-warning"],
        credentials: true,
        optionsSuccessStatus: 200,
      }),
    );
  };

  private setRoutes = (): void => {
    this.app.get("/health", (_req: Request, res: Response) => {
      res
        .status(200)
        .json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Mantenemos la ruta exacta que ya consume tu frontend
    this.app.use("/api/printer", new PrintRoutes().router);
  };

  private setErrorHandling = (): void => {
    this.app.use(
      (err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error("❌ Excepción no capturada:", err.message);
        res.status(500).json({
          success: false,
          error: err.message || "Error interno del servidor",
        });
      },
    );
  };

  public start(): void {
    this.app.listen(this.port, () => {
      console.info(`🚀 Printer Bridge corriendo en el puerto ${this.port}`);
    });
  }

  public static getInstance(): App {
    if (!App.instance) {
      App.instance = new App();
    }
    return App.instance;
  }
}

App.getInstance();

export default App;
