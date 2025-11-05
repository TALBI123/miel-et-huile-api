import { BANNER_LINK_TYPE, BANNER_TYPE } from "../data/constants";
import { BannerLinkType, BannerType } from "@prisma/client";
import { defaultEnum, sanitizeDateRange } from "./utils";
import {
  booleanFromStringSchema,
  dateFilterSchema,
  FilterSchema,
} from "./validation.shema";
import { z } from "zod";
const validationUUID = z.uuid("L'ID doit être un UUID valide").optional();
const sanitizeBannerData = (data: any) => {
  // ✨ Nettoyage automatique : si linkType = NONE → supprimer buttonText
  if (data.linkType === BannerLinkType.NONE) {
    const { buttonText, ...rest } = data;
    return rest;
  }
  return data;
};

export const normalizeBannerLinkData = (data: any) => {
  const { productId, packId, categoryId, ...rest } = data;

  const result = {
    ...rest,
    productId: null,
    categoryId: null,
    packId: null,
  };

  switch (data.linkType) {
    case BannerLinkType.CATEGORY:
      result.categoryId = categoryId;
      break;
    case BannerLinkType.PRODUCT:
      result.productId = productId;
      break;
    case BannerLinkType.PACK:
      result.packId = packId;
      break;
  }

  return result;
};

export const bannerBaseSchema = z.object({
  text: z
    .string({ message: "Le texte de la bannière est requis" })
    .min(1, "Le texte de la bannière ne peut pas être vide"),
  title: z
    .string({ message: "Le titre de la bannière est requis" })
    .min(1, "Le titre de la bannière ne peut pas être vide"),
  buttonText: z
    .string()
    .min(1, "Le texte du bouton ne peut pas être vide")
    .optional(),
  linkType: z
    .enum(BANNER_LINK_TYPE, {
      message: `Le type de lien doit être ${BANNER_LINK_TYPE.join(" ou ")}`,
    })
    .default(BannerLinkType.NONE),
  type: z
    .enum(BANNER_TYPE, {
      message: `Le type de bannière doit être ${BANNER_TYPE.join(" ou ")}`,
    })
    .default(BannerType.PROMOTION),
  categoryId: validationUUID.optional(),
  productId: validationUUID.optional(),
  packId: validationUUID.optional(),
  isActive: booleanFromStringSchema,
});

export const createBannerSchema = bannerBaseSchema
  .extend({
    startAt: z
      .date({ message: "La date de début doit être une date valide" })
      .optional(),
    endAt: z
      .date({ message: "La date de fin doit être une date valide" })
      .optional(),
  })
  .superRefine((data, ctx) => {
    function addError(path: string, message: string) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message,
      });
    }
    // Vérification des IDs selon linkType
    switch (data.linkType) {
      case BannerLinkType.CATEGORY:
        if (!data.categoryId)
          addError("categoryId", "categoryId est requis pour ce type de lien");
        if (!data.buttonText || !data.buttonText.trim().length)
          addError("buttonText", "buttonText est requis pour ce type de lien");
        break;
      case BannerLinkType.PRODUCT:
        if (!data.productId)
          addError("productId", "productId est requis pour ce type de lien");
        if (!data.buttonText || !data.buttonText.trim().length)
          addError("buttonText", "buttonText est requis pour ce type de lien");
        break;
      case BannerLinkType.PACK:
        if (!data.packId)
          addError("packId", "packId est requis pour ce type de lien");
        if (!data.buttonText || !data.buttonText.trim().length)
          addError("buttonText", "buttonText est requis pour ce type de lien");
        break;
    }

    // Vérification des dates
    if (data.startAt && data.endAt && data.startAt >= data.endAt)
      addError(
        "endAt",
        "La date de fin doit être postérieure à la date de début"
      );
  })
  .transform(sanitizeBannerData)
  .transform(normalizeBannerLinkData);
export const bannerUpdateSchema = bannerBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    function addError(path: string, message: string) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [path],
        message,
      });
    }
    // Vérifie l'ID uniquement si linkType est fourni
    if (data.linkType) {
      switch (data.linkType) {
        case BannerLinkType.CATEGORY:
          if (!data.categoryId)
            addError(
              "categoryId",
              "categoryId est requis pour ce type de lien"
            );

          break;
        case BannerLinkType.PRODUCT:
          if (!data.productId)
            addError("productId", "productId est requis pour ce type de lien");

          break;
        case BannerLinkType.PACK:
          if (!data.packId)
            addError("packId", "packId est requis pour ce type de lien");
          break;
      }
    }

    // Vérifie les dates uniquement si elles sont toutes les deux fournies
    // if (data.startAt && data.endAt && data.startAt >= data.endAt) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     path: ["endAt"],
    //     message: "La date de fin doit être postérieure à la date de début",
    //   });
    // }
  })
  .transform(sanitizeBannerData)
  .transform(normalizeBannerLinkData);

export const bannerQuerySchema = z
  .object({
    isActive: booleanFromStringSchema.optional(),
    type: z.string().optional().transform(defaultEnum(BANNER_TYPE, "GENERAL")),
    linkType: z
      .string()
      .optional()
      .transform(defaultEnum(BANNER_LINK_TYPE, "NONE")),
  })
  .merge(dateFilterSchema)
  .merge(FilterSchema)
  .transform(sanitizeDateRange);
