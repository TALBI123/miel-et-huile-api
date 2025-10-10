import { Prisma, PrismaClient } from "@prisma/client";
import {
  ALLOWED_FILTERING_TABLES,
  ALLOWED_ORDER_STATUSES,
  AllowedFilteringTables,
  AllowedOrderStatuses,
  EnumRelationTables,
} from "../data/allowedNames";

type RelationMode = "with" | "without" | "all";
type RelationFilter = {
  relation: string; // ex: "variants" | "category"
  mode: RelationMode;
  nested?: Record<string, any>; // filtres internes
};
type TypeTalble = "product" | "category" | "order" | "user" | "orderItem";
type FilterOptions = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  inStock?: boolean;
  categoryId?: string;
  maxPrice?: number;
  minPrice?: number;
  isNestedPrice?: boolean;
  champPrice?: "price" | "totalAmount";
  extraWhere?: Record<string, any>;
  mode?: RelationMode;
  relationFilter?: RelationFilter;
  orderBy?: any;
  status?: AllowedOrderStatuses;
  include?: Prisma.ProductInclude;
};

export class QueryBuilderService {
  static buildCommonFilters(
    options: FilterOptions,
    allowedFilters: string[] = []
  ): Record<string, any> {
    const where: Record<string, any> = {};
    const { status, isActive, inStock, search, extraWhere } = options;
    if (allowedFilters.includes("isActive") && isActive !== undefined)
      where.isActive = isActive;

    if (
      allowedFilters.includes("inStock") &&
      inStock !== undefined &&
      ALLOWED_ORDER_STATUSES.includes(status as AllowedOrderStatuses)
    )
      where.inStock = inStock;
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (allowedFilters.includes("status") && status !== undefined)
      where.status = status;
    if (extraWhere) Object.assign(where, extraWhere);

    return where;
  }

  static buildAdvancedQuery<
    T extends keyof PrismaClient,
    M = PrismaClient[T],
    A extends Prisma.Args<M, "findMany"> = Prisma.Args<M, "findMany">
  >(table: T, options: FilterOptions): A {
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      isNestedPrice,
      champPrice,
      mode = "all",
      extraWhere,
      include,
    } = options;
    let where: Record<string, any> = {
      ...(extraWhere ? extraWhere : {}),
    };
    const priceOptions = {
      minPrice,
      maxPrice,
      isNestedPrice,
      champPrice,
      mode,
    };
    switch (table) {
      case "product":
        where = {
          ...(options.categoryId ? { categoryId: options.categoryId } : {}),
          ...this.buildCommonFilters(options, ["isActive", "inStock"]),
          ...this.buildRelationFilter(EnumRelationTables.VARIANT, mode),
        };

        Object.assign(
          where,
          this.buildFilterPrice(EnumRelationTables.VARIANT, priceOptions, where)
        );
        console.log("----> Where : ", where);
        break;
      case "category":
        Object.assign(where, this.buildCommonFilters(options, ["isActive"]));
        Object.assign(
          where,
          this.buildRelationFilter(EnumRelationTables.PRODUCT, mode)
        );
        break;
      case "order":
        where = {
          ...where,
          ...this.buildFilterPrice(
            EnumRelationTables.ORDER,
            priceOptions,
            where
          ),
          ...this.buildCommonFilters(options, ["status"]),
        };
        break;
    }

    return {
      where,
      ...QueryBuilderService.paginate({ page, limit }),
      // ...(options.orderBy ? { orderBy: options.orderBy } : {}),
      ...(options.include ? { include } : {}),
      ...(extraWhere ? { extraWhere } : {}),
    } as A;
  }

  static buildFilterPrice(
    table: AllowedFilteringTables,
    options: Pick<
      FilterOptions,
      "minPrice" | "maxPrice" | "champPrice" | "isNestedPrice" | "mode"
    >,
    prvWhere: Record<string, any>
  ) {
    const where: Record<string, any> = {};
    const {
      minPrice,
      champPrice = "price",
      isNestedPrice = false,
      maxPrice,
      mode,
    } = options;
    if (mode === "without") return where;
    console.log("Filtering Price : ", options);
    if (
      (ALLOWED_FILTERING_TABLES.includes(table as AllowedFilteringTables) &&
        minPrice !== undefined) ||
      maxPrice !== undefined
    ) {
      console.log(
        "Building Price Filter...",
        prvWhere[table as AllowedFilteringTables]?.every,
        "minPrice",
        minPrice,
        "maxPrice",
        maxPrice
      );
      const priceFilter = {
        [champPrice as string]: {
          ...(minPrice ? { gte: minPrice } : {}),
          ...(maxPrice ? { lte: maxPrice } : {}),
        },
      };
      if (isNestedPrice)
        where[table as AllowedFilteringTables] = {
          ...prvWhere[table as AllowedFilteringTables],
          every: {
            ...prvWhere[table as AllowedFilteringTables]?.every,
            ...priceFilter,
          },
        };
      else Object.assign(where, priceFilter);
    }
    return where;
  }
  static buildRelationFilter = (
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
  static paginate = ({
    page,
    limit,
  }: Pick<FilterOptions, "page" | "limit">) => {
    const offset = ((page as number) - 1) * (limit as number);
    return { skip: offset, take: limit };
  };
}
