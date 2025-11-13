"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const http_status_codes_1 = require("http-status-codes");
// import { UniquerErors } from "../utils/helpers";
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (errors.isEmpty())
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Validation failed",
            errors: errors.mapped(),
        });
    next();
};
exports.handleValidationErrors = handleValidationErrors;
//# sourceMappingURL=handleValidationMiddleware.js.map