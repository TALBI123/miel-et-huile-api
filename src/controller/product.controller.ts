import { ApiResponse, Product, UploadResult } from "../types/type";
import { StatusCodes } from "http-status-codes";
import { PrismaClient, ProductVariant } from "@prisma/client";
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
const prisma = new PrismaClient();

// --- PUBLIC PRODUCT Controller

export const getProducts = async (
  req: Request,
  res: Response<ApiResponse<Product[] | null>>
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
      include: { images: true },
    });
    if (!products.length)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Aucun produit trouvé" });
    res
      .status(StatusCodes.OK)
      .json({ success: true, data: products as Product[] });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
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

    console.log(imagesInfo, " imagesInfo");
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
    handleServerError(res, err);
  }
};

// --- Image management for product update could be added here

export const addProductImages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true },
    });
    if (!existingProduct)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Produit non trouvé" });
    const numberOfImages = existingProduct.images.length;
    if (numberOfImages >= 4) {
      cleanUploadedFiles(req.files as Express.Multer.File[]);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message:
          "Le nombre maximum d'images (4) pour ce produit est déjà atteint",
      });
    }
    if (numberOfImages - (req.files as Express.Multer.File[]).length < 0) {
      cleanUploadedFiles(req.files as Express.Multer.File[]);

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
    console.log(imagesInfo, " imagesInfo");
    // Ajouter les nouvelles images à la base de données
    console.log()
    // await prisma.productImage.createMany({
    //   data:
    // })
    res
      .status(StatusCodes.NOT_IMPLEMENTED)
      .json({ message: "l'image ajoutée avec succès" });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const deleteProductImage = async (req: Request, res: Response) => {
  // logique pour supprimer une image spécifique

};

export const updateProductImage = async (req: Request, res: Response) => {
  // logique pour remplacer une image existante par une nouvelle
};

// --- PRODUCT VARIANT MANAGEMENT
// export const createProductVariant = async (
//   req: Request<{ productId: string }, {}, ProductVariant>,
//   res: Response
// ) => {
//   const { productId } = req.params;
//   try {
//     const { discountPrice, discountPercentage, price } = res.locals.validated;
//     if (discountPrice !== undefined && discountPercentage !== undefined) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message:
//           "Choisissez soit un prix de remise, soit un pourcentage, mais pas les deux.",
//       });
//     }
//     let finalDiscountPrice: number | undefined;
//     let finalDiscountPercentage: number | undefined;
//     // Construire l'objet Produit
//     const variants: ProductVariant = {
//       ...filterObjectByKeys<
//         ProductVariant,
//         (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
//       >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
//       isOnSale: false,
//     };

//     if (discountPrice !== undefined) {
//       if (discountPrice >= price)
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: "Le prix de réduction doit être inférieur au prix initial",
//         });
//       finalDiscountPrice = discountPrice;
//       finalDiscountPercentage = 100 - (100 * discountPrice) / price;
//     }

//     if (discountPercentage != undefined) {
//       if (discountPercentage >= 100)
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: "Le pourcentage de réduction doit être inférieur à 100",
//         });
//       if (finalDiscountPrice === undefined) {
//         finalDiscountPrice = price * (1 - discountPercentage / 100);
//         finalDiscountPercentage = discountPercentage;
//       }
//     }
//     if (finalDiscountPrice !== undefined) {
//       variants.discountPercentage = finalDiscountPercentage as number;
//       variants.discountPrice = finalDiscountPrice as number;
//     }

//     res.status(StatusCodes.CREATED).json({
//       success: true,
//       data: variants,
//     });
//   } catch (err) {
//  if (imageInfo?.public_id) {
//       try {
//         await deleteFromCloudinary(imageInfo.public_id);
//       } catch (err) {
//         console.warn(
//           "Échec de la suppression de l'image après une erreur de création de produit",
//           err
//         );
//       }
//     }
//     handleServerError(res, err);
//   }
// };
// export const updateProductVariant = async (req: Request, res: Response) => {
//   try {
//     const { productId, id } = req.params;
//     const existingProduct = await prisma.product.findUnique({
//       where: { id: productId },
//     });
//     if (!existingProduct)
//       res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: "Produit non trouvé",
//       });
//     const existingVariant = await prisma.productVariant.findUnique({
//       where: { id },
//     });
//     if (!existingVariant)
//       return res.status(StatusCodes.NOT_FOUND).json({
//         success: false,
//         message: "Variant not found",
//       });
//     if (isEmptyObject(req.body ?? {}))
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message: "Aucune donnée valide fournie pour la mise à jour",
//       });
//     const { discountPrice, discountPercentage, price } = req.body;
//  const { discountPrice, discountPercentage, price } =
//       res.locals.validated ?? {};
//     if (discountPrice !== undefined && discountPercentage !== undefined) {
//       return res.status(StatusCodes.BAD_REQUEST).json({
//         success: false,
//         message:
//           "Choisissez soit un prix de remise, soit un pourcentage, mais pas les deux.",
//       });
//     }

//     let finalDiscountPrice: number | undefined;
//     let finalDiscountPercentage: number | undefined;

//     // Construire l'objet Produit mis à jour
//     const updatedData: Partial<IntProduct> = {
//       ...filterObjectByKeys<
//         Partial<Omit<IntProduct, "image" | "publicId" | "isOnSale">>,
//         (typeof ALLOWED_PRODUCT_PROPERTIES)[number]
//       >(res.locals.validated, ALLOWED_PRODUCT_PROPERTIES),
//     };

//     if (discountPrice !== undefined) {
//       if (discountPrice >= price)
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: "Le prix de réduction doit être inférieur au prix initial",
//         });
//       finalDiscountPrice = discountPrice;
//       finalDiscountPercentage = 100 - (100 * discountPrice) / price;
//     }
//     if (discountPercentage !== undefined) {
//       if (discountPercentage >= 100)
//         return res.status(StatusCodes.BAD_REQUEST).json({
//           success: false,
//           message: "Le pourcentage de réduction doit être inférieur à 100",
//         });
//       if (finalDiscountPrice === undefined) {
//         finalDiscountPrice = price * (1 - discountPercentage / 100);
//         finalDiscountPercentage = discountPercentage;
//       }
//     }

//     if (finalDiscountPrice !== undefined) {
//       updatedData.discountPercentage = finalDiscountPercentage;
//       updatedData.discountPrice = finalDiscountPrice;
//       updatedData.isOnSale = true;
//     }
//     const updatedVariant = await prisma.productVariant.update({
//       where: { id: id },
//       data: {
//         ...filterObjectByKeys(req.body, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
//       },
//     });
//     res.status(StatusCodes.OK).json({
//       success: true,
//       data: updatedVariant,
//     });
//   } catch (err) {
//     handleServerError(res, err);
//   }
// };
