import { Role } from "@prisma/client";
import Stripe from "stripe";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
      email: string;
    }

    interface Request {
      user?: User | null;
      file?: Express.Multer.File & { buffer: Buffer };
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
      stripeEvent?: Stripe.Event;
    }
  }
}

export {};
