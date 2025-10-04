import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse, IntCategory, UploadResult } from "../types/type";
import { generateSlug, handleServerError } from "../utils/helpers";
import {
  deleteFromCloudinary,
  deletePathToCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import { ALLOWED_CATEGORY_PROPERTIES } from "../data/allowedNames";
import { filterObjectByKeys, isEmptyObject } from "../utils/object";
import { buildProductQuery, objFiltered } from "../utils/filter";
const prisma = new PrismaClient();

// --- PUBLIC CATEGORY Controller
export const getAllCategorys = async (
  req: Request,
  res: Response<ApiResponse<IntCategory[] | null>>
) => {
  try {
    // console.log(res.locals.validated, "res.locals.validated",req.query);
    const { mode, nestedIsActive } = res.locals.validated;
    const query = buildProductQuery({
      ...(res.locals.validated || {}),
      // ...(mode ? { relationFilter: { relation: "products", mode } } : {}),
      relationName: "products",
      ...(nestedIsActive ? { nested: { isActive: true } } : {}),
      include: {
        _count: {
          select: { products: true },
        },
      },
      // extraWhere: { isActive: true}
    });
     
    const data = await prisma.category.findMany(query);
    if (!data)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Catégorie non trouvée" });

    const newData = data.map((cat) => {
      const { _count, createdAt, updatedAt, ...rest } = cat;
      const productsCount = "products" in _count ? _count.products : 0;
      return {
        ...rest,
        productsCount,
        createdAt,
        updatedAt,
      };
    });
    res.status(StatusCodes.OK).json({ success: true, data: newData });
  } catch (err) {
    handleServerError(res, err);
  }
};

// ---  AdMIN CATEGORY CRUD OPERATIONS
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
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
    console.log(req.file, "jjj");
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
    const body = res.locals.validated;
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Catégorie non trouvée" });
    const updatedData: Partial<IntCategory> = {
      ...filterObjectByKeys<
        Pick<IntCategory, "name" | "description" | "isActive">,
        (typeof ALLOWED_CATEGORY_PROPERTIES)[number]
      >(body, ALLOWED_CATEGORY_PROPERTIES),
    };
    if (body?.name) updatedData.slug = generateSlug(body.name);
    // 🔹 Upload de la nouvelle image
    if (req.file) {
      imageInfo = await uploadBufferToCloudinary(
        req.file!.buffer,
        "categories"
      );
      updatedData.image = imageInfo.secure_url;
      updatedData.publicId = imageInfo.public_id;
    }

    console.log(existingCategory, updatedData);
    const changedObj = objFiltered(existingCategory, updatedData);
    console.log(changedObj, "changedObj");
    if (isEmptyObject(changedObj))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });
    const updateCategory = await prisma.category.update({
      data: changedObj,
      where: { id },
      // select: { id: true },
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
      select: {
        publicId: true,
        products: {
          select: {
            id: true,
            images: { select: { publicId: true } },
          },
        },
      },
    });
    if (!existingCategory)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Category n'existe pas" });
    const { publicId, products } = existingCategory;
    const publicIdOfImages = products.reduce<string[]>((acc, { images }) => {
      for (const { publicId } of images) if (publicId) acc.push(publicId);
      return acc;
    }, []);

    await prisma.category.delete({ where: { id } });
    try {
      if (publicIdOfImages.length) {
        const { success, failed } = await deletePathToCloudinary(
          publicIdOfImages
        );
        console.log(success, failed);
        if (failed.length)
          console.log(
            "❗ Certaines images n'ont pas pu être supprimées :",
            failed
          );
      }
    } catch (err) {
      console.log("❗ Suppression des images des produits échouée :", err);
    }
    if (publicId) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (err) {
        console.error(
          "❗ Suppression de l'image de la catégorie échouée :",
          err
        );
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "La catégorie a été supprimée avec succès",
      products,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

