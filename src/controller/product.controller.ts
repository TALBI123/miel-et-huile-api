import { ApiResponse, IntProduct, UploadResult } from "../types/type";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import {
  filterObjectByKeys,
  handleServerError,
  paginate,
} from "../utils/helpers";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import { ALLOWED_PRODUCT_PROPERTIES } from "../data/allowedNames";
import { isEmptyObject } from "../utils/object";
const prisma = new PrismaClient();

// --- PUBLIC PRODUCT Controller

export const getProducts = async (
  req: Request,
  res: Response<ApiResponse<IntProduct[] | null>>
) => {
  try {
    const { page, limit } = res.locals.validated;
    const {} = req.query;
    const products = await prisma.product.findMany(paginate({ page, limit }));

    if (!products.length)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Aucun produit trouvé" });
    res
      .status(StatusCodes.OK)
      .json({ success: true, data: products as IntProduct[] });
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

// --- AdMIN PRODUCT CRUD OPERATIONS

export const createProduct = async (
  req: Request<{}, {}, IntProduct>,
  res: Response
) => {
  let imageInfo: UploadResult | null = null;
  try {
    console.log(req.body, res.locals);
    const existingProduct = await prisma.product.findFirst({
      where: { name: req.body.name },
      select: { id: true },
    });
    if (existingProduct)
      return res
        .status(StatusCodes.CONFLICT)
        .json({ success: false, message: "Ce produit existe déjà" });
    if (
      res.locals.validated.discountPrice &&
      res.locals.validated.discountPrice >= res.locals.validated.price
    )
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Le prix de réduction doit être inférieur au prix initial",
      });
    if (
      res.locals.validated.discountPercentage &&
      res.locals.validated.discountPercentage >= 100
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Le pourcentage de réduction doit être inférieur à 100",
      });
    }
    // ✅ Upload Cloudinary (pas besoin de vérifier req.file, middleware garantit sa présence)
    imageInfo = await uploadBufferToCloudinary(req.file!.buffer, "products");

    // Enregistrer la Produit dans la base de données
    const data = await prisma.product.create({
      data: {
        ...filterObjectByKeys<
          Omit<IntProduct, "image" | "publicId" | "isOnSale">,
          (typeof ALLOWED_PRODUCT_PROPERTIES)[number]
        >(res.locals.validated, ALLOWED_PRODUCT_PROPERTIES),
        image: imageInfo.secure_url,
        publicId: imageInfo.public_id,
      },
    });

    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Produit créé avec succès", data });
  } catch (err) {
    if (imageInfo?.public_id) {
      try {
        await deleteFromCloudinary(imageInfo.public_id);
      } catch (err) {
        console.warn(
          "Échec de la suppression de l'image après une erreur de création de produit",
          err
        );
      }
    }
    handleServerError(res, err);
  }
};
export const updateProduct = async (
  req: Request<{ id: string }, {}, IntProduct>,
  res: Response
) => {
  let imageInfo: UploadResult | null = null;
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { publicId: true },
    });

    if (!existingProduct)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Produit non trouvé" });
    const updatedData: Partial<IntProduct> = {
      ...filterObjectByKeys<
        Partial<Omit<IntProduct, "image" | "publicId" | "isOnSale">>,
        (typeof ALLOWED_PRODUCT_PROPERTIES)[number]
      >(res.locals.validated, ALLOWED_PRODUCT_PROPERTIES),
    };
    if (req.file) {
      imageInfo = await uploadBufferToCloudinary(req.file!.buffer, "products");
      updatedData.image = imageInfo.secure_url;
      updatedData.publicId = imageInfo.public_id;
    }

    if (!isEmptyObject(updatedData))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });

    const updateProduct = await prisma.product.update({
      where: { id },
      data: updatedData,
      select: { id: true, name: true },
    });
    if (req.file && existingProduct.publicId)
      await deleteFromCloudinary(existingProduct.publicId).catch((err) =>
        console.error(`existing image deletion error: ${err}`)
      );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Produit mis à jour avec succès",
      data: updateProduct,
    });
  } catch (err) {
    try {
      if (imageInfo?.public_id) await deleteFromCloudinary(imageInfo.public_id);
    } catch (err) {
      console.warn("Erreur lors de la suppression de l'image Cloudinary");
    }

    handleServerError(res, err);
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { publicId: true },
    });
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
    await prisma.product.delete({ where: { id } });
    if (existingProduct.publicId)
      await deleteFromCloudinary(existingProduct.publicId).catch((err) =>
        console.error(`existing image deletion error: ${err}`)
      );

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Produit supprimé avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};
