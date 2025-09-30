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
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  mode?: RelationMode;
  relationName: string;
  nested?: any;
  include?: Record<string, any>;
  orderBy?: Record<string, any>;
  extraWhere?: Record<string, any>;
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
    isActive,
    onSale,
    minPrice,
    maxPrice,
    inStock,
    mode = "all",
    relationName,
    nested,
    orderBy,
    include,
    extraWhere,
  } = options;
  if (minPrice && maxPrice && minPrice > maxPrice) {
    throw new Error(
      "Le prix minimum ne peut pas être supérieur au prix maximum"
    );
  }
  const where: any = {
    ...(category ? { categoryId: category } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
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
    ...(extraWhere ?? {}),
  };
  const { skip, take } = paginate({ page, limit });
  return {
    where,
    skip,
    take,
    ...(orderBy ? { orderBy } : {}),
    include: include ?? {},
  };
};
// export const objFiltered = <T extends Record<string, any>>(
//   oldObj: T,
//   newObj: Partial<T>
// ): Partial<T> => {
//   const map = new Map(Object.entries(oldObj));
//   let filterdObj: Partial<T> = {};
//   for(){

//   }
//   return filterdObj;
// };
