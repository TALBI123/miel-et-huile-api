"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clamp = exports.calculateDiscountForVariant = void 0;
const calculateDiscountForVariant = (data) => {
    let discountPrice = data.discountPrice;
    let discountPercentage = data.discountPercentage;
    let isOnSale = undefined;
    if (data.price && discountPrice && !discountPercentage) {
        discountPercentage = ((data.price - discountPrice) / data.price) * 100;
        isOnSale = true;
    }
    else if (data.price && discountPercentage && !discountPrice) {
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
exports.calculateDiscountForVariant = calculateDiscountForVariant;
const clamp = (n, min = 1, max = 50) => Number.isNaN(n) ? min : Math.min(Math.max(Math.trunc(n), min), max);
exports.clamp = clamp;
//# sourceMappingURL=mathUtils.js.map