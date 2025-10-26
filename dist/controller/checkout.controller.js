"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
const product_validation_service_1 = require("../services/product-validation.service");
const order_processing_service_1 = require("../services/order-processing.service");
const payment_service_1 = require("../services/payment.service");
const helpers_1 = require("../utils/helpers");
const http_status_codes_1 = require("http-status-codes");
const createCheckoutSession = async (req, res) => {
    try {
        const { items, shippingCost } = req.body;
        // console.log(req.user);
        // console.log("Items received in createCheckoutSession:", items);
        const validationResponse = await product_validation_service_1.ProductValidationService.validateItems(items);
        // console.log("Validation response:", validationResponse);
        if (!validationResponse.success)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json(validationResponse);
        console.log("🛒 Articles validés avec succès.");
        console.log("🛒 Création de la commande en cours...");
        const order = await order_processing_service_1.OrderProcessingService.createOrder(req.user?.id, items, shippingCost);
        const clientSecret = await (0, payment_service_1.createStripeSession)(order, shippingCost, req.user?.email);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Commande créée avec succès",
            ...clientSecret,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.createCheckoutSession = createCheckoutSession;
//# sourceMappingURL=checkout.controller.js.map