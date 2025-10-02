export const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_CATEGORY_PROPERTIES = ["name", "description","isActive"] as const;
export const ALLOWED_PRODUCT_PROPERTIES = [
  "title",
  "categoryId",
  "description",
  "subDescription",
  "isActive"
] as const;
export const ALLOWED_PRODUCT_VARIANT_PROPERTIES = [
  "amount",
  "unit",
  "price",
  "discountPrice",
  "discountPercentage",
  "stock",
  "isOnSale",
  "isActive"
] as const;
export const ALLOWED_USER_UNITS = ["g", "kg", "ml", "L"];