import {
  shippingMethods,
  shippingRates,
  shippingZones,
} from "../data/shippingData";
import prisma from "../config/db";

const main = async () => {
  // -----------------------------
  // 📌 Shipping Zones (réelles)
  // -----------------------------
  // console.log("📦 Insertion des zones de livraison…");
  // await prisma.shippingZone.createMany({ data: shippingZones });
  // console.log(`${shippingZones.length} zones de livraison insérées.`);
  // console.log("➡️  Étape 2 terminée : Zones OK\n");

  // // -----------------------------
  // // 📦 Shipping Methods (réelles)
  // // -----------------------------
  // console.log("📦 Insertion des méthodes de livraison…");
  // await prisma.shippingMethod.createMany({ data: shippingMethods });
  // console.log(`${shippingMethods.length} méthodes de livraison insérées.`);
  // console.log("➡️  Étape 3 terminée : Méthodes OK\n");

  // -----------------------------
  // 📦 Shipping Rates (réelles) |
  // ----------------------------- 

  console.log("📦 Insertion des tarifs de livraison…");
  await prisma.shippingRate.createMany({ data: shippingRates });
  console.log(`${shippingRates.length} tarifs de livraison insérés.`);
  console.log("➡️  Étape 4 terminée : Tarifs OK\n");
};
main();