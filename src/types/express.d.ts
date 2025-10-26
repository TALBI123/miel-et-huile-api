import * as Express from "express";
import { UserTokenPayload } from "./type";
import { Role } from "@prisma/client";
import Stripe from "stripe";
import { File } from "multer";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
      email: string;
    }

    interface Request {
      user?: User;
      file?: File & { buffer: Buffer };
      stripeEvent?: Stripe.Event;
    }
  }
}
