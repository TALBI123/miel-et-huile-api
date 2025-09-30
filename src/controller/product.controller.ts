import {
  ApiResponse,
  Product,
  ProductVariant,
  UploadResult,
} from "../types/type";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import {
  cleanUploadedFiles,
  handleServerError,
  paginate,
} from "../utils/helpers";
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
import { buildProductQuery } from "../utils/filter";
const prisma = new PrismaClient();

// --- PUBLIC PRODUCT Controller

export const getProducts = async (
  req: Request,
  res: Response<ApiResponse<Record<string, any> | null>>
) => {
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
    const query = buildProductQuery({
      ...(rest || {}),
      relationName: "variants",
      include: {
        variants: {
          orderBy: { price: "asc" },
          take: 1, // récupère seulement la variante la moins chère
          select: {
            // id: true,
            price: true,
            discountPrice: true,
            discountPercentage: true,
          },
        },
        images: true,
      },
      extraWhere: {
        ...(categoryId  ? { categoryId } : {}),
      },
    });
    const products = await prisma.product.findMany(query);
    if (!products.length)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Aucun produit trouvé" });
    const newProducts = products.map((p) => {
      const { images, createdAt, updatedAt, variants, ...rest } = p;
      return {
        ...rest,
        image: images.length && "image" in images[0] ? images[0]?.image : "",
        ...(variants.length ? { ...variants[0] } : {}),
        createdAt,
        updatedAt,
      };
    });
    res.status(StatusCodes.OK).json({
      success: true,
      data: newProducts,
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
    });
    if (!existingProduct)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Produit non trouvé" });
    console.log(req.body);
    if (req.body?.categoryId) {
      const existingCategory = await prisma.category.findUnique({
        where: { id: req.body.categoryId },
      });
      if (!existingCategory)
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Catégorie non trouvée",
        });
    }
    // Vérifier si des données valides sont fournies
    const filterdProduct = filterObjectByKeys(
      req.body,
      ALLOWED_PRODUCT_PROPERTIES
    );
    console.log(filterdProduct);
    if (isEmptyObject(filterdProduct ?? {}))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });
    console.log(filterdProduct);

    console.log(existingProduct);
    const updateProduct = await prisma.product.update({
      where: { id },
      data: filterdProduct,
      // select: { id: true, title: true },
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
    const existingProduct = await prisma.product.findUnique({ where: { id } });
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
    const createdVariant = await prisma.productVariant.create({
      data: {
        ...filterObjectByKeys<
          Omit<ProductVariant, "productId">,
          (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
        >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
        productId: id,
      },
    });
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: createdVariant,
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
    console.log(res.locals.validated, " req.body");
    if (req.body?.amount && req.body.amount !== existingVariant.amount) {
      const amountExists = await prisma.productVariant.findFirst({
        where: { amount: req.body.amount, productId: id },
      });
      if (amountExists)
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Cette variante existe déjà",
        });
    } else if (req.body?.amount && req.body.amount === existingVariant.amount)
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "amount est deja utilisé pour cette variante",
      });

    // Construire l'objet Produit mis à jour
    const updatedData = {
      ...filterObjectByKeys<
        Partial<ProductVariant>,
        (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
      >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
    };

    console.log(updatedData, " updatedData");
    if (
      isEmptyObject(
        filterObjectByKeys(updatedData, ALLOWED_PRODUCT_VARIANT_PROPERTIES)
      )
    )
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });

    const updatedVariant = await prisma.productVariant.update({
      where: { id: variantId },
      data: updatedData,
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
    console.log(variantId);
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
