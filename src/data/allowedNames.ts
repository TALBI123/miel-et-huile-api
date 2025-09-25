export const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_CATEGORY_PROPERTIES = ["name", "description"] as const;
export const ALLOWED_PRODUCT_PROPERTIES = [
  "title",
  "categoryId",
  "description",
  "subDescription",
] as const;
export const ALLOWED_PRODUCT_VARIANT_PROPERTIES = [
  "amount",
  "unit",
  "price",
  "discountPrice",
  "discountPercentage",
  "stock",
  "productId",
] as const;