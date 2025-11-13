import Stripe from "stripe";
declare const stripe: Stripe;
declare const webhookSecret: string | undefined;
declare const endpointSecret: string | undefined;
export { stripe, Stripe, webhookSecret, endpointSecret };
