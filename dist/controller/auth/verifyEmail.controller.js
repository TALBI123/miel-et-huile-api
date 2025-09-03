"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const verifyEmail = async (req, res) => {
    const token = req.query.token;
    if (!token)
        res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json("Not Founde");
    try {
    }
    catch (err) { }
};
//# sourceMappingURL=verifyEmail.controller.js.map