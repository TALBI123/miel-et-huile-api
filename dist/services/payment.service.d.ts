import { OrderWithRelations } from "../types/order.type";
import Stripe from "stripe";
export declare const createStripeSession: (order: OrderWithRelations, shippingCost: number, email: string) => Promise<{
    clientSecret: string | null;
    id: string;
}>;
export declare const handleStripeWebhook: (event: Stripe.Event) => Promise<void>;
