import { ALLOWED_MIMES } from "../data/allowedNames";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Seuls les fichiers images sont autorisés !"));
};

const uploadMemoryStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Aucun fichier téléchargé !" });
  next();
};
export { uploadMemoryStorage, uploadHandler };
