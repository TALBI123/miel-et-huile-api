"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserById = exports.deleteUser = exports.getAllUsers = exports.getProffile = exports.getCurrentUser = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const http_status_codes_1 = require("http-status-codes");
const prisma = new client_1.PrismaClient();
// Middleware pour authentifier les requêtes protégées
const getCurrentUser = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: { id: true, email: true, role: true }, // rôle ici
        });
        prisma.category.findMany({
            where: {},
            include: { products: true }
        });
        console.log(req.user);
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Utilisateur non trouvé",
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            user,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getCurrentUser = getCurrentUser;
const getProffile = async (req, res) => {
    try {
        const ALLOWED_User_FIELDS = [
            "id",
            "email",
            "firstName",
            "lastName",
            "role",
            "phoneNumber",
            "postalCode",
            "country",
            "city",
            "address",
            "createdAt",
            "updatedAt",
        ];
        const selectUserFields = ALLOWED_User_FIELDS.reduce((acc, field) => ({ ...acc, [field]: true }), {});
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: selectUserFields,
        });
        if (!user) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Utilisateur non trouvé",
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: user,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getProffile = getProffile;
const getAllUsers = async (req, res) => {
    try {
        const data = await prisma.user.findMany();
        res.status(200).json({ message: "all users", success: true, users: data });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getAllUsers = getAllUsers;
const deleteUser = async (req, res) => {
    try {
        const data = await prisma.user.delete({
            where: { email: req.user?.email },
        });
        console.log(data);
        res
            .status(200)
            .json({ message: "user deleted successfully", success: true });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.deleteUser = deleteUser;
// Supprimer un utilisateur par son ID (accessible uniquement aux admins)
const deleteUserById = async (req, res) => {
    const { id } = req.query;
    try {
        const user = await prisma.user.delete({
            where: { id: id },
        });
        res.status(200).json({ message: "User deleted successfully", user });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.deleteUserById = deleteUserById;
//# sourceMappingURL=user.controller.js.map