import { MyFiles } from "../middlewares/uploadMiddleware";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { allWithErrors, AllWithErrorsError } from "../utils/errors";
import { UploadResult } from "../types/type";
import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import prisma from "../config/db";
type UploadImageResult =
  | UploadResult<"desktopImage">
  | UploadResult<"mobileImage">;
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const banners = await prisma.banner.findMany({
      where: {},
      include: {
        product: true,
      },
    });

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
  try {
    const imagesInfo: UploadImageResult[] = [];
    const funcs: Promise<UploadImageResult>[] = [];
    // const newBanner = await prisma.banner.create({
    //   data: req.body,
    // });
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
    const bufferDestopImage = (req.files as MyFiles)?.desktopImage?.[0].buffer;
    if (bufferDestopImage) {
      // const UploadResult = await uploadBufferToCloudinary<"desktopImage">(
      //   bufferDestopImage,
      //   "banners",
      //   "desktopImage"
      // ); imagesInfo.push(UploadResult);
      funcs.push(
        uploadBufferToCloudinary<"desktopImage">(
          bufferDestopImage,
          "banners",
          "desktopImage",
          "desktopPublicId"
        )
      );
    }
    const bufferMobileImage = (req.files as MyFiles)?.mobileImage?.[0].buffer;
    if (bufferMobileImage) {
      // const UploadResult = await uploadBufferToCloudinary<"mobileImage">(
      //   bufferMobileImage,
      //   "banners",
      //   "mobileImage"
      // );
      // imagesInfo.push(UploadResult);
      funcs.push(
        uploadBufferToCloudinary<"mobileImage">(
          bufferMobileImage,
          "banners",
          "mobileImage",
          "mobilePublicId"
        )
      );
    }
    const allPromices = await allWithErrors(funcs);
    const obj: Record<string, string> = {};
    allPromices.forEach((uploadResult: UploadImageResult) => {
      const { derivedIdKey, public_id, ...rest } = uploadResult;
      Object.assign(obj, {
        [derivedIdKey ?? "public_id"]: public_id,
        ...rest,
      });
    });
    const filteredObj = {
      ...res.locals.validated,
      ...obj,
    };
    const newBanner = await prisma.banner.create({
      data: filteredObj,
    });
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

export const updateBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });
    if (!existingBanner)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Bannière non trouvée",
      });

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: req.body,
    });
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Bannière mise à jour avec succès",
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};
