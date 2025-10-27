import { ALLOWED_FILTERING_TABLES } from "../data/allowedNames";
import prisma from "../config/db";
import path from "path";
import fs from "fs";
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
    for (const table of this.ALLTABLES) {
      const filePath = path.join(
        backupDir,
        `${table}_backup_${new Date().toISOString().split("T")[0]}.json`
      );
      if (!fs.existsSync(filePath)) {
        console.log(
          `No backup file found for table ${table} at ${filePath}, skipping...`
        );
        continue;
      }
        const fileData = fs.readFileSync(filePath, "utf-8");
        console.log(JSON.parse(fileData).length, " items to restore for table ", table);
        console.log(JSON.parse(fileData));
        console.log(`Restoring backup for table ${table} from ${filePath}`);
        break;
    }
  }
}
