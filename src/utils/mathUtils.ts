// src/utils/calculateDiscount.ts
import { ProductVariant } from "../types/type";

export const calculateDiscountForVariant = (data: Partial<ProductVariant>) => {
  let discountPrice = data.discountPrice;
  let discountPercentage = data.discountPercentage;
  let isOnSale: boolean | undefined = undefined;
  if (data.price && discountPrice && !discountPercentage) {
    discountPercentage = ((data.price - discountPrice) / data.price) * 100;
    isOnSale = true;
  } else if (data.price && discountPercentage && !discountPrice) {
    discountPrice = data.price * (1 - discountPercentage / 100);
    isOnSale = true;
  }

  return {
    ...data,
    ...(discountPrice !== undefined
      ? { discountPrice: Math.floor(discountPrice * 100) / 100 }
      : {}),
    ...(discountPercentage !== undefined
      ? { discountPercentage: Math.floor(discountPercentage * 100) / 100 }
      : {}),
    ...(isOnSale !== undefined ? { isOnSale } : {}),
  };
};
export const clamp = (n: number, min = 1, max = 50) =>
  Number.isNaN(n) ? min : Math.min(Math.max(Math.trunc(n), min), max);
