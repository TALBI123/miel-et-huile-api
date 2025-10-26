"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const errorHandler = (err, req, res, _next) => {
    if (res.headersSent) {
        return; // si la réponse est déjà envoyée
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        switch (err.code) {
            case "P2002":
                return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                    success: false,
                    message: "Cette ressource existe déjà",
                    errorCode: "UNIQUE_CONSTRAINT_FAILED",
                });
            case "P2003":
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Clé étrangère invalide",
                    errorCode: "FOREIGN_KEY_CONSTRAINT_FAILED",
                });
            case "P2025":
                return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: "Ressource introuvable",
                    errorCode: "RESOURCE_NOT_FOUND",
                });
        }
    }
    console.error("Unhandled server error:", err);
    return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur serveur interne",
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=handleErrors.js.map