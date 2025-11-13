"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilderService = void 0;
const allowedNames_1 = require("../data/allowedNames");
const enums_1 = require("../types/enums");
class QueryBuilderService {
    static buildCommonFilters(options, allowedFilters = [], searchName = "title") {
        const where = {};
        const { status, paymentStatus, isActive, search, extraWhere, startDate, endDate, isNestedActive, nestedModelActive, nestedIsActive, } = options;
        if (allowedFilters.includes("isActive") && isActive !== undefined)
            where.isActive = isActive;
        if (allowedFilters.includes("search") && search)
            where[searchName] = { contains: search, mode: "insensitive" };
        if (allowedFilters.includes("status") &&
            status &&
            allowedNames_1.ALLOWED_ORDER_STATUSES.includes(status))
            where.status = status;
        if (allowedFilters.includes("paymentStatus") &&
            paymentStatus &&
            allowedNames_1.ALLOWED_ORDER_PAYMENT_STATUSES.includes(paymentStatus))
            where.paymentStatus = paymentStatus;
        if (allowedFilters.includes("isNestedActive") &&
            isNestedActive &&
            nestedIsActive)
            where[nestedModelActive] = {
                some: {
                    ...nestedIsActive,
                },
            };
        if (startDate !== undefined || endDate !== undefined)
            where.createdAt = {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
            };
        if (extraWhere)
            Object.assign(where, extraWhere);
        return where;
    }
    static buildAdvancedQuery(table, options) {
        const { page = 1, limit = 10, minPrice, maxPrice, isNestedPrice, productType, champPrice, mode = "all", extraWhere, include, orderBy, select, } = options;
        let where = {
            ...(extraWhere ? extraWhere : {}),
        };
        const priceOptions = {
            minPrice,
            maxPrice,
            isNestedPrice,
            champPrice,
            mode,
        };
        console.log("Product Type in Query Builder: ", productType);
        switch (table) {
            case "product":
                where = {
                    ...(options.categoryId ? { categoryId: options.categoryId } : {}),
                    ...this.buildCommonFilters(options, [
                        "isActive",
                        "search",
                        "isNestedActive",
                    ]),
                    ...(productType !== "ALL" ? { variants: { some: { productType } } } : {})
                };
                // console.log("After Common Filters: ", where);
                Object.assign(where, {
                    ...(options.inStock !== undefined || options.isOnSale !== undefined
                        ? {
                            variants: {
                                ...(where["variants"] || {}),
                                some: {
                                    ...((where["variants"] && where["variants"].some) || {}),
                                    ...(options.inStock !== undefined
                                        ? {
                                            stock: {
                                                ...(options.inStock ? { gt: 0 } : { equals: 0 }),
                                            },
                                        }
                                        : {}),
                                    ...(options.isOnSale !== undefined
                                        ? {
                                            isOnSale: {
                                                equals: options.isOnSale,
                                            },
                                        }
                                        : {}),
                                },
                            },
                        }
                        : {}),
                });
                // console.log("After Stock & OnSale Filters: ", where);
                Object.assign(where, this.buildRelationFilter(enums_1.EnumRelationTables.VARIANT, mode, where));
                // console.log("After Relation Filter: ", where);
                Object.assign(where, this.buildFilterPrice(enums_1.EnumRelationTables.VARIANT, priceOptions, where));
                // console.log("----> Where : ", where);
                break;
            case "category": // -------- Categorys
                Object.assign(where, this.buildCommonFilters(options, ["isActive", "search", "isNestedActive"], "name"));
                // console.log("After Common Filters: ", where);
                Object.assign(where, this.buildRelationFilter(enums_1.EnumRelationTables.PRODUCT, mode, where));
                break;
            case "order":
                where = {
                    ...where,
                    ...this.buildCommonFilters(options, ["search", "status", "startDate", "endDate", "paymentStatus"], "id"),
                    ...this.buildFilterPrice(enums_1.EnumRelationTables.ORDER, priceOptions, where),
                };
                break;
            case "user":
                Object.assign(where, this.buildCommonFilters(options, ["isActive", "search"], "email"));
                break;
        }
        return {
            where,
            ...QueryBuilderService.paginate({ page, limit }),
            orderBy: orderBy || { createdAt: "desc" },
            ...(include ? { include } : {}),
            ...(select ? { select } : {}),
        };
    }
    static buildFilterPrice(table, options, prvWhere) {
        const where = {};
        const { minPrice, champPrice = "price", isNestedPrice = false, maxPrice, mode, } = options;
        if (mode === "without")
            return where;
        // console.log("Filtering Price : ", options);
        if ((allowedNames_1.ALLOWED_FILTERING_TABLES.includes(table) &&
            minPrice !== undefined) ||
            maxPrice !== undefined) {
            // console.log(
            //   "Building Price Filter...",
            //   prvWhere[table as AllowedFilteringTables]?.every,
            //   "minPrice",
            //   minPrice,
            //   "maxPrice",
            //   maxPrice
            // );
            const priceFilter = {
                [champPrice]: {
                    ...(minPrice ? { gte: minPrice } : {}),
                    ...(maxPrice ? { lte: maxPrice } : {}),
                },
            };
            if (isNestedPrice)
                where[table] = {
                    ...prvWhere[table],
                    every: {
                        ...prvWhere[table]?.every,
                        ...priceFilter,
                    },
                };
            else
                Object.assign(where, priceFilter);
        }
        return where;
    }
}
exports.QueryBuilderService = QueryBuilderService;
QueryBuilderService.buildRelationFilter = (relationName, mode, where, nested) => {
    if (!relationName)
        return {};
    // console.log("Building Relation Filter: ", where[relationName]);
    switch (mode.trim()) {
        case "with":
            return {
                [relationName]: {
                    ...(where[relationName] || {}),
                    some: {
                        ...((where[relationName] && where[relationName].some) || {}),
                        ...(nested || {}),
                    },
                },
            };
        case "without":
            return {
                [relationName]: {
                    ...(where[relationName] || {}),
                    none: {
                        ...((where[relationName] && where[relationName].none) || {}),
                        ...(nested || {}),
                    },
                },
            };
        default:
            return {};
    }
};
QueryBuilderService.paginate = ({ page, limit, }) => {
    const offset = (page - 1) * limit;
    return { skip: offset, take: limit };
};
QueryBuilderService.calculateLastPage = (totalItems, limit = 5) => Math.ceil(totalItems / limit);
//# sourceMappingURL=queryBuilder.service.js.map