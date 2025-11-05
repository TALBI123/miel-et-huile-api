import { OrderStatus, PrismaClient } from "@prisma/client";
import { handleServerError, timeAgo } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { Model } from "../types/enums";
import { QueryBuilderService } from "../services/queryBuilder.service";
import prisma from "../config/db";

export const getAllPacks = async (req: Request, res: Response) => {

    try{
        const packs = await prisma.pack.findMany();

        res.status(StatusCodes.OK).json({
            success:true,
            data:packs
        });
    }catch(err){
        handleServerError(res,err):
    }
}
export const createPack = async (req: Request, res: Response) => {
    try{
        
    }catch(err){
        handleServerError(res,err)
    }
}
export const updatePack = async(req : Request,res: Response) => {
    try  {
        const { id } = req.params;
        const { name, description, price } = req.body;

        const updatedPack = await prisma.pack.update({
            where: { id: Number(id) },
            data: { name, description, price }
        });

        res.status(StatusCodes.OK).json({
            success: true,
            data: updatedPack
        });
    }catch(err){
        handleServerError(res,err)
    }
}
const deletePack = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // await prisma.pack.delete({
        //     where: { id: Number(id) }
        // });

        res.status(StatusCodes.OK).json({
            success: true,
            message: "Pack deleted successfully"
        });
    }catch(err){
        handleServerError(res,err)
    }
}