import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
export { stripe,Stripe, webhookSecret, endpointSecret };
