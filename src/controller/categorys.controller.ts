import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "types/type";
import { generateSlug, handleServerError } from "../utils/helpers";
const prisma = new PrismaClient();
interface CategoryData {
  name: string;
  desciption?: string;
  slug?: string;
  image?: string;
  publicId?: string;
}

export const getAllCategorys = async (
  req: Request<{}, {}>,
  res: Response<ApiResponse<CategoryData[] | null>>
) => {
  try {
    const data = await prisma.category.findMany();
    res.status(StatusCodes.OK).json({ success: true, data });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const createCategory = async (
  req: Request<{}, {}, CategoryData>,
  res: Response
) => {
  try {
    console.log(req.file);
    const { name, desciption } = req.body;
    const existingCategory = await prisma.category.findUnique({
      where: { name },
      select: { id: true },
    });
    if (existingCategory)
      return res
        .status(StatusCodes.CONFLICT)
        .json({ success: false, message: "Category est déja existe" });
    
    // await prisma.category.create({
    //   data: {
    //     name,
    //     description: desciption ?? "",
    //     image: "",
    //     publicId: "",
    //     slug: generateSlug(name),
    //   },
    // });
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "File uploaded" });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const updateCategory = async (req: Request, res: Response) => {
  try {
    
  } catch (err) {
    handleServerError(res, err);
  }
};
