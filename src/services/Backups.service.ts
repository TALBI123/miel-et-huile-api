import { ALLOWED_FILTERING_TABLES } from "../data/allowedNames";
import prisma from "../config/db";
import path from "path";
import fs from "fs";

interface OldOrder {
  id: string;
  userId: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  paymentMethod: string;
  notes: string | null;
}

interface NewOrder extends OldOrder {
  // 🔹 Informations de livraison
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingCountry: string | null;
  shippingZipCode: string | null;

  // 🔹 Méthode et contact de livraison
  shippingPhone: string | null;
  shippingMethod: string | null;
  shippingProvider: string | null;

  // 🔹 Suivi et tracking
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;

  // 🔹 Intégration Packlink
  packlinkShipmentId: string | null;
}

export class BackupsService {
  private static ALLTABLES: string[] = [
    "user",
    "category",
    "product",
    "productImage",
    "productVariant",
    "order",
    "orderItem",
  ];
  private static restoringDate = "2025-10-27";
  static async getAllItems(tabName: keyof typeof prisma) {
    const data = await (prisma as any)[tabName].findMany();
    // console.log(`Backup - ${tabName}:`, data.length, 'items found');
    // console.log(data)
    return data;
  }
  static async saveBackupToFile() {
    if (process.env.NODE_ENV === "development") {
      console.log("Backup skipped in development mode.");
      return;
    }
    const backupDir = path.join(__dirname, "../../backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);
    for (const table of this.ALLTABLES) {
      const data = await this.getAllItems(table as keyof typeof prisma);
      const filePath = path.join(
        backupDir,
        `${table}_backup_${new Date().toISOString().split("T")[0]}.json`
      );
      if (fs.existsSync(filePath)) {
        console.log(
          `Backup for table ${table} already exists at ${filePath}, skipping...`
        );
        continue;
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Backup saved for table ${table} at ${filePath}`);
    }
  }
  static async restoreBackupFromFile() {
    const backupDir = path.join(__dirname, "../../backups");
    console.log("Restoring backups from directory:", backupDir);
    try {
      for (const table of this.ALLTABLES) {
        const data = await this.getAllItems(table as keyof typeof prisma);
        if (data.length) {
          console.log(" Table", table, "is not empty, skipping restoration.");
          continue; // Skip if table is not empty
        }
        const filePath = path.join(
          backupDir,
          `${table}_backup_${this.restoringDate}.json`
        );
        if (!fs.existsSync(filePath)) {
          console.log(
            `No backup file found for table ""${table}"" at ${filePath}, skipping...`
          );
          continue;
        }
        const fileData = fs.readFileSync(filePath, "utf-8");
        console.log(
          JSON.parse(fileData).length,
          " items to restore for table ",
          table
        );
        //   console.log(JSON.parse(fileData));
        const jsonData = JSON.parse(fileData);
        await (prisma as any)[table].createMany({
          data: jsonData,
        });
        console.log(`Restoring backup for table ${table} from ${filePath}`);
        //   break;
      }
    } catch (err) {
      console.log("Error during backup restoration:", err);
    }
  }
  static  migrateOrderBackup() {
    const backupPath = path.join(
      __dirname,
      `../../backups/order_backup_${this.restoringDate}.json`
    );
    const outputPath = path.join(
      __dirname,
      `../../backups/order_backup_migrated_${this.restoringDate}.json`
    );
    if (!fs.existsSync(backupPath)) {
      console.log("Backup file not found at", backupPath);
      return;
    }
   try{
     const fileData = fs.readFileSync(backupPath, "utf-8");
    const oldOrders: OldOrder[] = JSON.parse(fileData);
    const newOrders: NewOrder[] = oldOrders.map((order, index) => {
      const isConfirmedOrder =
        order.status === "CONFIRMED" && order.paymentStatus === "PAID";
      return {
        ...order,
        shippingAddress: isConfirmedOrder
          ? `123 Rue Example ${index + 1}`
          : null,
        shippingCity: isConfirmedOrder ? "Paris" : null,
        shippingCountry: isConfirmedOrder ? "FR" : null,
        shippingZipCode: isConfirmedOrder ? "75001" : null,
        shippingPhone: isConfirmedOrder ? "+33123456789" : null,
        shippingMethod: isConfirmedOrder ? "Standard" : null,
        shippingProvider: isConfirmedOrder ? "La Poste" : null,
        trackingNumber: isConfirmedOrder ? `LX${Date.now()}${index}FR` : null,
        trackingUrl: isConfirmedOrder
          ? `https://www.laposte.fr/outils/suivre-vos-envois?code=LX${Date.now()}${index}FR`
          : null,
        shippedAt: isConfirmedOrder
          ? new Date(Date.now() + 3600000).toISOString()
          : null, // +1 heure
        deliveredAt: isConfirmedOrder
          ? new Date(Date.now() + 86400000 * 2).toISOString()
          : null, // +2 jours
        packlinkShipmentId: null,
      };
    });
    // sauvegarde du nouveau fichier
    fs.writeFileSync(backupPath, JSON.stringify(newOrders, null, 2));
    console.log("✅ Migration terminée avec succès !");
    console.log(`📁 Fichier migré sauvé : ${backupPath}`);
    console.log(`📊 ${newOrders.length} commandes migrées`);

  }catch(err){
    console.log("Error during order migration:", err);
   }
  }
}
