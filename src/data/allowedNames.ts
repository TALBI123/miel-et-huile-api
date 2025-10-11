export const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_CATEGORY_PROPERTIES = [
  "name",
  "description",
  "isActive",
] as const;
export const ALLOWED_PRODUCT_PROPERTIES = [
  "title",
  "categoryId",
  "description",
  "subDescription",
  "isActive",
] as const;
export const ALLOWED_PRODUCT_VARIANT_PROPERTIES = [
  "amount",
  "unit",
  "price",
  "discountPrice",
  "discountPercentage",
  "stock",
  "isOnSale",
  "isActive",
] as const;
export const ALLOWED_USER_UNITS = ["g", "kg", "ml", "L"];
export const ALLOWED_FILTERING_TABLES = [
  "variants",
  "orders",
  "products",
] as const;

export enum EnumRelationTables {
  PRODUCT = "products",
  CATEGORY = "categories",
  VARIANT = "variants",
  ORDER = "orders",
}
export enum Model {
  PRODUCT = "product",
  CATEGORY = "category",
  VARIANT = "variant",
  ORDER = "order",
}
export type AllowedFilteringTables = (typeof ALLOWED_FILTERING_TABLES)[number];
export const ALLOWED_ORDER_STATUSES = [
  "CONFIRMED",
  "PROCESSING",
  "PENDING",
  "FAILED",
  "SHIPPED",
  "REFUNDED",
  "DELIVERED",
  "CANCELLED",
] as const;
export type AllowedOrderStatuses = (typeof ALLOWED_ORDER_STATUSES)[number];
export const ALLOWED_ORDER_PAYMENT_STATUSES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
  "DISPUTED",
  "EXPIRED",
  "REQUIRES_ACTION",
] as const;
export type AllowedOrderPaymentStatuses =
  (typeof ALLOWED_ORDER_PAYMENT_STATUSES)[number];
export const ALLOWED_TABLES_WITH_MODE = ["products", "variants"];
export type AllowedTablesWithMode = (typeof ALLOWED_TABLES_WITH_MODE)[number];
