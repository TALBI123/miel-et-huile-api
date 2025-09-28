import { paginate } from "./helpers";
type OrderOptions = {
  orderBy: "price" | "stock" | "name";
  orderDirection: "asc" | "desc";
};

type RelationMode = "with" | "without" | "all";
interface ProductFilterOptions {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  onSale?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  mode?: RelationMode;
  relationName: string;
  order?: OrderOptions;
  nested?: any;
  include?: Record<string, any>;
}
const buildRelationFilter = (
  relationName: string,
  mode: RelationMode,
  nested?: any
): Record<string, any> => {
  switch (mode) {
    case "with":
      return { [relationName]: { some: nested || {} } };
    case "without":
      return { [relationName]: { none: nested || {} } };
    default:
      return {};
  }
};
export const buildProductQuery = (options: ProductFilterOptions) => {
  const {
    page = 1,
    limit = 5,
    category,
    search,
    onSale,
    minPrice,
    maxPrice,
    inStock,
    mode = "all",
    relationName,
    nested,
    order,
    include,
  } = options;
  if (minPrice && maxPrice && minPrice > maxPrice) {
    throw new Error(
      "Le prix minimum ne peut pas être supérieur au prix maximum"
    );
  }
  const where: any = {
    ...(category ? { categoryId: category } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(onSale !== undefined ? { onSale } : {}),
    ...(inStock !== undefined ? { inStock } : {}),
    ...buildRelationFilter(relationName, mode, nested),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          variants: {
            some: {
              price: {
                ...(minPrice !== undefined ? { gte: minPrice } : {}),
                ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
              },
            },
          },
        }
      : {}),
  };
  const { skip, take } = paginate({ page, limit });
  return {
    where,
    skip,
    take,
    // ...(relationName === "variants"
    //   ? {
    //       orderBy: {
    //         [relationName]: {
    //           _min: {
    //             [order?.orderBy ?? "price"]: order?.orderDirection ?? "asc",
    //           },
    //         },
    //       },
    //     }
    //   : {}),
    include: include ?? {},
  };
};
