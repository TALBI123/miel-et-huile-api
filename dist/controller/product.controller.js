"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductVariant = exports.updateProductVariant = exports.createProductVariant = exports.deleteProductImage = exports.updateProductImage = exports.addProductImages = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const helpers_1 = require("../utils/helpers");
const queryBuilder_service_1 = require("../services/queryBuilder.service");
const object_1 = require("../utils/object");
const filter_1 = require("../utils/filter");
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const upload_service_1 = require("../services/upload.service");
const allowedNames_1 = require("../data/allowedNames");
const enums_1 = require("../types/enums");
const productVariant_service_1 = require("../services/productVariant.service");
const prisma = new client_1.PrismaClient();
const service = productVariant_service_1.ProductVariantService.getInstance(prisma);
// --- PUBLIC PRODUCT Controller
const getProducts = async (req, res) => {
    const { categorySlug, ...rest } = res.locals.validated;
    console.log(res.locals.validated, " req.body");
    const { page, limit } = res.locals.validated;
    let categoryId;
    try {
        if (categorySlug) {
            const existingSlug = await prisma.category.findUnique({
                where: { slug: categorySlug },
                select: { id: true },
            });
            if (!existingSlug)
                return res
                    .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                    .json({ success: false, message: "Catégorie non trouvée" });
            categoryId = existingSlug?.id;
        }
        const query = queryBuilder_service_1.QueryBuilderService.buildAdvancedQuery(enums_1.Model.PRODUCT, {
            ...(rest || {}),
            isNestedPrice: true,
            categoryId,
            nestedIsActive: { isActive: true },
            nestedModelActive: enums_1.EnumRelationTables.VARIANT,
            include: {
                variants: {
                    orderBy: { price: "asc" },
                    take: 1,
                    select: {
                        id: true,
                        price: true,
                        discountPrice: true,
                        discountPercentage: true,
                        amount: true,
                        unit: true,
                        stock: true,
                    },
                },
                images: {
                    take: 1,
                    select: {
                        image: true,
                    },
                },
            },
        });
        const [products, total] = await Promise.all([
            prisma.product.findMany(query),
            prisma.product.count({ where: query.where }),
        ]);
        if (!products.length)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Aucun produit trouvé" });
        const newProducts = products.map((p) => {
            const { images, createdAt, updatedAt, variants, ...rest } = p;
            const { id, ...variant } = variants[0] || {};
            return {
                ...rest,
                image: images.length && "image" in images[0] ? images[0]?.image : "",
                ...(variants.length ? { variantId: id, ...variant } : {}),
                createdAt,
                updatedAt,
            };
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: newProducts,
            pagination: {
                page,
                limit,
                total,
                lastPage: queryBuilder_service_1.QueryBuilderService.calculateLastPage(total, limit),
            },
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true, variants: true },
        });
        if (!product)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Produit non trouvé" });
        res.status(http_status_codes_1.StatusCodes.OK).json({ success: true, data: product });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getProductById = getProductById;
// --- AdMIN PRODUCT CRUD OPERATIONS
const createProduct = async (req, res) => {
    let imagesInfo = [];
    try {
        const existingCategory = await prisma.category.findUnique({
            where: { id: req.body.categoryId },
        });
        if (!existingCategory)
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Catégorie non trouvée",
            });
        const existingProduct = await prisma.product.findFirst({
            where: { title: req.body.title },
            select: { id: true },
        });
        if (existingProduct)
            return res
                .status(http_status_codes_1.StatusCodes.CONFLICT)
                .json({ success: false, message: "Ce produit existe déjà" });
        imagesInfo = await (0, upload_service_1.uploadPathToCloudinary)(req.files, "products");
        // console.log(imagesInfo, " imagesInfo");
        // Enregistrer la Produit dans la base de données
        const data = await prisma.product.create({
            data: {
                ...(0, object_1.filterObjectByKeys)(req.body, allowedNames_1.ALLOWED_PRODUCT_PROPERTIES),
                images: {
                    create: imagesInfo.map((img) => ({
                        image: img.secure_url,
                        publicId: img.public_id,
                    })),
                },
            },
            include: { images: true },
        });
        res
            .status(http_status_codes_1.StatusCodes.CREATED)
            .json({ success: true, message: "Produit créé avec succès", data });
    }
    catch (err) {
        try {
            if (imagesInfo.length)
                await (0, upload_service_1.deletePathToCloudinary)(imagesInfo
                    .filter((img) => img?.secure_url)
                    .map((img) => img.public_id));
        }
        catch (err) {
            console.error("Erreur lors de la suppression des images :", err);
        }
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!existingProduct)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Produit non trouvé" });
        if (req.body?.categoryId) {
            const existingCategory = await prisma.category.findUnique({
                where: { id: req.body.categoryId },
            });
            if (!existingCategory)
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Catégorie non trouvée",
                });
            if (req.body?.categoryId === existingProduct.categoryId)
                return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: "Le produit appartient déjà à cette catégorie",
                });
        }
        // Vérifier si des données valides sont fournies
        // console.log(res.locals.validated, " res.locals.validated");
        const filterdProduct = (0, object_1.filterObjectByKeys)(res.locals.validated, allowedNames_1.ALLOWED_PRODUCT_PROPERTIES);
        const { category, ...rest } = existingProduct;
        const changedObj = (0, filter_1.objFiltered)(rest, filterdProduct);
        // console.log(changedObj, "changedObj");
        if ((0, object_1.isEmptyObject)(changedObj))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Aucune donnée valide fournie pour la mise à jour",
            });
        // console.log(existingProduct, filterdProduct);
        const updateProduct = await prisma.$transaction(async (tx) => {
            const updatedProduct = await tx.product.update({
                where: { id },
                data: changedObj,
            });
            const activeProductCount = await tx.product.count({
                where: { categoryId: existingProduct.categoryId, isActive: true },
            });
            if (!activeProductCount && category.isActive) {
                await tx.category.update({
                    where: { id: category.id },
                    data: { isActive: false },
                });
            }
            else if (activeProductCount > 0 && !category.isActive) {
                await tx.category.update({
                    where: { id: category.id },
                    data: { isActive: true },
                });
            }
            return updatedProduct;
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Produit mis à jour avec succès",
            data: updateProduct,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: { images: true },
        });
        if (!existingProduct)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Produit non trouvé",
            });
        await prisma.product.delete({ where: { id } });
        // Supprimer les images de Cloudinary
        const imagesToDelete = existingProduct.images?.map((img) => img.publicId) ?? [];
        if (imagesToDelete.length) {
            const imagesDeleted = await (0, upload_service_1.deletePathToCloudinary)(imagesToDelete).catch((err) => console.error(`existing image deletion error: ${err}`));
            // console.log(" imagesDeleted", imagesDeleted);
        }
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ success: true, message: "Produit supprimé avec succès" });
    }
    catch (err) {
        console.log("⚠️ delete product error", err);
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.deleteProduct = deleteProduct;
// --- Image management for product update could be added here
const addProductImages = async (req, res) => {
    const files = req.files;
    try {
        const { id } = req.params;
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: { images: true },
        });
        if (!existingProduct) {
            (0, helpers_1.cleanUploadedFiles)(files);
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ message: "Produit non trouvé" });
        }
        const numberOfImages = existingProduct.images.length;
        if (numberOfImages >= 4) {
            (0, helpers_1.cleanUploadedFiles)(files);
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: "Le nombre maximum d'images (4) pour ce produit est déjà atteint",
            });
        }
        if (numberOfImages + files.length > 4) {
            (0, helpers_1.cleanUploadedFiles)(files);
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                message: `Vous pouvez ajouter jusqu'à ${4 - numberOfImages} images supplémentaires pour ce produit.`,
            });
        }
        const imagesInfo = await (0, upload_service_1.uploadPathToCloudinary)(req.files, "products");
        console.log("🔧 ", imagesInfo, " imagesInfo");
        // Ajouter les nouvelles images à la base de données
        await prisma.productImage.createMany({
            data: imagesInfo.map((img) => ({
                publicId: img.public_id,
                image: img.secure_url,
                productId: id,
            })),
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "Images ajoutées avec succès",
        });
    }
    catch (err) {
        (0, helpers_1.cleanUploadedFiles)(files);
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.addProductImages = addProductImages;
const updateProductImage = async (req, res) => {
    const { id, imageId } = req.params;
    let imageInfo = null;
    try {
        console.log(req.file, " req.file");
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingProduct)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Produit non trouvé" });
        const imageToUpdate = await prisma.productImage.findFirst({
            where: { id: imageId, productId: id },
        });
        if (!imageToUpdate)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Image non trouvée pour ce produit" });
        imageInfo = await (0, upload_service_1.uploadBufferToCloudinary)(req.file.buffer, "products");
        const updatedImage = await prisma.productImage.update({
            where: { id: imageId },
            data: {
                publicId: imageInfo?.public_id,
                image: imageInfo?.secure_url,
            },
        });
        console.log("🔧 ", updatedImage, " updatedImage");
        if (imageToUpdate?.publicId)
            await (0, upload_service_1.deleteFromCloudinary)(imageToUpdate.publicId).catch((err) => console.log("Failed to Delete old image", err));
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Image mise à jour avec succès",
            data: updatedImage,
        });
    }
    catch (err) {
        if (imageInfo?.public_id) {
            try {
                await (0, upload_service_1.deleteFromCloudinary)(imageInfo.public_id);
            }
            catch (err) {
                console.warn("Échec de la suppression de l'image après une erreur de création de produit", err);
            }
        }
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.updateProductImage = updateProductImage;
const deleteProductImage = async (req, res) => {
    const { id, imageId } = req.params;
    let imageToUpdate;
    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!existingProduct)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Produit non trouvé" });
        imageToUpdate = await prisma.productImage.findFirst({
            where: { id: imageId, productId: id },
        });
        if (!imageToUpdate)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ success: false, message: "Image non trouvée pour ce produit" });
        await prisma.productImage.delete({ where: { id: imageId } });
        if (imageToUpdate?.publicId) {
            try {
                await (0, upload_service_1.deleteFromCloudinary)(imageToUpdate.publicId);
            }
            catch (err) {
                console.error("Failed to delete image from Cloudinary:", err);
            }
        }
        res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ success: true, message: "l'image a été supprimée avec succès" });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.deleteProductImage = deleteProductImage;
// --- PRODUCT VARIANT MANAGEMENT
const createProductVariant = async (req, res) => {
    const { productType, size, amount, unit } = res.locals.validated;
    const { id } = req.params;
    const isHasSize = productType === client_1.ProductType.CLOTHING;
    try {
        // console.log(res.locals.validated, " req.body");
        const existingProduct = await service.getExistingProduct({ id, key: "title" });
        // console.log(existingProduct);
        // existingProduct?.category
        if (!existingProduct)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Produit non trouvé",
            });
        const where = {
            ...(isHasSize ? { size } : { amount }),
            productId: id,
        };
        console.log(where);
        const existingAmount = await prisma.productVariant.findFirst({
            where,
            select: { id: true },
        });
        if (existingAmount)
            return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                success: false,
                message: "Cette variante existe déjà",
            });
        const filteredData = (0, object_1.filterObjectByKeys)(res.locals.validated, (0, filter_1.getAllowedPropertiesForProductType)(productType));
        const name = service.generateUniqueName(existingProduct.title);
        const sku = service.generateSKU({
            title: existingProduct.title,
            productType,
            ...(isHasSize ? { size } : { amount, unit: unit }),
        });
        const variantData = {
            ...filteredData,
            ...(productType !== client_1.ProductType.HONEY ? { productType } : {}),
            productId: id,
            name,
            sku,
        };
        console.log(filteredData);
        const data = await prisma.$transaction(async (tx) => {
            const variant = await tx.productVariant.create({
                data: variantData,
            });
            // console.log(existingProduct);
            if (!existingProduct.category.isActive)
                await tx.category.update({
                    where: { id: existingProduct.category.id },
                    data: { isActive: true },
                    select: { id: true },
                });
            if (!existingProduct.isActive)
                await tx.product.update({
                    where: { id },
                    data: { isActive: true },
                    select: { id: true },
                });
            return variant;
        });
        // const createdVariant = await prisma.productVariant.create({
        //   data: {
        //     ...filterObjectByKeys<
        //       Omit<ProductVariant, "productId">,
        //       (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
        //     >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
        //     productId: id,
        //   },
        // });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            data,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.createProductVariant = createProductVariant;
const updateProductVariant = async (req, res) => {
    try {
        const { variantId, id } = req.params;
        const { productType } = res.locals.validated;
        const existingProduct = await service.getExistingProduct({ id });
        if (!existingProduct)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Produit non trouvé",
            });
        const existingVariant = (await service.getProductVariantById(variantId, [
            "amount",
            "size",
            "productId",
        ]));
        if (!existingVariant)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Variant non trouvé",
            });
        if (existingVariant.productId !== id)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Produit ou variant ne correspond pas au produit",
            });
        const updatedData = {
            ...(0, object_1.filterObjectByKeys)(res.locals.validated, allowedNames_1.ALLOWED_PRODUCT_VARIANT_PROPERTIES),
        };
        const changedObj = (0, filter_1.objFiltered)(existingVariant, updatedData);
        // console.log(res.locals.validated, " res.locals.validated hnaya", req.body);
        if (changedObj?.amount && changedObj.amount !== existingVariant.amount) {
            const amountExists = await prisma.productVariant.findFirst({
                where: { amount: changedObj.amount, productId: id },
            });
            if (amountExists)
                return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                    success: false,
                    message: "Cette variante existe déjà",
                });
        }
        else if (changedObj?.size && existingVariant.size !== changedObj.size) {
            const sizeExists = await prisma.productVariant.findFirst({
                where: { size: changedObj.size, productId: id },
            });
            if (sizeExists)
                return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
                    success: false,
                    message: "Cette variante existe déjà",
                });
        }
        // Construire l'objet Produit mis à jour
        // const updatedData = {
        //   ...filterObjectByKeys<
        //     Partial<ProductVariant>,
        //     (typeof ALLOWED_PRODUCT_VARIANT_PROPERTIES)[number]
        //   >(res.locals.validated, ALLOWED_PRODUCT_VARIANT_PROPERTIES),
        // };
        // const changedObj = objFiltered(existingVariant, updatedData);
        // console.log(changedObj, " changedObj");
        if ((0, object_1.isEmptyObject)(changedObj))
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Aucune donnée valide fournie pour la mise à jour",
            });
        const updatedVariant = await prisma.$transaction(async (tx) => {
            const variant = await tx.productVariant.update({
                where: { id: variantId },
                data: changedObj,
            });
            console.log("varaints a bro ", variant);
            const activeVariantsCount = await tx.productVariant.count({
                where: { productId: id, isActive: true },
            });
            if (!activeVariantsCount && existingProduct.isActive) {
                await tx.product.update({
                    where: { id },
                    data: { isActive: false },
                    select: { id: true },
                });
                const activeProductsCount = await tx.product.count({
                    where: { categoryId: existingProduct.category.id, isActive: true },
                });
                if (!activeProductsCount && existingProduct.isActive)
                    console.log("product.update est excuter ...");
                await tx.category.update({
                    where: { id: existingProduct.category.id },
                    data: { isActive: false },
                    select: { id: true },
                });
            }
            else if (!existingProduct.isActive && activeVariantsCount > 0) {
                console.log("product.update est excuter ...");
                await tx.product.update({
                    where: { id },
                    data: { isActive: true },
                    select: { id: true },
                });
                if (!existingProduct.category.isActive)
                    await tx.category.update({
                        where: { id: existingProduct.category.id },
                        data: { isActive: true },
                        select: { id: true },
                    });
            }
            return variant;
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "le variante ajoutées avec succès",
            data: updatedVariant,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.updateProductVariant = updateProductVariant;
const deleteProductVariant = async (req, res) => {
    const { id, variantId } = req.params;
    try {
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });
        if (!existingProduct)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Produit non trouvé",
            });
        const existingVariant = await prisma.productVariant.findUnique({
            where: { id: variantId },
        });
        if (!existingVariant)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Variant non trouvé",
            });
        if (existingVariant.productId !== id)
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Produit ou variant ne correspond pas au produit",
            });
        await prisma.productVariant.delete({ where: { id: variantId } });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "le variante a été supprimée avec succès",
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.deleteProductVariant = deleteProductVariant;
// if (discountPrice !== undefined) {
//   if (discountPrice >= price)
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       success: false,
//       message: "Le prix de réduction doit être inférieur au prix initial",
//     });
//   finalDiscountPrice = discountPrice;
//   finalDiscountPercentage = 100 - (100 * discountPrice) / price;
// }
// if (discountPercentage != undefined) {
//   if (discountPercentage >= 100)
//     return res.status(StatusCodes.BAD_REQUEST).json({
//       success: false,
//       message: "Le pourcentage de réduction doit être inférieur à 100",
//     });
//   if (finalDiscountPrice === undefined) {
//     finalDiscountPrice = price * (1 - discountPercentage / 100);
//     finalDiscountPercentage = discountPercentage;
//   }
// }
// if (finalDiscountPrice !== undefined) {
//   variants.discountPercentage = finalDiscountPercentage as number;
//   variants.discountPrice = finalDiscountPrice as number;
// }
//# sourceMappingURL=product.controller.js.map