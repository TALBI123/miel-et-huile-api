import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse, UploadResult } from "types/type";
import { generateSlug, handleServerError } from "../utils/helpers";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
const prisma = new PrismaClient();
interface CategoryData {
  name: string;
  description?: string | null;
  slug?: string;
  image?: string;
  publicId?: string;
}

export const getAllCategorys = async (
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

export const createCategory = async (
  req: Request<{}, {}, CategoryData>,
  res: Response
) => {
  let imageInfo: UploadResult | undefined;
  try {
    console.log(req.file);
    const { name, description } = req.body;
    const existingCategory = await prisma.category.findUnique({
      where: { name },
      select: { id: true },
    });
    if (existingCategory)
      return res
        .status(StatusCodes.CONFLICT)
        .json({ success: false, message: "Cette catégorie existe déjà" });

    // ✅ Upload Cloudinary (pas besoin de vérifier req.file, middleware garantit sa présence)
    imageInfo = await uploadBufferToCloudinary(req.file!.buffer, "categories");

    // Enregistrer la catégorie dans la base de données
    const newCategory = await prisma.category.create({
      data: {
        name,
        description: description ?? "",
        image: imageInfo.secure_url,
        publicId: imageInfo.public_id,
        slug: generateSlug(name),
      },
    });
    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Catégorie créée avec succès",
      data: newCategory,
    });
  } catch (err) {
    try {
      if (imageInfo?.public_id) await deleteFromCloudinary(imageInfo.public_id);
    } catch (err) {
      console.error(
        "Erreur lors de la suppression de l'image Cloudinary :",
        err
      );
    }
    handleServerError(res, err);
  }
};
export const updateCategory = async (req: Request, res: Response) => {
  let  imageInfo :  UploadResult |undefined;
  try {
    const { slug } = req.params;
    const { name, description } = req.body;
    // if()
  } catch (err) {
    handleServerError(res, err);
  }
};
