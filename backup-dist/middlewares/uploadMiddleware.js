"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadHandler = exports.uploadMemoryStorage = exports.uploadDiskMiddleware = void 0;
const allowedNames_1 = require("../data/allowedNames");
const http_status_codes_1 = require("http-status-codes");
const slugify_1 = __importDefault(require("slugify"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedNames_1.ALLOWED_MIMES.includes(file.mimetype) &&
        [".jpg", ".jpeg", ".png", ".webp"].includes(ext))
        cb(null, true);
    else
        cb(new Error(`Seuls les fichiers images sont autorisés ! ${allowedNames_1.ALLOWED_MIMES.join(" - ")}`));
};
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, "../../uploads/tmp");
        if (!fs_1.default.existsSync(uploadPath))
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname); // .png
        const name = path_1.default.basename(file.originalname, ext);
        const safeName = (0, slugify_1.default)(name, { lower: true, strict: true });
        cb(null, uniqueSuffix + "-" + safeName + ext);
    },
});
const uploadDiskStorage = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
}).array("images", 4);
// wrapper
const uploadDiskMiddleware = (req, res, next) => {
    uploadDiskStorage(req, res, (err) => {
        if (err instanceof multer_1.default.MulterError) {
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
        }
        else if (err) {
            // autres erreurs (ex: fileFilter)
            return res.status(400).json({
                success: false,
                message: err.message || "Erreur inconnue lors de l'upload.",
            });
        }
        next(); // passe au contrôleur
    });
};
exports.uploadDiskMiddleware = uploadDiskMiddleware;
exports.uploadMemoryStorage = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter,
}).single("image");
const uploadHandler = (req, res, next) => {
    if (!req.file && (!req.files || req.files?.length === 0))
        return res
            .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
            .json({ message: "Aucun fichier n’a été uploadé" });
    next();
};
exports.uploadHandler = uploadHandler;
//# sourceMappingURL=uploadMiddleware.js.map