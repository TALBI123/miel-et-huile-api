import {
  shippingMethods,
  shippingRates,
  shippingZones,
} from "../data/shippingData";
import prisma from "../config/db";

const main = async () => {
  // -----------------------------
  // 📌 Shipping Zones (réelles)
  console.log("📦 Insertion des zones de livraison…");
  await prisma.shippingZone.createMany({ data: shippingZones });
  console.log(`${shippingZones.length} zones de livraison insérées.`);
  // console.log("➡️  Étape 2 terminée : Zones OK\n");

  // // -----------------------------
  // // 📦 Shipping Methods (réelles)
  // // -----------------------------
  console.log("📦 Insertion des méthodes de livraison…");
  await prisma.shippingMethod.createMany({ data: shippingMethods });
  console.log(`${shippingMethods.length} méthodes de livraison insérées.`);
  console.log("➡️  Étape 3 terminée : Méthodes OK\n");

  // -----------------------------
  // 📦 Shipping Rates (réelles) |
  // ----------------------------- 

  console.log("📦 Insertion des tarifs de livraison…");
  await prisma.shippingRate.createMany({ data: shippingRates });
  console.log(`${shippingRates.length} tarifs de livraison insérés.`);
  console.log("➡️  Étape 4 terminée : Tarifs OK\n");
};
// main();
const print = async () => {
  // -----------------------------
  // 📌 Shipping Zones (réelles)
  console.log("📦 Aff ichage des zones de livraison…");
const shippingZone =   await prisma.shippingZone.findMany();
  console.log(`${shippingZones.length} zones de livraison insérées.`);
  console.table(shippingZone);
  // console.log("➡️  Étape 2 terminée : Zones OK\n");

  // // -----------------------------
  // // 📦 Shipping Methods (réelles)
  // // -----------------------------
  console.log("📦 Affichage des méthodes de livraison…");
  const shippingMethod = await prisma.shippingMethod.findMany();
  console.log(`${shippingMethod.length} méthodes de livraison insérées.`);
  console.table(shippingMethod);
  console.log("➡️  Étape 3 terminée : Méthodes OK\n");

  // -----------------------------
  // 📦 Shipping Rates (réelles) |
  // ----------------------------- 

  console.log("📦 Affichage des tarifs de livraison…");
  const shippingRate = await prisma.shippingRate.findMany();
  console.log(`${shippingRate.length} tarifs de livraison insérés.`);
  console.table(shippingRate);
  console.log("➡️  Étape 4 terminée : Tarifs OK\n");
};
print()