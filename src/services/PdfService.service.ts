import fs from "fs";
import path from "path";

export class PdfService {
  private static instance: PdfService;
  private constructor() {
    
  }
  public static getInstance(): PdfService {
    if (!this.instance) this.instance = new PdfService();
    return this.instance;
  }
}
