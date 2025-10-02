import { paginate } from "./helpers";
type OrderOptions = {
  orderBy: "price" | "stock" | "name";
  orderDirection: "asc" | "desc";
};
type RelationMode = "with" | "without" | "all";
type RelationFilter = {
  relation: string; // ex: "variants" | "category"
  mode: RelationMode;
  nested?: Record<string, any>; // filtres internes
};
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
  nested?: any;
  include?: Record<string, any>;
  orderBy?: Record<string, any>;
  relationName?: string | string[];
  extraWhere?: Record<string, any>;
  relationFilter: RelationFilter | RelationFilter[];
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
export const buildRelationsFilter = (
  relations: RelationFilter | RelationFilter[]
): Record<string, any> => {
  const filters: Record<string, any> = {};
  const handle = (relation: RelationFilter) => {
    const { relation: rel, mode, nested } = relation;
    filters[rel] = buildRelationFilter(rel, mode, nested)[rel];
  };
  if (Array.isArray(relations)) {
    relations.forEach(handle);
  } else {
    handle(relations);
  }
  return filters;
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
    relationFilter,
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
  let where: any = {
    ...(category ? { categoryId: category } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(onSale !== undefined ? { onSale } : {}),
    ...(inStock !== undefined ? { inStock } : {}),
    ...(extraWhere ?? {}),
  };

  // if (relationFilter) {
  //   const relationFilters = buildRelationsFilter(relationFilter);
  //   where = { ...where, ...relationFilters };
  // }
  
  if (relationName) {
    const relationFilters = buildRelationsFilter(
      Array.isArray(relationName)
        ? relationName.map((name) => ({ relation: name, mode, nested }))
        : { relation: relationName, mode, nested }
    );
    where = { ...where, ...relationFilters };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.variants = {
      some: {
        ...(where.variants?.some ?? {}),
        price: {
          ...(minPrice !== undefined ? { gte: minPrice } : {}),
          ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
        },
      },
    };
  }
  const { skip, take } = paginate({ page, limit });
  return {
    where,
    skip,
    take,
    ...(orderBy ? { orderBy } : {}),
    include: include ?? {},
  };
};

export const objFiltered = <T extends Record<string, any>, K extends keyof T>(
  oldObj: T,
  newObj: Partial<T>
): Partial<T> => {
  let filteredObj: Partial<T> = {};
  for (const [key, value] of Object.entries(newObj)) {
    // problem oldObj[key as K] && value !== oldObj[key as K] en cas oldObj[key as K] peux boolean ca casse le competement attendu
    if (value !== oldObj[key as K]) filteredObj[key as K] = value;
  }
  return filteredObj;
};
