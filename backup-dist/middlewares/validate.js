"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEmptyRequestBody = exports.validate = void 0;
const http_status_codes_1 = require("http-status-codes");
const object_1 = require("../utils/object");
const zod_1 = require("zod");
const validate = ({ schema, key = "body", skipSave = false, }) => (req, res, next) => {
    try {
        const parsed = schema.parse(req[key] ?? {});
        console.log("steal here");
        if (skipSave)
            res.locals.validated = parsed ?? {};
        // console.log(parsed, " parsed validate",skipSave);
        // console.log(skipSave, parsed, " skipSave");
        // console.log(res.locals.validated, " res.locals.validated");
        next();
    }
    catch (err) {
        if (err instanceof zod_1.ZodError) {
            const errorsMap = {};
            const errors = err.issues.reduce((acc, err) => {
                const field = err.path.join(".");
                if (!errorsMap[field]) {
                    errorsMap[field] = true;
                    acc.push({ field, message: err.message });
                }
                return acc;
            }, []);
            // console.log(err.issues);
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ errors });
        }
        console.error(err);
        return res
            .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
            .json({ message: "Une erreur serveur est survenue" });
    }
};
exports.validate = validate;
const checkEmptyRequestBody = (req, res, next) => {
    if (!req.file && (0, object_1.isEmptyObject)(req.body || {}))
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Aucune donnée valide fournie pour la mise à jour",
        });
    next();
};
exports.checkEmptyRequestBody = checkEmptyRequestBody;
//# sourceMappingURL=validate.js.map