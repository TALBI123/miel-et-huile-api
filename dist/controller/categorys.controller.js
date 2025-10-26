"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategorys = void 0;
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const helpers_1 = require("../utils/helpers");
const upload_service_1 = require("../services/upload.service");
const queryBuilder_service_1 = require("../services/queryBuilder.service");
const object_1 = require("../utils/object");
const allowedNames_1 = require("../data/allowedNames");
const filter_1 = require("../utils/filter");
const enums_1 = require("../types/enums");
const prisma = new client_1.PrismaClient();
// --- PUBLIC CATEGORY Controller
const getAllCategorys = async (req, res) => {
    try {
        // console.log(res.locals.validated, "res.locals.validated",req.query);
        const { page, limit } = res.locals.validated || {};
        // console.log(res.locals.validated, "res.locals.validated");
        const query = queryBuilder_service_1.QueryBuilderService.buildAdvancedQuery(enums_1.Model.CATEGORY, {
            ...(res.locals.validated || {}),
            nestedIsActive: { isActive: true },
            nestedModelActive: enums_1.EnumRelationTables.PRODUCT,
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        // const query = buildProductQuery({
        //   ...(res.locals.validated || {}),
        //   // ...(mode ? { relationFilter: { relation: "products", mode } } : {}),
        //   relationName: "products",
        //   isNestedPrice: true,
        //   ...(nestedIsActive ? { nested: { isActive: true } } : {}),
        //   include: {
        //     _count: {
        //       select: { products: true },
        //     },
        //   },
        //   // extraWhere: { isActive: true}
        // });
        const [data, lastPage] = await Promise.all([
            prisma.category.findMany(query),
            prisma.category.count({ where: query.where }),
        ]);
        if (!data)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Catégorie non trouvée", data });
        const newData = data.map((cat) => {
            const { _count, createdAt, updatedAt, ...rest } = cat;
            const productsCount = "products" in _count ? _count.products : 0;
            return {
                ...rest,
                productsCount,
                createdAt,
                updatedAt,
            };
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: newData,
            pagination: {
                page,
                limit,
                total: data.length,
                lastPage: queryBuilder_service_1.QueryBuilderService.calculateLastPage(lastPage, limit),
            },
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getAllCategorys = getAllCategorys;
// ---  AdMIN CATEGORY CRUD OPERATIONS
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma.category.findUnique({
            where: { id },
            include: {
                products: true,
            },
        });
        if (!data)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Catégorie non trouvée" });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getCategoryById = getCategoryById;
const createCategory = async (req, res) => {
    let imageInfo;
    try {
        // console.log(req.file, "jjj");
        const { name, description } = req.body;
        const existingCategory = await prisma.category.findUnique({
            where: { name },
            select: { id: true },
        });
        if (existingCategory)
            return res
                .status(http_status_codes_1.StatusCodes.CONFLICT)
                .json({ success: false, message: "Cette catégorie existe déjà" });
        // ✅ Upload Cloudinary (pas besoin de vérifier req.file, middleware garantit sa présence)
        imageInfo = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "categories");
        // Enregistrer la catégorie dans la base de données
        const newCategory = await prisma.category.create({
            data: {
                name,
                description: description ?? "",
                image: imageInfo.secure_url,
                publicId: imageInfo.public_id,
                slug: (0, helpers_1.generateSlug)(name),
            },
        });
        return res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: "Catégorie créée avec succès",
            data: newCategory,
        });
    }
    catch (err) {
        try {
            if (imageInfo?.public_id)
                await (0, upload_service_1.deleteFromCloudinary)(imageInfo.public_id);
        }
        catch (err) {
            console.error("Erreur lors de la suppression de l'image Cloudinary :", err);
        }
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.createCategory = createCategory;
const updateCategory = async (req, res) => {
    let imageInfo;
    try {
        const { id } = req.params;
        const body = res.locals.validated;
        const existingCategory = await prisma.category.findUnique({
            where: { id },
        });
        if (!existingCategory)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Catégorie non trouvée" });
        const updatedData = {
            ...(0, object_1.filterObjectByKeys)(body, allowedNames_1.ALLOWED_CATEGORY_PROPERTIES),
        };
        if (body?.name)
            updatedData.slug = (0, helpers_1.generateSlug)(body.name);
        // 🔹 Upload de la nouvelle image
        if (req.file) {
            imageInfo = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "categories");
            updatedData.image = imageInfo.secure_url;
            updatedData.publicId = imageInfo.public_id;
        }
        // console.log(existingCategory, updatedData);
        const changedObj = (0, filter_1.objFiltered)(existingCategory, updatedData);
        // console.log(changedObj, "changedObj");
        if ((0, object_1.isEmptyObject)(changedObj))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Aucune donnée valide fournie pour la mise à jour",
            });
        const updateCategory = await prisma.category.update({
            data: changedObj,
            where: { id },
            // select: { id: true },
        });
        // 🔹 Supprimer l’ancienne image seulement si tout a réussi
        if (req.file && existingCategory.publicId) {
            try {
                await (0, upload_service_1.deleteFromCloudinary)(existingCategory.publicId);
            }
            catch (err) {
                console.error("❗ Suppression ancienne image échouée :", err.message);
            }
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Catégorie mise à jour avec succès",
            data: updateCategory,
        });
    }
    catch (err) {
        try {
            if (imageInfo?.public_id)
                await (0, upload_service_1.deleteFromCloudinary)(imageInfo.public_id);
        }
        catch (err) {
            console.error("Erreur lors de la suppression de l'image Cloudinary :", err);
        }
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.updateCategory = updateCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const existingCategory = await prisma.category.findUnique({
            where: { id },
            select: {
                publicId: true,
                products: {
                    select: {
                        id: true,
                        images: { select: { publicId: true } },
                    },
                },
            },
        });
        if (!existingCategory)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Category n'existe pas" });
        const { publicId, products } = existingCategory;
        const publicIdOfImages = products.reduce((acc, { images }) => {
            for (const { publicId } of images)
                if (publicId)
                    acc.push(publicId);
            return acc;
        }, []);
        await prisma.category.delete({ where: { id } });
        try {
            if (publicIdOfImages.length) {
                const { success, failed } = await (0, upload_service_1.deletePathToCloudinary)(publicIdOfImages);
                console.log(success, failed);
                if (failed.length)
                    console.log("❗ Certaines images n'ont pas pu être supprimées :", failed);
            }
        }
        catch (err) {
            console.log("❗ Suppression des images des produits échouée :", err);
        }
        if (publicId) {
            try {
                await (0, upload_service_1.deleteFromCloudinary)(publicId);
            }
            catch (err) {
                console.error("❗ Suppression de l'image de la catégorie échouée :", err);
            }
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "La catégorie a été supprimée avec succès",
            products,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categorys.controller.js.map