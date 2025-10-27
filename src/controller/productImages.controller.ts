import { cleanUploadedFiles, handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { UploadResult } from "../types/type";
import { Request, Response } from "express";
import {
  deleteFromCloudinary,
  uploadBufferToCloudinary,
  uploadPathToCloudinary,
} from "../services/upload.service";
import prisma from "../config/db";
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
