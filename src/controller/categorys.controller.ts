import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "types/type";
import { handleServerError } from "utils/helpers";
const prisma = new PrismaClient();
interface CategoryData {}
const getAllCategorys = async (
  req: Request<{}, {}>,
  res: Response<ApiResponse<CategoryData[] | null>>
) => {
  try {
    const data = await prisma.category.findMany();
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) {
    handleServerError(res, err);
  }
};

const createCategory = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};
