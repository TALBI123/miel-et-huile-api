import { MyFiles } from "../middlewares/uploadMiddleware";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { UploadResult } from "../types/type";
import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
} from "../services/upload.service";
import prisma from "../config/db";
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
  const imagesInfo: (
    | UploadResult<"desktopImage">
    | UploadResult<"mobileImage">
  )[] = [];
  const buffers: Buffer[] = [];
  try {
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
      const UploadResult = await uploadBufferToCloudinary<"desktopImage">(
        bufferDestopImage,
        "banners",
        "desktopImage"
      );
      imagesInfo.push(UploadResult);
    }
    const bufferMobileImage = (req.files as MyFiles)?.mobileImage?.[0].buffer;
    if (bufferMobileImage) {
      const UploadResult = await uploadBufferToCloudinary<"mobileImage">(
        bufferMobileImage,
        "banners",
        "mobileImage"
      );
      imagesInfo.push(UploadResult);
    }
    console.log(imagesInfo, res.locals.validated);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Bannière créée avec succès",
      //   data: newBanner,
    });
  } catch (err) {
    console.error("Erreur pendant l’upload :", err);

    // 🧹 Optionnel : supprimer les images déjà uploadées avant l’échec

    if (Array.isArray(imagesInfo) && imagesInfo.length) {
      await Promise.allSettled(
        imagesInfo.map((img) => deleteFromCloudinary(img.public_id))
      );
    }

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
