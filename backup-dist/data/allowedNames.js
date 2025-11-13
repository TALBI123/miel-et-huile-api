"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_TABLES_WITH_MODE = exports.ALLOWED_ORDER_PAYMENT_STATUSES = exports.ALLOWED_ORDER_STATUSES = exports.ALLOWED_FILTERING_TABLES = exports.ALLOWED_PRODUCT_VARIANT_PROPERTIES = exports.ALLOWED_PRODUCT_PROPERTIES = exports.ALLOWED_CATEGORY_PROPERTIES = exports.ALLOWED_UNITS = exports.ALLOWED_SIZE = exports.ALLOWED_MIMES = void 0;
exports.ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
exports.ALLOWED_SIZE = ["XS", "S", "M", "L", "XL"];
exports.ALLOWED_UNITS = ["g", "kg", "ml", "L"];
exports.ALLOWED_CATEGORY_PROPERTIES = [
    "name",
    "description",
    "isActive",
];
exports.ALLOWED_PRODUCT_PROPERTIES = [
    "title",
    "categoryId",
    "description",
    "subDescription",
    "isActive",
];
exports.ALLOWED_PRODUCT_VARIANT_PROPERTIES = [
    "amount",
    "unit",
    "price",
    "discountPrice",
    "discountPercentage",
    "stock",
    // "size",
    "origin",
    "isOnSale",
    "isActive",
];
exports.ALLOWED_FILTERING_TABLES = [
    "variants",
    "orders",
    "products",
];
exports.ALLOWED_ORDER_STATUSES = [
    "CONFIRMED",
    "PROCESSING",
    "PENDING",
    "FAILED",
    "SHIPPED",
    "REFUNDED",
    "DELIVERED",
    "CANCELLED",
];
exports.ALLOWED_ORDER_PAYMENT_STATUSES = [
    "PENDING",
    "PAID",
    "FAILED",
    "REFUNDED",
    "PARTIALLY_REFUNDED",
    "DISPUTED",
    "EXPIRED",
    "REQUIRES_ACTION",
];
exports.ALLOWED_TABLES_WITH_MODE = ["products", "variants"];
//# sourceMappingURL=allowedNames.js.map