import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse, UploadResult } from "types/type";
import { generateSlug, handleServerError } from "../utils/helpers";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import { success } from "zod";

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
  let imageInfo: UploadResult | undefined;
  try {
    const { slug } = req.params;
    const { name, description } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
      select: { name: true, description: true, publicId: true },
    });

    if (!existingCategory)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Catégorie non trouvée" });

    let updatedData: Partial<CategoryData> = {
      name,
      description: description ?? existingCategory.description,
      slug: generateSlug(name),
    };

    // 🔹 Upload de la nouvelle image
    if (req.file) {
      imageInfo = await uploadBufferToCloudinary(
        req.file!.buffer,
        "categories"
      );
      updatedData.image = imageInfo.secure_url;
      updatedData.publicId = imageInfo.public_id;
    }
    const updateCategory = await prisma.category.update({
      data: updatedData,
      where: { slug },
      select: { id: true },
    });
    // 🔹 Supprimer l’ancienne image seulement si tout a réussi
    if (req.file && existingCategory.publicId) {
      try {
        await deleteFromCloudinary(existingCategory.publicId);
      } catch (err: any) {
        console.error("❗ Suppression ancienne image échouée :", err.message);
      }
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Catégorie mise à jour avec succès",
      data: updateCategory,
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

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const existingCategory = await prisma.category.findUnique({
      where: { slug },
      select: { publicId: true },
    });
    if (!existingCategory)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Category n'existe pas" });

    await prisma.category.delete({ where: { slug } });

    if (existingCategory.publicId) {
      try {
        await deleteFromCloudinary(existingCategory.publicId);
      } catch (err) {
        console.error("❗ Suppression de l'image échouée :", err);
      }
    }

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "La catégorie a été supprimée avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};
