import { ProductVariantService } from "../services/productVariant.service";
import {
  ALLOWED_PRODUCT_VARIANT_PROPERTIES,
  AllowedProductVariantProperties,
} from "../data/allowedNames";
import { filterObjectByKeys, isEmptyObject } from "../utils/object";
import {
  ProductVariantWithRelations,
  ProductWithCategory,
} from "../types/prisma.type";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { ProductVariant } from "../types/type";
import { ProductType } from "@prisma/client";
import { Request, Response } from "express";
import prisma from "../config/db";
import {
  getAllowedPropertiesForProductType,
  objFiltered,
} from "../utils/filter";

const service = ProductVariantService.getInstance(prisma);

// --- PRODUCT VARIANT MANAGEMENT
export const createProductVariant = async (
  req: Request<{ id: string }, {}, ProductVariant>,
  res: Response
) => {
  const {  size, amount, unit } = res.locals.validated;
  const { productType, ...rest } = res.locals.validated;
  const { id } = req.params;
  const isHasSize = productType === ProductType.CLOTHING;
  try {
    // console.log(res.locals.validated, " req.body");
    const existingProduct: ProductWithCategory | null =
      await service.getExistingProduct({ id, key: "title" });
    // console.log(existingProduct);
    // existingProduct?.category
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
    const where = {
      ...(isHasSize ? { size } : { amount }),
      productId: id,
    };
    console.log(where);
    const existingAmount = await prisma.productVariant.findFirst({
      where,
      select: { id: true },
    });
    if (existingAmount)
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Cette variante existe déjà",
      });
    const filteredData = filterObjectByKeys<
      Omit<ProductVariant, "productId" |"productType">,
      AllowedProductVariantProperties
    >(
      rest,
      getAllowedPropertiesForProductType(
        productType
      ) as AllowedProductVariantProperties[]
    );
    const name = service.generateUniqueName(existingProduct.title);
    const sku = service.generateSKU({
      title: existingProduct.title,
      productType,
      ...(isHasSize ? { size } : { amount, unit: unit }),
    });
    const variantData = {
      ...filteredData,
      productId: id,
      name,
      sku,
    };
    console.log(filteredData);
    const data = await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: variantData,
      });
      // console.log(existingProduct);
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
    const { productType } = res.locals.validated;
    const existingProduct = await service.getExistingProduct({ id });
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });

    const existingVariant = (await service.getProductVariantById(variantId, [
      "amount",
      "size",
      "productId",
    ])) as ProductVariantWithRelations | null;
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

    
    const updatedData = {
      ...filterObjectByKeys<
        Partial<ProductVariant>,
        (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
      >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
    };
    const changedObj = objFiltered(existingVariant, updatedData);
    // console.log(res.locals.validated, " res.locals.validated hnaya", req.body);
    if (changedObj?.amount && changedObj.amount !== existingVariant.amount) {
      const amountExists = await prisma.productVariant.findFirst({
        where: { amount: changedObj.amount, productId: id },
      });
      if (amountExists)
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Cette variante existe déjà",
        });
    } else if (changedObj?.size && existingVariant.size !== changedObj.size) {
      const sizeExists = await prisma.productVariant.findFirst({
        where: { size: changedObj.size, productId: id },
      });
      if (sizeExists)
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Cette variante existe déjà",
        });
    }
    // Construire l'objet Produit mis à jour
    // const updatedData = {
    //   ...filterObjectByKeys<
    //     Partial<ProductVariant>,
    //     (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
    //   >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
    // };
    // const changedObj = objFiltered(existingVariant, updatedData);
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
          where: { categoryId: existingProduct.category.id, isActive: true },
        });
        if (!activeProductsCount && existingProduct.isActive)
          console.log("product.update est excuter ...");

        await tx.category.update({
          where: { id: existingProduct.category.id },
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
            where: { id: existingProduct.category.id },
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
