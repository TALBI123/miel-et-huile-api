import { PrismaClient } from "@prisma/client";
import { handleServerError } from "../../utils/helpers";

import { Request, Response } from "express";

const prisma = new PrismaClient();
const forgetPassword = async (req: Request, res: Response) => {
  try {

  } catch (err) {
    handleServerError(res, err);
  }
};

