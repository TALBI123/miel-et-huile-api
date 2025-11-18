import prisma from "../config/db";
import { PacklinkService } from "./packlink.service";

interface ShippingAddress {
  address: string;
  city: string;
  country: string;
  zipCode: string;
  phone?: string;
  name?: string;
  email?: string;
}

interface ShippingOption {
  provider: "ShippingZone" | "Packlink";
  method: string;
  price: number;
  delivery_time?: string;
  serviceId?: string;
  shipmentId?: string;
}

interface Package {
  weight: number;
  width?: number;
  height?: number;
  length?: number;
}

export class ShippingService {
  // Calcule le coût de livraison selon la zone géographique
  static async calculateShippingCost(
    country: string,
    weight: number
  ): Promise<ShippingOption[]> {
    try {
      // Chercher la zone de livraison active pour le pays
      const shippingRates = await prisma.shippingRate.findMany({
        where: {
          minWeight: { lte: weight },
          maxWeight: { gte: weight },
          method: {
            isActive: true,
          },
        },
        include: {
          method: true,
          zone: true,
        },
      });
      console.log("Shipping zones found:");

      if (!shippingRates.length) {
        throw new Error(
          `Pas de zone de livraison disponible pour le pays: ${country}`
        );
      }

      // Prix fixe par zone pour le moment, à améliorer avec calcul au poids
      return shippingRates.map((rate) => ({
        id : rate.id,
        provider: "ShippingZone",
        carrier : rate.carrier,
        method: rate.method.name,
        delivery_time: `${rate.estimatedMinDays} - ${rate.estimatedMaxDays} jours`,
        min_max:`${rate.minWeight}kg - ${rate.maxWeight}kg`,
        price: rate.fixedPrice ?? rate.basePrice + rate.pricePerKg! * weight,
        // currency: "EUR",
      }));
    } catch (error: any) {
      console.error("Erreur calcul shipping cost:", error.message);
      throw error;
    }
  }

  // Récupère toutes les zones de livraison actives
  static async getShippingZones() {
    try {
      const zones = await prisma.shippingZone.findMany({
        where: {
          isActive: true,
        },
      });

      return zones;
    } catch (error: any) {
      console.error("Erreur récupération zones:", error.message);
      throw error;
    }
  }

  // Valide les champs requis d'une adresse de livraison
  static validateShippingAddress(address: ShippingAddress): boolean {
    const required = ["address", "city", "country", "zipCode"];

    for (const field of required) {
      if (!address[field as keyof ShippingAddress]) {
        throw new Error(`Champ requis manquant: ${field}`);
      }
    }

    // Format ISO requis
    if (address.country.length !== 2) {
      throw new Error(
        "Le code pays doit être au format ISO 2 lettres (ex: FR, DE, ES)"
      );
    }

    return true;
  }

  // Retourne les options de livraison disponibles (zones + Packlink si configuré)
  static async getShippingOptions(
    country: string,
    weight: number,
    address?: ShippingAddress,
    packages?: Package[]
  ): Promise<ShippingOption[]> {
    try {
      const options: ShippingOption[] = [];

      // Ajout des options ShippingZone (disponibles par défaut)
      try {
        const zonePrice = await this.calculateShippingCost(country, weight);
        options.push(...zonePrice);
      } catch (error: any) {
        console.warn("ShippingZone non disponible:", error.message);
      }

      // Ajout des options Packlink si API configurée
      if (process.env.PACKLINK_API_KEY && address && packages) {
        try {
          const packlinkRates = await this.getPacklinkRates(address, packages);
          options.push(...packlinkRates);
        } catch (error: any) {
          console.warn("Packlink non disponible:", error.message);
        }
      }

      if (options.length === 0) {
        throw new Error("Aucune option de livraison disponible");
      }

      return options;
    } catch (error: any) {
      console.error("Erreur récupération options:", error.message);
      throw error;
    }
  }

  // Récupère les tarifs Packlink pour une destination donnée
  static async getPacklinkRates(
    toAddress: ShippingAddress,
    packages: Package[]
  ): Promise<ShippingOption[]> {
    try {
      // Config expéditeur depuis env
      // const fromAddress = {
      //   name: process.env.PACKLINK_SENDER_NAME || "Miel Eco",
      //   address: process.env.PACKLINK_SENDER_ADDRESS || "",
      //   city: process.env.PACKLINK_SENDER_CITY || "",
      //   postal_code: process.env.PACKLINK_SENDER_ZIP || "",
      //   country: process.env.PACKLINK_SENDER_COUNTRY || "FR",
      //   email: process.env.PACKLINK_SENDER_EMAIL || "",
      //   phone: process.env.PACKLINK_SENDER_PHONE || "",
      // };

      const toPacklinkAddress = {
        name: toAddress.name || "Client",
        address: toAddress.address,
        city: toAddress.city,
        postal_code: toAddress.zipCode,
        country: toAddress.country,
        email: toAddress.email || "",
        phone: toAddress.phone || "",
      };

      // Format packages pour l'API
      const packlinkPackages = packages.map((pkg) => ({
        weight: pkg.weight,
        width: pkg.width || 10,
        height: pkg.height || 10,
        length: pkg.length || 10,
      }));

      // Création du devis
      const draft = await PacklinkService.createShipmentDraft(
        toPacklinkAddress,
        packlinkPackages
      );

      // Récup des services dispo
      if (draft.id) {
        const services = await PacklinkService.getShippingRates(draft.id);

        // Mapping vers notre format
        return services.map((service: any) => ({
          provider: "Packlink" as const,
          method: service.name || service.carrier_name || "Express",
          price: service.total_price || service.price,
          estimatedDays: service.delivery_time || 3,
          serviceId: service.id,
          shipmentId: draft.id,
        }));
      }

      return [];
    } catch (error: any) {
      console.error("Erreur Packlink rates:", error.message);
      throw error;
    }
  }

  // Crée une expédition Packlink et met à jour la commande
  static async createPacklinkShipment(
    orderId: string,
    shipmentId: string,
    serviceId: string
  ) {
    try {
      // Réservation de l'envoi
      const booking = await PacklinkService.bookShipment(shipmentId, serviceId);

      // Update de la commande
      await prisma.order.update({
        where: { id: orderId },
        data: {
          packlinkShipmentId: shipmentId,
          trackingNumber: booking.tracking_number || booking.reference,
          trackingUrl: booking.tracking_url,
          shippingProvider: "Packlink",
          status: "PROCESSING",
        },
      });

      return booking;
    } catch (error: any) {
      console.error("Erreur création expédition Packlink:", error.message);
      throw error;
    }
  }

  // Récupère les infos de tracking d'une commande
  static async getTrackingInfo(trackingNumber: string) {
    try {
      // Recherche de la commande
      const order = await prisma.order.findFirst({
        where: {
          trackingNumber,
        },
        select: {
          id: true,
          trackingNumber: true,
          trackingUrl: true,
          status: true,
          shippedAt: true,
          deliveredAt: true,
          shippingProvider: true,
          packlinkShipmentId: true,
        },
      });

      if (!order) {
        throw new Error("Commande introuvable");
      }

      // Statut live si expédié via Packlink
      if (order.shippingProvider === "Packlink" && order.packlinkShipmentId) {
        try {
          const packlinkTracking = await PacklinkService.getTrackingStatus(
            order.packlinkShipmentId
          );

          return {
            ...order,
            liveTracking: packlinkTracking,
          };
        } catch (error) {
          console.warn(
            "Impossible de récupérer le tracking Packlink en temps réel"
          );
        }
      }

      return order;
    } catch (error: any) {
      console.error("Erreur récupération tracking:", error.message);
      throw error;
    }
  }

  // Sélectionne l'option la moins chère parmi les disponibles
  static selectBestRate(rates: ShippingOption[]): ShippingOption {
    if (rates.length === 0) {
      throw new Error("Aucune option disponible");
    }

    // Tri par prix et retour de la moins chère
    const sortedByPrice = [...rates].sort((a, b) => a.price - b.price);
    return sortedByPrice[0];
  }
}
