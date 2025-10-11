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
