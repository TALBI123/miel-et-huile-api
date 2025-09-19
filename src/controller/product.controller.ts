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
    const {
      page,
      limit,
      category,
      search,
      onSale,
      minPrice,
      maxPrice,
      inStock,
    } = res.locals.validated;

    if (minPrice && maxPrice && minPrice > maxPrice) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Le prix minimum ne peut pas être supérieur au prix maximum",
      });
    }
    const where: any = {
      ...(category ? { category: { name: category } } : {}),
      ...(inStock !== undefined ? { stock: { gt: 0 } } : {}),
      ...(onSale !== undefined ? { onSale } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice && { gte: minPrice }),
              ...(maxPrice && { lte: maxPrice }),
            },
          }
        : {}),
    };
    const products = await prisma.product.findMany({
      where,
      ...paginate({ page, limit }),
    });
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
  let imageInfo: UploadResult | undefined;
  try {
    const existingProduct = await prisma.product.findFirst({
      where: { title: req.body.title },
      select: { id: true },
    });
    if (existingProduct)
      return res
        .status(StatusCodes.CONFLICT)
        .json({ success: false, message: "Ce produit existe déjà" });

    // Validation des prix de remise
    const { discountPrice, discountPercentage, price } = res.locals.validated;
    console.log(discountPrice, discountPercentage);
    if (discountPrice !== undefined && discountPercentage !== undefined) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Choisissez soit un prix de remise, soit un pourcentage, mais pas les deux.",
      });
    }
    // Construire l'objet Produit
    const product: IntProduct = {
      ...filterObjectByKeys<
        Omit<IntProduct, "image" | "publicId" | "isOnSale">,
        (typeof ALLOWED_PRODUCT_PROPERTIES)[number]
      >(res.locals.validated, ALLOWED_PRODUCT_PROPERTIES),
      isOnSale: false,
      image: "",
      publicId: "",
    };

    let finalDiscountPrice: number | undefined;
    let finalDiscountPercentage: number | undefined;

    if (discountPrice !== undefined) {
      if (discountPrice >= price)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Le prix de réduction doit être inférieur au prix initial",
        });
      finalDiscountPrice = discountPrice;
      finalDiscountPercentage = 100 - (100 * discountPrice) / price;
    }

    if (discountPercentage != undefined) {
      if (discountPercentage >= 100)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Le pourcentage de réduction doit être inférieur à 100",
        });
      if (finalDiscountPrice === undefined) {
        finalDiscountPrice = price * (1 - discountPercentage / 100);
        finalDiscountPercentage = discountPercentage;
      }
    }
    if (finalDiscountPrice !== undefined) {
      product.discountPercentage = finalDiscountPercentage as number;
      product.discountPrice = finalDiscountPrice as number;
    }
    console.log(finalDiscountPrice, "jqsdjsjd");
    product.isOnSale = finalDiscountPrice !== undefined;
    // ✅ Upload Cloudinary (pas besoin de vérifier req.file, middleware garantit sa présence)
    imageInfo = await uploadBufferToCloudinary(req.file!.buffer, "products");
    product.image = imageInfo.secure_url;
    product.publicId = imageInfo.public_id;

    // Enregistrer la Produit dans la base de données
    const data = await prisma.product.create({
      data: product,
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

    // Validation des prix de remise
    const { discountPrice, discountPercentage, price } = res.locals.validated;
    if (discountPrice !== undefined && discountPercentage !== undefined) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message:
          "Choisissez soit un prix de remise, soit un pourcentage, mais pas les deux.",
      });
    }

    let finalDiscountPrice: number | undefined;
    let finalDiscountPercentage: number | undefined;

    // Construire l'objet Produit mis à jour
    const updatedData: Partial<IntProduct> = {
      ...filterObjectByKeys<
        Partial<Omit<IntProduct, "image" | "publicId" | "isOnSale">>,
        (typeof ALLOWED_PRODUCT_PROPERTIES)[number]
      >(res.locals.validated, ALLOWED_PRODUCT_PROPERTIES),
    };

    if (discountPrice !== undefined) {
      if (discountPrice >= price)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Le prix de réduction doit être inférieur au prix initial",
        });
      finalDiscountPrice = discountPrice;
      finalDiscountPercentage = 100 - (100 * discountPrice) / price;
    }
    if (discountPercentage !== undefined) {
      if (discountPercentage >= 100)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Le pourcentage de réduction doit être inférieur à 100",
        });
      if (finalDiscountPrice === undefined) {
        finalDiscountPrice = price * (1 - discountPercentage / 100);
        finalDiscountPercentage = discountPercentage;
      }
    }

    if (finalDiscountPrice !== undefined) {
      updatedData.discountPercentage = finalDiscountPercentage;
      updatedData.discountPrice = finalDiscountPrice;
      updatedData.isOnSale = true;
    }

    // 🔹 Upload de la nouvelle image
    if (req.file) {
      imageInfo = await uploadBufferToCloudinary(req.file!.buffer, "products");
      updatedData.image = imageInfo.secure_url;
      updatedData.publicId = imageInfo.public_id;
    }

    if (isEmptyObject(updatedData))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });

    const updateProduct = await prisma.product.update({
      where: { id },
      data: updatedData,
      select: { id: true, title: true },
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
