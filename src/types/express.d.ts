import * as Express from "express";
import { UserTokenPayload } from "./type";

declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
      file?: Express.Multer.File & { buffer: Buffer };
    }
  }
}
