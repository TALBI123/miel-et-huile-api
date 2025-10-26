"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkItemsArray = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const checkItemsArray = async (req, res, next) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0)
        return res.status(400).json({ success: false, message: "Items requis" });
    if (items.length > 50)
        return res.status(400).json({ success: false, message: "Max 50 items" });
    next();
};
exports.checkItemsArray = checkItemsArray;
//# sourceMappingURL=checkItemsArray%20.js.map