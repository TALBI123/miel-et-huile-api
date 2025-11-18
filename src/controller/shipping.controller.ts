import { ShippingService } from "../services/shipping.service";
import { PacklinkService } from "../services/packlink.service";
import { Request, Response } from "express";
import { handleServerError } from "../utils/helpers";
import prisma from "../config/db";
import { ProductValidationService } from "../services/product-validation.service";

// GET /api/shipping/zones - Liste des zones de livraison
export const getShippingZones = async (req: Request, res: Response) => {
  try {
    const zones = await ShippingService.getShippingZones();

    return res.status(200).json({
      success: true,
      data: zones,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

// POST /api/shipping/calculate - Calcul du coût de livraison
export const calculateShipping = async (req: Request, res: Response) => {
  try {
    const { country, weight } = req.body;

    if (!country || !weight) {
      return res.status(400).json({
        success: false,
        message: "Pays et poids requis",
      });
    }

    const shippingCost = await ShippingService.calculateShippingCost(
      country.toUpperCase(),
      weight
    );

    return res.status(200).json({
      success: true,
      data: {
        country,
        weight,
        shippingCost,
      },
    });
  } catch (err: any) {
    if (err.message.includes("Pas de zone de livraison")) {
      return res.status(404).json({
        success: false,
        message: err.message,
      });
    }
    handleServerError(res, err);
  }
};

// POST /api/shipping/options - Options de livraison complètes
export const getShippingOptions = async (req: Request, res: Response) => {
  const { items, shippingAddress } = res.locals.validated;
  // console.log("Getting shipping options for address:", shippingAddress);
  try {
    const options = await ProductValidationService.validateItems(items);
    if (!options.success) {
      return res.status(400).json({
        success: false,
        message: options.message,
        data: options.data,
      });
    }
    const shippingOptions = await PacklinkService.getShippingOptions(
      shippingAddress,
      items
    );
    const calculatedOptions = await ShippingService.calculateShippingCost(
      shippingAddress.country,
      options.data.summary?.totalWeight!
    );

    return res.status(200).json({
      success: true,
      data: [...calculatedOptions, ...shippingOptions],
      totalWeight: options.data.summary?.totalWeight!
    });
  } catch (err: any) {
    handleServerError(res, err);
  }
};

// POST /api/shipping/packlink/quote - Devis Packlink en temps réel
export const getPacklinkQuote = async (req: Request, res: Response) => {
  try {
    const { from, to, packages } = req.body;

    if (!from || !to || !packages) {
      return res.status(400).json({
        success: false,
        message: "Adresse expéditeur, destinataire et colis requis",
      });
    }

    const draft = await PacklinkService.createShipmentDraft(to, packages);

    if (!draft.id) {
      return res.status(500).json({
        success: false,
        message: "Impossible de créer le devis Packlink",
      });
    }

    const services = await PacklinkService.getShippingRates(draft.id);

    return res.status(200).json({
      success: true,
      data: {
        shipmentId: draft.id,
        services,
      },
    });
  } catch (err: any) {
    handleServerError(res, err);
  }
};

// POST /api/shipping/orders/:id/ship - Marquer comme expédiée (admin)
export const markAsShipped = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trackingNumber, shippingMethod, shippingProvider } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
        trackingNumber: trackingNumber || order.trackingNumber,
        shippingMethod: shippingMethod || order.shippingMethod,
        shippingProvider: shippingProvider || order.shippingProvider,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Commande marquée comme expédiée",
      data: updatedOrder,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

// PATCH /api/shipping/orders/:id/tracking - Maj du tracking (admin)
export const updateTracking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier, trackingUrl } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({
        success: false,
        message: "Numéro de tracking requis",
      });
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
      });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        trackingNumber,
        shippingProvider: carrier || order.shippingProvider,
        trackingUrl: trackingUrl || order.trackingUrl,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Tracking mis à jour",
      data: updatedOrder,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

// GET /api/shipping/orders/:id/tracking - Infos de suivi
export const getOrderTracking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        trackingNumber: true,
        trackingUrl: true,
        status: true,
        shippedAt: true,
        deliveredAt: true,
        shippingProvider: true,
        shippingMethod: true,
        packlinkShipmentId: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
      });
    }

    if (!order.trackingNumber) {
      return res.status(404).json({
        success: false,
        message: "Aucun numéro de tracking pour cette commande",
      });
    }

    const trackingInfo = await ShippingService.getTrackingInfo(
      order.trackingNumber
    );

    return res.status(200).json({
      success: true,
      data: trackingInfo,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

// POST /api/shipping/orders/:id/packlink/label - Génération étiquette (admin)
export const createPacklinkLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { serviceId, shipmentId } = req.body;

    if (!serviceId || !shipmentId) {
      return res.status(400).json({
        success: false,
        message: "Service ID et Shipment ID requis",
      });
    }

    // Vérifier que la commande existe
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Commande introuvable",
      });
    }

    const shipment = await ShippingService.createPacklinkShipment(
      id,
      shipmentId,
      serviceId
    );

    const label = await PacklinkService.getShipmentLabel(shipmentId);

    return res.status(200).json({
      success: true,
      message: "Étiquette Packlink créée",
      data: {
        shipment,
        label,
      },
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
