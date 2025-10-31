import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
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
    console.log(req.files)
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Bannière créée avec succès",
      //   data: newBanner,
    });
  } catch (err) {
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
