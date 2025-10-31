import { ValidationId } from "./validation.shema";
import { BannerLinkType, BannerType } from "@prisma/client";
import { BANNER_LINK_TYPE, BANNER_TYPE } from "../data/constants";
import { z } from "zod";
const validationUUID = z.uuid("L'ID doit être un UUID valide").optional();
// export const bannerSchema = z
//   .object({
//     text: z
//       .string({ message: "Le texte de la bannière est requis" })
//       .min(1, "Le texte de la bannière ne peut pas être vide"),
//     title: z
//       .string()
//       .min(1, "Le titre de la bannière ne peut pas être vide")
//       .optional(),
//     buttonText: z
//       .string({ message: "Le texte du bouton est requis" })
//       .min(1, "Le texte du bouton ne peut pas être vide"),
//     linkType: z.enum(["INTERNAL", "EXTERNAL"], {
//       message: "Le type de lien doit être 'INTERNAL' ou 'EXTERNAL'",
//     }),
//     productId: validationUUID,
//     categoryId: validationUUID,
//     packId: validationUUID,
//     isActive: z.boolean().default(false),
//   })
//   .refine((data) => {
//     console.log(data, " data in bannerSchema refine");
//   });

export const bannerBaseSchema = z.object({
  text: z
    .string({ message: "Le texte de la bannière est requis" })
    .min(1, "Le texte de la bannière ne peut pas être vide"),
  title: z
    .string()
    .min(1, "Le titre de la bannière ne peut pas être vide")
    .optional(),
  buttonText: z
    .string({ message: "Le texte du bouton est requis" })
    .min(1, "Le texte du bouton ne peut pas être vide"),
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
  isActive: z.boolean().default(false),
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
    // Vérification des IDs selon linkType
    switch (data.linkType) {
      case BannerLinkType.CATEGORY:
        if (!data.categoryId)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["categoryId"],
            message: "categoryId est requis pour ce type de lien",
          });
        break;
      case BannerLinkType.PRODUCT:
        if (!data.productId)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["productId"],
            message: "productId est requis pour ce type de lien",
          });
        break;
      case BannerLinkType.PACK:
        if (!data.packId)
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["packId"],
            message: "packId est requis pour ce type de lien",
          });
        break;
    }

    // Vérification des dates
    if (data.startAt && data.endAt && data.startAt >= data.endAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endAt"],
        message: "La date de fin doit être postérieure à la date de début",
      });
    }
  });
export const bannerUpdateSchema = bannerBaseSchema
  .partial()
  .superRefine((data, ctx) => {
    // Vérifie l'ID uniquement si linkType est fourni
    if (data.linkType) {
      switch (data.linkType) {
        case BannerLinkType.CATEGORY:
          if (!data.categoryId)
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["categoryId"],
              message: "categoryId est requis pour ce type de lien",
            });
          break;
        case BannerLinkType.PRODUCT:
          if (!data.productId)
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["productId"],
              message: "productId est requis pour ce type de lien",
            });
          break;
        case BannerLinkType.PACK:
          if (!data.packId)
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["packId"],
              message: "packId est requis pour ce type de lien",
            });
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
  });
