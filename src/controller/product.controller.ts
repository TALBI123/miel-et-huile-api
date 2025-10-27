import { QueryBuilderService } from "../services/queryBuilder.service";
import { filterObjectByKeys, isEmptyObject } from "../utils/object";
import { ALLOWED_PRODUCT_PROPERTIES } from "../data/allowedNames";
import { ApiResponse, Product, UploadResult } from "../types/type";
import { ProductWithRelations } from "../types/prisma.type";
import { EnumRelationTables, Model } from "../types/enums";
import { handleServerError } from "../utils/helpers";
import { objFiltered } from "../utils/filter";
import { StatusCodes } from "http-status-codes";

import { Request, Response } from "express";

import {
  deleteFromCloudinary,
  deletePathToCloudinary,
  uploadBufferToCloudinary,
  uploadPathToCloudinary,
} from "../services/upload.service";

import prisma from "../config/db";

// --- PUBLIC PRODUCT Controller

export const getProducts = async (
  req: Request,
  res: Response<ApiResponse<Record<string, any> | null>>
) => {
  const { categorySlug, ...rest } = res.locals.validated;
  console.log(res.locals.validated, " req.body");
  const { page, limit } = res.locals.validated;
  let categoryId: string | undefined;
  try {
    if (categorySlug) {
      const existingSlug = await prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      });
      if (!existingSlug)
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ success: false, message: "Catégorie non trouvée" });
      categoryId = existingSlug?.id;
    }
    const query = QueryBuilderService.buildAdvancedQuery(Model.PRODUCT, {
      ...(rest || {}),
      isNestedPrice: true,
      categoryId,
      nestedIsActive: { isActive: true },
      nestedModelActive: EnumRelationTables.VARIANT,
      include: {
        variants: {
          orderBy: { price: "asc" },
          take: 1,
          select: {
            id: true,
            price: true,
            discountPrice: true,
            discountPercentage: true,
            amount: true,
            unit: true,
            stock: true,
          },
        },
        images: {
          take: 1,
          select: {
            image: true,
          },
        },
      },
    });

    const [products, total] = await Promise.all([
      prisma.product.findMany(query),
      prisma.product.count({ where: query.where }),
    ]);
    if (!products.length)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Aucun produit trouvé" });

    const newProducts = (products as ProductWithRelations[]).map((p) => {
      const { images, createdAt, updatedAt, variants, ...rest } = p;
      const { id, ...variant } = variants[0] || {};
      return {
        ...rest,
        image: images.length && "image" in images[0] ? images[0]?.image : "",
        ...(variants.length ? { variantId: id, ...variant } : {}),
        createdAt,
        updatedAt,
      };
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: newProducts,
      pagination: {
        page,
        limit,
        total,
        lastPage: QueryBuilderService.calculateLastPage(total, limit),
      },
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          select: { id: true, image: true },
        },
        variants: true,
      },
    });
    if (!product)
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
  req: Request<{}, {}, Product>,
  res: Response
) => {
  let imagesInfo: UploadResult[] = [];
  try {
    const existingCategory = await prisma.category.findUnique({
      where: { id: req.body.categoryId },
    });
    if (!existingCategory)
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Catégorie non trouvée",
      });
    const existingProduct = await prisma.product.findFirst({
      where: { title: req.body.title },
      select: { id: true },
    });
    if (existingProduct)
      return res
        .status(StatusCodes.CONFLICT)
        .json({ success: false, message: "Ce produit existe déjà" });

    imagesInfo = await uploadPathToCloudinary(
      req.files as Express.Multer.File[],
      "products"
    );

    // console.log(imagesInfo, " imagesInfo");
    // Enregistrer la Produit dans la base de données

    const data = await prisma.product.create({
      data: {
        ...filterObjectByKeys(req.body, ALLOWED_PRODUCT_PROPERTIES),
        images: {
          create: imagesInfo.map((img) => ({
            image: img.secure_url,
            publicId: img.public_id,
          })),
        },
      },
      include: { images: true },
    });
    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Produit créé avec succès", data });
  } catch (err) {
    try {
      if (imagesInfo.length)
        await deletePathToCloudinary(
          imagesInfo
            .filter((img) => img?.secure_url)
            .map((img) => img.public_id) as string[]
        );
    } catch (err) {
      console.error("Erreur lors de la suppression des images :", err);
    }
    handleServerError(res, err);
  }
};

export const updateProduct = async (
  req: Request<{ id: string }, {}, Product>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existingProduct)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Produit non trouvé" });

    if (req.body?.categoryId) {
      const existingCategory = await prisma.category.findUnique({
        where: { id: req.body.categoryId },
      });
      if (!existingCategory)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Catégorie non trouvée",
        });
      if (req.body?.categoryId === existingProduct.categoryId)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Le produit appartient déjà à cette catégorie",
        });
    }

    // Vérifier si des données valides sont fournies
    // console.log(res.locals.validated, " res.locals.validated");
    const filterdProduct = filterObjectByKeys(
      res.locals.validated,
      ALLOWED_PRODUCT_PROPERTIES
    );
    const { category, ...rest } = existingProduct;
    const changedObj = objFiltered(rest, filterdProduct);
    // console.log(changedObj, "changedObj");
    if (isEmptyObject(changedObj))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });
    // console.log(existingProduct, filterdProduct);

    const updateProduct = await prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: changedObj,
      });
      const activeProductCount = await tx.product.count({
        where: { categoryId: existingProduct.categoryId, isActive: true },
      });
      if (!activeProductCount && category.isActive) {
        await tx.category.update({
          where: { id: category.id },
          data: { isActive: false },
        });
      } else if (activeProductCount > 0 && !category.isActive) {
        await tx.category.update({
          where: { id: category.id },
          data: { isActive: true },
        });
      }
      return updatedProduct;
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Produit mis à jour avec succès",
      data: updateProduct,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
    await prisma.product.delete({ where: { id } });

    // Supprimer les images de Cloudinary
    const imagesToDelete =
      existingProduct.images?.map((img) => img.publicId) ?? [];
    if (imagesToDelete.length) {
      const imagesDeleted = await deletePathToCloudinary(imagesToDelete).catch(
        (err) => console.error(`existing image deletion error: ${err}`)
      );
      // console.log(" imagesDeleted", imagesDeleted);
    }
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Produit supprimé avec succès" });
  } catch (err) {
    console.log("⚠️ delete product error", err);
    handleServerError(res, err);
  }
};
