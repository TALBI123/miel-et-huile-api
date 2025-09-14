import * as Express from "express";
import { UserTokenPayload } from "./type";
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: Role;
      email: string;
    }
    
    interface Request {
      user?: User;
      file?: Express.Multer.File & { buffer: Buffer };
    }
  }
}
