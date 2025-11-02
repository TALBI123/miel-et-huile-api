import { QueryBuilderService } from "../services/queryBuilder.service";
import { allWithErrors, AllWithErrorsError } from "../utils/errors";
import { MyFiles } from "../middlewares/uploadMiddleware";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { UploadResult } from "../types/type";
import { Request, Response } from "express";
import {
  compressLargeImage,
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import prisma from "../config/db";
import { objFiltered } from "../utils/filter";
import { BannerLinkType } from "@prisma/client";
import { isEmptyObject } from "../utils/object";

type UploadImageResult =
  | UploadResult<"desktopImage">
  | UploadResult<"mobileImage">;

//  ----------------Public Controllers
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const query = QueryBuilderService.buildAdvancedQuery("banner", {...res.locals.validated});
    const banners = await prisma.banner.findMany({
      where: {},
      include: {
        product: true,
      },
    });
    if (!banners.length) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Aucune bannière trouvée",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: banners,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

//  ----------------Admin Controllers

export const createBanner = async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const funcs: Promise<UploadImageResult>[] = [];
    const { title, type, linkType } = req.body;
    const existingBanner = await prisma.banner.findFirst({
      where: {
        title,
        type,
        linkType,
      },
      select: { id: true },
    });
    if (existingBanner)
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: `Une bannière avec l'ordre ${req.body.order} existe déjà.`,
      });
    // const buffer
    console.log((req.files as MyFiles)?.desktopImage?.[0].buffer);
    console.log("avant uploader en cloudinary...");
    const bufferDestopImage = (req.files as MyFiles)?.desktopImage?.[0].buffer;
    if (bufferDestopImage)
      funcs.push(
        uploadBufferToCloudinary<"desktopImage">(
          bufferDestopImage,
          "banners",
          "desktopImage",
          "desktopPublicId"
        )
      );

    const bufferMobileImage = (req.files as MyFiles)?.mobileImage?.[0].buffer;
    if (bufferMobileImage)
      funcs.push(
        uploadBufferToCloudinary<"mobileImage">(
          bufferMobileImage,
          "banners",
          "mobileImage",
          "mobilePublicId"
        )
      );

    console.log(
      `Temps avant upload vers Cloudinary: ${Date.now() - startTime}ms`
    );

    const allPromices = await allWithErrors(funcs);
    // const obj: = {};
    const filteredObj = {
      ...res.locals.validated,
    };
    allPromices.forEach((uploadResult: UploadImageResult) => {
      const { derivedIdKey, public_id, ...rest } = uploadResult;
      Object.assign(filteredObj, {
        [derivedIdKey ?? "public_id"]: public_id,
        ...rest,
      });
    });

    // console.log(filteredObj, " filteredObj");
    const newBanner = await prisma.banner.create({
      data: filteredObj,
    });
    console.log(`Temps total: ${Date.now() - startTime}ms`);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Bannière créée avec succès",
      newBanner,
      //   data: newBanner,
    });
  } catch (err: unknown) {
    const e = err as AllWithErrorsError<UploadImageResult>;
    console.error("Erreur pendant l’upload :", e);
    // 🧹 Optionnel : supprimer les images déjà uploadées avant l’échec
    if (Array.isArray(e.fulfilled) && e.fulfilled.length)
      await Promise.allSettled(
        e.fulfilled.map((img) => deleteFromCloudinary(img.public_id))
      );

    handleServerError(res, err);
  }
};
// il dois suprime categoryId si en change productId et vis versa
export const updateBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    let allPromices;
    const funcs: Promise<UploadImageResult>[] = [];
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });
    if (!existingBanner)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Bannière non trouvée",
      });
    const bufferDestopImage = (req.files as MyFiles)?.desktopImage?.[0].buffer;
    if (bufferDestopImage)
      funcs.push(
        uploadBufferToCloudinary<"desktopImage">(
          bufferDestopImage,
          "banners",
          "desktopImage",
          "desktopPublicId"
        )
      );
    const bufferMobileImage = (req.files as MyFiles)?.mobileImage?.[0].buffer;
    if (bufferMobileImage)
      funcs.push(
        uploadBufferToCloudinary<"mobileImage">(
          bufferMobileImage,
          "banners",
          "mobileImage",
          "mobilePublicId"
        )
      );

    const filteredObj = {
      ...res.locals.validated,
    };
    if (funcs.length) {
      allPromices = await allWithErrors(funcs);
      allPromices.forEach((uploadResult: UploadImageResult) => {
        const { derivedIdKey, public_id, ...rest } = uploadResult;
        Object.assign(filteredObj, {
          [derivedIdKey ?? "public_id"]: public_id,
          ...rest,
        });
      });
    }
    const changedObj = objFiltered(existingBanner, filteredObj);
    if (isEmptyObject(changedObj))
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Aucune donnée valide fournie pour la mise à jour",
      });
    if (changedObj.linkType) {
      switch (existingBanner.linkType) {
        case BannerLinkType.PRODUCT:
          changedObj.productId = null;
          break;
        case BannerLinkType.CATEGORY:
          changedObj.categoryId = null;
          break;
        case BannerLinkType.PACK:
          changedObj.packId = null;
          break;
      }
    }
    console.log(existingBanner, " existingBanner");
    console.log(filteredObj, " filteredObj");
    console.log(changedObj, " changedObj");
    console.log(
      allPromices?.map((p) => ({
        publicId: p.public_id,
        [p.derivedIdKey as string]:
          existingBanner[p.derivedIdKey as keyof typeof existingBanner],
      })),
      "allPromices"
    );

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: changedObj,
    });
    try {
      if ((allPromices ?? [])?.length)
        await Promise.allSettled([
          allPromices?.map((p) =>
            deleteFromCloudinary(
              existingBanner[
                p.derivedIdKey as keyof typeof existingBanner
              ] as string
            )
          ) || [],
        ]);
      console.log("Suppression des anciennes images réussie");
    } catch (err) {
      console.log("Erreur lors de la suppression de l'image Cloudinary :", err);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Bannière mise à jour avec succès",
      updatedBanner,
    });
  } catch (err: unknown) {
    const e = err as AllWithErrorsError<UploadImageResult>;
    // 🧹 Optionnel : supprimer les images déjà uploadées avant l’échec
    if (Array.isArray(e.fulfilled) && e.fulfilled.length)
      await Promise.allSettled(
        e.fulfilled.map((img) => deleteFromCloudinary(img.public_id))
      );
    handleServerError(res, err);
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
      select: { mobilePublicId: true, desktopPublicId: true },
    });
    if (!existingBanner)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Bannière non trouvée",
      });
    await prisma.banner.delete({ where: { id } });
    const deletedPublicIds = [
      existingBanner.desktopPublicId,
      existingBanner.mobilePublicId,
    ].filter((elm) => elm);
    try {
      await Promise.allSettled(
        deletedPublicIds.map((publicId) =>
          deleteFromCloudinary(publicId as string)
        )
      );
      console.log("Suppression des images réussie");
    } catch (err) {
      console.log("Erreur lors de la suppression de l'image Cloudinary :", err);
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Bannière supprimée avec succès",
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
