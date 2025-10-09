import {
  ApiResponse,
  Product,
  ProductVariant,
  UploadResult,
} from "../types/type";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { cleanUploadedFiles, handleServerError } from "../utils/helpers";
import {
  deleteFromCloudinary,
  deletePathToCloudinary,
  uploadBufferToCloudinary,
  uploadPathToCloudinary,
} from "../services/upload.service";
import {
  ALLOWED_PRODUCT_PROPERTIES,
  ALLOWED_PRODUCT_VARIANT_PROPERTIES,
} from "../data/allowedNames";
import { filterObjectByKeys, isEmptyObject } from "../utils/object";
import { buildProductQuery, objFiltered } from "../utils/filter";
const prisma = new PrismaClient();

// --- PUBLIC PRODUCT Controller

export const getProducts = async (
  req: Request,
  res: Response<ApiResponse<Record<string, any> | null>>
) => {
  console.log("   ---------------------   ");
  const { categorySlug, ...rest } = res.locals.validated;
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
    // console.log(categorySlug, rest, categoryId);
    let extraWhere: any = {};
    if (categoryId) extraWhere.categoryId = categoryId;
    // else if (res.locals.validated?.mode === "with")
    //   extraWhere.category = { isActive: true };
    const query = buildProductQuery({
      ...(rest || {}),
      isNestedPrice: true,
      // ...(mode ? { relationFilter: { relation: "variants", mode } } : {}),
      relationName: "variants",
      include: {
        variants: {
          orderBy: { price: "asc" },
          take: 1, // récupère seulement la variante la moins chère
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
      extraWhere,
      // ...(categoryId ? { extraWhere: { categoryId } } : {}),
      // ...(res.locals.validated?.mode ? { category: { isActive: true } } : {}),
    });

    const products = await prisma.product.findMany(query);
    if (!products.length)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Aucun produit trouvé" });
    console.log("", query.where);
    const lastPage = await prisma.product.count({ where: query.where });
    console.log(lastPage);
    const newProducts = products.map((p) => {
      const { images, createdAt, updatedAt, variants, ...rest } = p;
      console.log(variants);
      const { id, ...variant } = variants[0];
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
      len: lastPage,
      lastPage: Math.ceil(lastPage / (res.locals.validated.limit || 5)),
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
      include: { images: true, variants: true },
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
    console.log(res.locals.validated, " res.locals.validated");
    const filterdProduct = filterObjectByKeys(
      res.locals.validated,
      ALLOWED_PRODUCT_PROPERTIES
    );
    const { category, ...rest } = existingProduct;
    const changedObj = objFiltered(rest, filterdProduct);
    console.log(changedObj, "changedObj");
    if (isEmptyObject(changedObj))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });
    console.log(existingProduct, filterdProduct);

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
      console.log(" imagesDeleted", imagesDeleted);
    }
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Produit supprimé avec succès" });
  } catch (err) {
    console.log("⚠️ delete product error", err);
    handleServerError(res, err);
  }
};

// --- Image management for product update could be added here

export const addProductImages = async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });
    if (!existingProduct) {
      cleanUploadedFiles(files);
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Produit non trouvé" });
    }
    const numberOfImages = existingProduct.images.length;

    if (numberOfImages >= 4) {
      cleanUploadedFiles(files);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "Le nombre maximum d'images (4) pour ce produit est déjà atteint",
      });
    }

    if (numberOfImages + files.length > 4) {
      cleanUploadedFiles(files);

      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `Vous pouvez ajouter jusqu'à ${
          4 - numberOfImages
        } images supplémentaires pour ce produit.`,
      });
    }
    const imagesInfo = await uploadPathToCloudinary(
      req.files as Express.Multer.File[],
      "products"
    );
    console.log("🔧 ", imagesInfo, " imagesInfo");
    // Ajouter les nouvelles images à la base de données
    await prisma.productImage.createMany({
      data: imagesInfo.map((img) => ({
        publicId: img.public_id,
        image: img.secure_url,
        productId: id,
      })),
    });
    res.status(StatusCodes.CREATED).json({
      message: "Images ajoutées avec succès",
    });
  } catch (err) {
    cleanUploadedFiles(files);
    handleServerError(res, err);
  }
};

export const updateProductImage = async (req: Request, res: Response) => {
  const { id, imageId } = req.params;
  let imageInfo: UploadResult | null = null;
  try {
    console.log(req.file, " req.file");
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProduct)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Produit non trouvé" });

    const imageToUpdate = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });
    if (!imageToUpdate)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Image non trouvée pour ce produit" });

    imageInfo = await uploadBufferToCloudinary(req.file!.buffer, "products");
    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        publicId: imageInfo?.public_id,
        image: imageInfo?.secure_url,
      },
    });
    console.log("🔧 ", updatedImage, " updatedImage");
    if (imageToUpdate?.publicId)
      await deleteFromCloudinary(imageToUpdate.publicId).catch((err) =>
        console.log("Failed to Delete old image", err)
      );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Image mise à jour avec succès",
      data: updatedImage,
    });
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
export const deleteProductImage = async (req: Request, res: Response) => {
  const { id, imageId } = req.params;
  let imageToUpdate;
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingProduct)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Produit non trouvé" });

    imageToUpdate = await prisma.productImage.findFirst({
      where: { id: imageId, productId: id },
    });
    if (!imageToUpdate)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Image non trouvée pour ce produit" });
    await prisma.productImage.delete({ where: { id: imageId } });
    if (imageToUpdate?.publicId) {
      try {
        await deleteFromCloudinary(imageToUpdate.publicId);
      } catch (err) {
        console.error("Failed to delete image from Cloudinary:", err);
      }
    }
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "l'image a été supprimée avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};

// --- PRODUCT VARIANT MANAGEMENT
export const createProductVariant = async (
  req: Request<{ id: string }, {}, ProductVariant>,
  res: Response
) => {
  const { id } = req.params;
  try {
    console.log(res.locals.validated, " req.body");
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        category: { select: { id: true, isActive: true } },
        isActive: true,
      },
    });
    console.log(existingProduct);
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
    const existingAmount = await prisma.productVariant.findFirst({
      where: { amount: req.body.amount, productId: id },
    });
    if (existingAmount)
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Cette variante existe déjà",
      });
    // // Construire l'objet Produit
    const data = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          ...filterObjectByKeys<
            Omit<ProductVariant, "productId">,
            (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
          >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
          productId: id,
        },
      });
      console.log(existingProduct);
      if (!existingProduct.category.isActive)
        await tx.category.update({
          where: { id: existingProduct.category.id },
          data: { isActive: true },
          select: { id: true },
        });
      if (!existingProduct.isActive)
        await tx.product.update({
          where: { id },
          data: { isActive: true },
          select: { id: true },
        });
      return variant;
    });
    // const createdVariant = await prisma.productVariant.create({
    //   data: {
    //     ...filterObjectByKeys<
    //       Omit<ProductVariant, "productId">,
    //       (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
    //     >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
    //     productId: id,
    //   },
    // });
    res.status(StatusCodes.CREATED).json({
      success: true,
      data,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const updateProductVariant = async (req: Request, res: Response) => {
  try {
    const { variantId, id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: {
        categoryId: true,
        isActive: true,
        category: { select: { id: true, isActive: true } },
      },
    });
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!existingVariant)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Variant non trouvé",
      });
    if (existingVariant.productId !== id)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit ou variant ne correspond pas au produit",
      });
    // console.log(res.locals.validated, " res.locals.validated hnaya", req.body);
    if (req.body?.amount && req.body.amount !== existingVariant.amount) {
      const amountExists = await prisma.productVariant.findFirst({
        where: { amount: req.body.amount, productId: id },
      });
      if (amountExists)
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Cette variante existe déjà",
        });
    }

    // Construire l'objet Produit mis à jour
    const updatedData = {
      ...filterObjectByKeys<
        Partial<ProductVariant>,
        (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
      >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
    };
    const changedObj = objFiltered(existingVariant, updatedData);
    // console.log(changedObj, " changedObj");
    if (isEmptyObject(changedObj))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });

    const updatedVariant = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.update({
        where: { id: variantId },
        data: changedObj,
      });
      console.log("varaints a bro ", variant);
      const activeVariantsCount = await tx.productVariant.count({
        where: { productId: id, isActive: true },
      });
      if (!activeVariantsCount && existingProduct.isActive) {
        await tx.product.update({
          where: { id },
          data: { isActive: false },
          select: { id: true },
        });
        const activeProductsCount = await tx.product.count({
          where: { categoryId: existingProduct.categoryId, isActive: true },
        });
        if (!activeProductsCount && existingProduct.isActive)
          console.log("product.update est excuter ...");

        await tx.category.update({
          where: { id: existingProduct.categoryId },
          data: { isActive: false },
          select: { id: true },
        });
      } else if (!existingProduct.isActive && activeVariantsCount > 0) {
        console.log("product.update est excuter ...");
        await tx.product.update({
          where: { id },
          data: { isActive: true },
          select: { id: true },
        });
        if (!existingProduct.category.isActive)
          await tx.category.update({
            where: { id: existingProduct.categoryId },
            data: { isActive: true },
            select: { id: true },
          });
      }
      return variant;
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "le variante ajoutées avec succès",
      data: updatedVariant,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const deleteProductVariant = async (
  req: Request<{ id: string; variantId: string }>,
  res: Response
) => {
  const { id, variantId } = req.params;
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!existingVariant)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Variant non trouvé",
      });
    if (existingVariant.productId !== id)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit ou variant ne correspond pas au produit",
      });
    await prisma.productVariant.delete({ where: { id: variantId } });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "le variante a été supprimée avec succès",
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

// if (discountPrice !== undefined) {
//   if (discountPrice >= price)
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       success: false,
//       message: "Le prix de réduction doit être inférieur au prix initial",
//     });
//   finalDiscountPrice = discountPrice;
//   finalDiscountPercentage = 100 - (100 * discountPrice) / price;
// }

// if (discountPercentage != undefined) {
//   if (discountPercentage >= 100)
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       success: false,
//       message: "Le pourcentage de réduction doit être inférieur à 100",
//     });
//   if (finalDiscountPrice === undefined) {
//     finalDiscountPrice = price * (1 - discountPercentage / 100);
//     finalDiscountPercentage = discountPercentage;
//   }
// }
// if (finalDiscountPrice !== undefined) {
//   variants.discountPercentage = finalDiscountPercentage as number;
//   variants.discountPrice = finalDiscountPrice as number;
// }
