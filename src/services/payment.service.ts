import Stripe from "stripe";
import { Order, OrderWithRelations } from "../types/order.type";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
export const createStripeSession = async (order: OrderWithRelations) => {
  const line_items = order.items.map((item) => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: item.product?.title!,
        description: item.product?.subDescription ?? "",
        images: item.product?.images?.map((img) => img.image) || [],
      },
      unit_amount: Math.round(
        (item.variant?.isOnSale
          ? item.variant?.discountPrice!
          : item.variant?.price!) * 100
      ), // en cents
    },
    quantity: item.quantity,
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
  });
  return session.id;
};
