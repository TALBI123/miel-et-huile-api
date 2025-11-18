export const shippingZones = [
  {
    id: "zone_france",
    name: "France",
    countries: ["FR"],
    isActive: true,
  },
  {
    id: "zone_europe",
    name: "Europe",
    countries: ["FR", "ES", "DE", "BE", "NL", "IT", "PT", "LU", "AT"],
    isActive: true,
  },
  {
    id: "zone_international",
    name: "International",
    countries: ["US", "CA", "UK", "CH", "AE", "MA"],
    isActive: true,
  },
];

export const shippingMethods = [
  {
    id: "method_standard",
    name: "Standard",
    description: "Livraison économique",
  },
  {
    id: "method_express",
    name: "Express",
    description: "Livraison rapide 24-48h",
  },
  {
    id: "method_pickup",
    name: "Pickup Point",
    description: "Livraison en point relais",
  },
];
export const shippingRates = [
  // France
  {
    zoneId: "zone_france",
    methodId: "method_standard",
    carrier: "La Poste",
    basePrice: 5.4,
    pricePerKg: 1.2,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 2,
    estimatedMaxDays: 4,
  },
  {
    zoneId: "zone_france",
    methodId: "method_express",
    carrier: "Chronopost",
    basePrice: 14.0,
    pricePerKg: 3.0,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 1,
    estimatedMaxDays: 2,
  },
  {
    zoneId: "zone_france",
    methodId: "method_pickup",
    carrier: "Mondial Relay",
    basePrice: 4.4,
    pricePerKg: 0.9,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 3,
    estimatedMaxDays: 5,
  },

  // Europe
  {
    zoneId: "zone_europe",
    methodId: "method_standard",
    carrier: "Colissimo International",
    basePrice: 13.0,
    pricePerKg: 3.5,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 3,
    estimatedMaxDays: 7,
  },
  {
    zoneId: "zone_europe",
    methodId: "method_express",
    carrier: "DHL Express",
    basePrice: 28.0,
    pricePerKg: 5.5,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 1,
    estimatedMaxDays: 3,
  },

  // International
  {
    zoneId: "zone_international",
    methodId: "method_standard",
    carrier: "La Poste International",
    basePrice: 25.0,
    pricePerKg: 6.0,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 7,
    estimatedMaxDays: 15,
  },
  {
    zoneId: "zone_international",
    methodId: "method_express",
    carrier: "FedEx",
    basePrice: 45.0,
    pricePerKg: 8.0,
    minWeight: 0,
    maxWeight: 5,
    estimatedMinDays: 3,
    estimatedMaxDays: 7,
  },
];
