import { ALLOWED_MIMES } from "data/allowedNames";
import { Request, Response } from "express";
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
export { uploadMemoryStorage };
