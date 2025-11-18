import prisma from "../config/db";
interface ShippingRate {
  zoneId: string;
  methodId: string;
  carrier?: string;
  basePrice: number;
  pricePerKg?: number;
  minWeight?: number;
  maxWeight?: number;
  fixedPrice?: number;

  estimatedMinDays?: number;
  estimatedMaxDays?: number;
}

export class ShippingRateService {
  static create(data: ShippingRate) {
    return prisma.shippingRate.create({ data });
  }

  static update(id: string, data: ShippingRate) {
    return prisma.shippingRate.update({ where: { id }, data });
  }

  static delete(id: string) {
    return prisma.shippingRate.delete({ where: { id } });
  }

  static findForZone(zoneId: string) {
    return prisma.shippingRate.findMany({ where: { zoneId } });
  }
}
