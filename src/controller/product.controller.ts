import { ApiResponse, UploadResult } from "types/type";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { handleServerError, paginate } from "utils/helpers";
import { PaginationInput } from "schema/validation.shema";
import { success } from "zod";
const prisma = new PrismaClient();
interface ProductData {
  name: string;
  description?: string | null;
  price: number;
  categoryId: string;
  image: string;
  publicId: string;
  slug?: string;
  stock: number;
}
// --- PUBLIC CATEGORY Controller

export const getAllProducts = async (
  req: Request,
  res: Response<ApiResponse<ProductData[] | null>>
) => {
  try {
    const { page, limit } = req.query as unknown as PaginationInput;
    const products = await prisma.product.findMany(paginate({ page, limit }));

    if (!products.length)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Aucun produit trouvé" });
    res.status(StatusCodes.OK).json({ success: true, data: products });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (product)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Produit non trouvé" });
    res.status(StatusCodes.OK).json({ success: true, data: product });
  } catch (err) {
    handleServerError(res, err);
  }
};

// --- AdMIN CATEGORY CRUD OPERATIONS

export const createProduct = async (req: Request, res: Response) => {
  try {
    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Produit créé avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const updateProduct = async (req: Request, res: Response) => {
  try {
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Produit mis à jour avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Produit supprimé avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};
