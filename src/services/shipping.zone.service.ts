import prisma from "../config/db";
interface ShippingZone {
  name: string;
  countries: string[];
  isActive: boolean;
}
export class ShippingZoneService {
  static async create(data: ShippingZone) {
    try {
      // Logic to create a shipping zone

      const newZone = await prisma.shippingZone.create({
        data,
      });
      return newZone;
    } catch (err: any) {
      console.error("Erreur création zone d'expédition:", err.message);
      throw err;
    }
  }
  static async update(){
    
  }
}
