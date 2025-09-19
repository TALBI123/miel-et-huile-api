export const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ALLOWED_CATEGORY_PROPERTIES = ["name", "description"] as const;
export const ALLOWED_PRODUCT_PROPERTIES = [
  "title",
  "description",
  "price",
  "categoryId",
  "stock",
  "discountPrice",
  "discountPercentage",
] as const;
