import { Prisma } from "@prisma/client";

export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    variants: {
      orderBy: { price: "asc" };
      take: 1;
      select: {
        id: true;
        price: true;
        discountPrice: true;
        discountPercentage: true;
        amount: true;
        unit: true;
        stock: true;
      };
    };
    images: {
      take: 1;
      select: { image: true };
    };
  };
}>;
export type CategoryWithRelations = Prisma.CategoryGetPayload<{
  include: {
    _count: {
      select: { products: true };
    };
  };
}>;

export type ProductWithCategory = Prisma.ProductGetPayload<{
  select: {
    id: true;
    isActive: true;
    category: { select: { id: true; isActive: true } };
    title: true; // si tu veux inclure
  };
}>;
export type ProductVariantWithRelations = Prisma.ProductVariantGetPayload<{
  select: {
    amount: true;
    size: true;
    unit: true;
    productId: true;
  };
}>;
