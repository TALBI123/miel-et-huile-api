"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.endpointSecret = exports.webhookSecret = exports.Stripe = exports.stripe = void 0;
const stripe_1 = __importDefault(require("stripe"));
exports.Stripe = stripe_1.default;
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
exports.stripe = stripe;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
exports.webhookSecret = webhookSecret;
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
exports.endpointSecret = endpointSecret;
//# sourceMappingURL=stripe.js.map