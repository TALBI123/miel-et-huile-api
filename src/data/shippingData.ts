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
    basePrice: 4.9,
    pricePerKg: 1.0,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 2,
    estimatedMaxDays: 4,
  },
  {
    zoneId: "zone_france",
    methodId: "method_express",
    carrier: "Chronopost",
    basePrice: 9.9,
    pricePerKg: 2.0,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 1,
    estimatedMaxDays: 2,
  },
  {
    zoneId: "zone_france",
    methodId: "method_pickup",
    carrier: "Mondial Relay",
    basePrice: 3.5,
    pricePerKg: 0.8,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 3,
    estimatedMaxDays: 5,
  },
  // Europe
  {
    zoneId: "zone_europe",
    methodId: "method_standard",
    carrier: "La Poste Europe",
    basePrice: 8.9,
    pricePerKg: 1.5,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 3,
    estimatedMaxDays: 7,
  },
  {
    zoneId: "zone_europe",
    methodId: "method_express",
    carrier: "DHL Express",
    basePrice: 19.9,
    pricePerKg: 2.5,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 1,
    estimatedMaxDays: 3,
  },
  // International
  {
    zoneId: "zone_international",
    methodId: "method_standard",
    carrier: "La Poste International",
    basePrice: 14.9,
    pricePerKg: 3.0,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 7,
    estimatedMaxDays: 15,
  },
  {
    zoneId: "zone_international",
    methodId: "method_express",
    carrier: "FedEx",
    basePrice: 29.9,
    pricePerKg: 4.5,
    minWeight: 0,
    maxWeight: 20,
    estimatedMinDays: 3,
    estimatedMaxDays: 7,
  },
];
