import {  PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse, IntCategory, UploadResult } from "../types/type";
import {
  filterObjectByKeys,
  generateSlug,
  handleServerError,
  paginate,
} from "../utils/helpers";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import { ALLOWED_CATEGORY_PROPERTIES } from "../data/allowedNames";
import { isEmptyObject } from "../utils/object";
const prisma = new PrismaClient();

// --- PUBLIC CATEGORY Controller
export const getAllCategorys = async (
  req: Request ,
  res: Response<ApiResponse<IntCategory[] | null>>
) => {
  try {
    const { page, limit } = res.locals.validated ;
    console.log(res.locals)
    const data = await prisma.category.findMany(paginate({ page, limit }));
    if (!data)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Catégorie non trouvée" });
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) {
    handleServerError(res, err);
  }
};

// ---  AdMIN CATEGORY CRUD OPERATIONS
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await prisma.category.findUnique({ where: { id } });
    if (!data)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Catégorie non trouvée" });
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const createCategory = async (
  req: Request<{}, {}, IntCategory>,
  res: Response
) => {
  let imageInfo: UploadResult | undefined;
  try {
    console.log(req.file,"jjj");
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

export const updateCategory = async (
  req: Request<{ id: string }, {}, IntCategory>,
  res: Response
) => {
  let imageInfo: UploadResult | undefined;
  try {
    const { id } = req.params;
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: { publicId: true },
    });

    if (!existingCategory)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Catégorie non trouvée" });
    const updatedData: Partial<IntCategory> = {
      ...filterObjectByKeys<Pick<IntCategory, "name" | "description">, typeof ALLOWED_CATEGORY_PROPERTIES[number]>(
        req.body,
        ALLOWED_CATEGORY_PROPERTIES
      ),
    };
    if (req.body.name) updatedData.slug = generateSlug(req.body.name);
    // 🔹 Upload de la nouvelle image
    if (req.file) {
      imageInfo = await uploadBufferToCloudinary(
        req.file!.buffer,
        "categories"
      );
      updatedData.image = imageInfo.secure_url;
      updatedData.publicId = imageInfo.public_id;
    }

    console.log(updatedData);

    if (!isEmptyObject(updatedData))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });
    const updateCategory = await prisma.category.update({
      data: updatedData,
      where: { id },
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
    const { id } = req.params;
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      select: { publicId: true },
    });
    if (!existingCategory)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Category n'existe pas" });

    await prisma.category.delete({ where: { id } });

    if (existingCategory.publicId) {
      try {
        await deleteFromCloudinary(existingCategory.publicId);
      } catch (err) {
        console.error("❗ Suppression de l'image échouée :", err);
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "La catégorie a été supprimée avec succès",
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
