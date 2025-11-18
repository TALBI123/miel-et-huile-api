import { ShippingService } from "../../services/shipping.service";
import prisma from "../../config/db";

describe("Shipping Service Tests", () => {
  it("should calculate shipping cost based on country and weight", async () => {
    // Mock data
    const country = "FR";
    const weight = 10; // in kg

    const cost = await ShippingService.calculateShippingCost(country, weight);
    expect(cost).toBeDefined();
    expect(cost).toBeGreaterThan(0);
  });
});