"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedPropertiesForProductType = exports.objFiltered = exports.buildProductQuery = exports.buildRelationsFilter = void 0;
const allowedNames_1 = require("../data/allowedNames");
const queryBuilder_service_1 = require("../services/queryBuilder.service");
const client_1 = require("@prisma/client");
const buildRelationFilter = (relationName, mode, nested) => {
    if (!relationName)
        return {};
    switch (mode.trim()) {
        case "with":
            return { [relationName]: { some: nested || {} } };
        case "without":
            return { [relationName]: { none: nested || {} } };
        default:
            return {};
    }
};
const buildRelationsFilter = (relations) => {
    const filters = {};
    const handle = (relation) => {
        const { relation: rel, mode, nested } = relation;
        console.log(rel, mode, nested, " buildRelationsFilter");
        filters[rel] = buildRelationFilter(rel, mode, nested)[rel];
    };
    if (Array.isArray(relations)) {
        relations.forEach(handle);
    }
    else {
        handle(relations);
    }
    return filters;
};
exports.buildRelationsFilter = buildRelationsFilter;
const buildProductQuery = (options) => {
    const { page = 1, limit = 5, category, search, isActive, onSale, minPrice, maxPrice, inStock, mode = "all", isNestedPrice = false, 
    // relationFilter,
    champPrice = "price", relationName, nested, orderBy, include, extraWhere, } = options;
    let where = {
        ...(category ? { categoryId: category } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
        ...(onSale !== undefined ? { onSale } : {}),
        ...(inStock !== undefined ? { inStock } : {}),
        ...(extraWhere ?? {}),
        ...(relationName !== undefined && mode
            ? buildRelationFilter(relationName, mode, nested)
            : {}),
    };
    if (allowedNames_1.ALLOWED_FILTERING_TABLES.includes(relationName) &&
        (minPrice !== undefined || maxPrice !== undefined)) {
        const priceFilter = {
            [champPrice]: {
                ...(minPrice ? { gte: minPrice } : {}),
                ...(maxPrice ? { lte: maxPrice } : {}),
            },
        };
        if (isNestedPrice) {
            where[relationName] = {
                some: {
                    ...(where[relationName]?.some ?? {}),
                    ...priceFilter,
                },
            };
        }
        else
            Object.assign(where, priceFilter);
    }
    const { skip, take } = queryBuilder_service_1.QueryBuilderService.paginate({ page, limit });
    return {
        where,
        skip,
        take,
        ...(orderBy ? { orderBy } : {}),
        include: include ?? {},
    };
};
exports.buildProductQuery = buildProductQuery;
const objFiltered = (oldObj, newObj) => {
    let filteredObj = {};
    for (const [key, value] of Object.entries(newObj)) {
        // problem oldObj[key as K] && value !== oldObj[key as K] en cas oldObj[key as K] peux boolean ca casse le competement attendu
        if (value !== oldObj[key])
            filteredObj[key] = value;
    }
    return filteredObj;
};
exports.objFiltered = objFiltered;
const getAllowedPropertiesForProductType = (productType) => {
    switch (productType) {
        case client_1.ProductType.DATES:
        case client_1.ProductType.HONEY:
            return allowedNames_1.ALLOWED_PRODUCT_VARIANT_PROPERTIES;
        case client_1.ProductType.CLOTHING:
            return [...allowedNames_1.ALLOWED_PRODUCT_VARIANT_PROPERTIES, "size"];
        default:
            return [];
    }
};
exports.getAllowedPropertiesForProductType = getAllowedPropertiesForProductType;
//# sourceMappingURL=filter.js.map