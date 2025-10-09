import { is } from "zod/v4/locales";
import {
  ALLOWED_FILTERING_TABLES,
  AllowedFilteringTables,
} from "../data/allowedNames";
import { QueryBuilderService } from "../services/queryBuilder.service";
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
  isNestedPrice?: boolean;
  mode?: RelationMode;
  nested?: any;
  champPrice?: "price" | "totalAmount";
  // relationName?: string | string[];
  relationName?: string;
  include?: Record<string, any>;
  orderBy?: Record<string, any>;
  extraWhere?: Record<string, any>;
  relationFilter: RelationFilter | RelationFilter[];
}

const buildRelationFilter = (
  relationName: string,
  mode: RelationMode,
  nested?: any
): Record<string, any> => {
  if (!relationName) return {};
  switch (mode.trim()) {
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
    console.log(rel, mode, nested, " buildRelationsFilter");
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
    isNestedPrice = false,
    // relationFilter,
    champPrice = "price",
    relationName,
    nested,
    orderBy,
    include,
    extraWhere,
  } = options;
  let where: Record<string, any> = {
    ...(category ? { categoryId: category } : {}),
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(onSale !== undefined ? { onSale } : {}),
    ...(inStock !== undefined ? { inStock } : {}),
    ...(extraWhere ?? {}),
    ...(relationName !== undefined && mode
      ? buildRelationFilter(relationName, mode, nested)
      : {}),
  };

  if (
    ALLOWED_FILTERING_TABLES.includes(relationName as AllowedFilteringTables) &&
    (minPrice !== undefined || maxPrice !== undefined)
  ) {
    const priceFilter = {
      [champPrice]: {
        ...(minPrice ? { gte: minPrice } : {}),
        ...(maxPrice ? { lte: maxPrice } : {}),
      },
    };

    if (isNestedPrice) {
      where[relationName as AllowedFilteringTables] = {
        some: {
          ...(where[relationName as AllowedFilteringTables]?.some ?? {}),
          ...priceFilter,
        },
      };
    } else Object.assign(where, priceFilter);
  }
  const { skip, take } = QueryBuilderService.paginate({ page, limit });
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
