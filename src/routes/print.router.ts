import { Router } from "express";
import { PrintController } from "../controllers/print.controller";

export default class PrintRoutes {
  public router: Router;
  public printController: PrintController;

  constructor() {
    this.router = Router();
    this.printController = new PrintController();
    this.routes();
  }

  private routes(): void {
    this.router.post("/print", this.printController.printTicket);
  }
}
