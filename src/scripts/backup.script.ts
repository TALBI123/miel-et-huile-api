import { BackupsService } from "../services/Backups.service";
async function getBackupData() {
  console.log("🔄 Démarrage de la sauvegarde des données...");
  // await BackupsService.saveBackupToFile();
    await BackupsService.restoreBackupFromFile();
    console.log("✅ Sauvegarde des données terminée.");
}
//   BackupsService.migrateOrderBackup();
getBackupData();
