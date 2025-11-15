import { ALLOWED_MIMES } from "../data/allowedNames";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import slugify from "slugify";
import multer from "multer";
import path from "path";
import fs from "fs";

export interface MyFiles {
  desktopImage?: Express.Multer.File[];
  mobileImage?: Express.Multer.File[];
}

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile?: boolean) => void
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    ALLOWED_MIMES.includes(file.mimetype as (typeof ALLOWED_MIMES)[number]) &&
    [".jpg", ".jpeg", ".png", ".webp"].includes(ext)
  )
    cb(null, true);
  else
    cb(
      new Error(
        `Seuls les fichiers images sont autorisés ! ${ALLOWED_MIMES.join(
          " - "
        )}`
      )
    );
};

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadPath = path.join(__dirname, "../../uploads/tmp");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // .png
    const name = path.basename(file.originalname, ext);
    const safeName = slugify(name, { lower: true, strict: true });
    cb(null, uniqueSuffix + "-" + safeName + ext);
  },
});

const uploadDiskStorage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).array("images", 4);

// wrapper
export const uploadDiskMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadDiskStorage(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      // Erreurs Multer (Unexpected field, file too large, etc.)
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          message: "Le champ du fichier est invalide, utilisez 'images'.",
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "La taille du fichier dépasse la limite de 10 Mo.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Erreur upload : ${err.message}`,
      });
    } else if (err) {
      // autres erreurs (ex: fileFilter)
      return res.status(400).json({
        success: false,
        message: err.message || "Erreur inconnue lors de l'upload.",
      });
    }
    next(); // passe au contrôleur
  });
};

export const uploadMemoryStorage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).single("image");

export const uploadHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file && (!req.files || (req.files as any)?.length === 0))
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Aucun fichier n'a été uploadé" });
  next();
};

export const validateBannerImages = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as MyFiles;
  if (!files || (!files.desktopImage && !files.mobileImage))
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        "Les images de la bannière sont requises (desktopImage et/ou mobileImage).",
    });
  if (!files?.desktopImage) {
    return res.status(400).json({
      success: false,
      message: "L'image desktop est obligatoire.",
    });
  }
  next();
};

// 🆕 Middleware spécialisé pour les banners (remplace les deux uploadMemoryStorage)
export const uploadBannerMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).fields([
  { name: 'desktopImage', maxCount: 1 },
  { name: 'mobileImage', maxCount: 1 }
]);
