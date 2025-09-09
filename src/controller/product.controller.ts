import { ApiResponse, UploadResult } from "types/type";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { handleServerError } from "utils/helpers";
import { PaginationInput } from "schema/validation.shema";
const prisma = new PrismaClient();
interface ProductData {
  name: string;
  description?: string | null;
  price: number;
  categoryId: string;
  image?: string;
  publicId?: string;
  slug?: string;
  stock?: number;
}
// --- PUBLIC CATEGORY Controller

export const getAllProducts = async (
  req: Request<{}, {}, {}, PaginationInput>,
  res: Response<ApiResponse<ProductData[] | null>>
) => {
  try {
    const { page, limit } = req.query;
    const products = await prisma.product.findMany({
      skip: (page - 1) * limit,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const getProductById = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};

// --- AdMIN CATEGORY CRUD OPERATIONS

export const createProduct = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};
export const updateProduct = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};
export const deleteProduct = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};
