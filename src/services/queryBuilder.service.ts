import { Prisma, PrismaClient } from "@prisma/client";
import {
  ALLOWED_FILTERING_TABLES,
  ALLOWED_ORDER_PAYMENT_STATUSES,
  ALLOWED_ORDER_STATUSES,
  AllowedFilteringTables,
  AllowedOrderPaymentStatuses,
  AllowedOrderStatuses,
  
} from "../data/allowedNames";
import { EnumRelationTables } from "../types/enums";
type RelationMode = "with" | "without" | "all";
type RelationFilter = {
  relation: string; // ex: "variants" | "category"
  mode: RelationMode;
  nested?: Record<string, any>; // filtres internes
};
// type TypeTalble = "product" | "category" | "order" | "user" | "orderItem";
type FilterOptions = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  inStock?: boolean;
  isOnSale?: boolean;
  categoryId?: string;
  maxPrice?: number;
  minPrice?: number;
  isNestedPrice?: boolean;
  isNestedActive?: boolean;
  champPrice?: "price" | "totalAmount";
  nestedModelActive?: AllowedFilteringTables;
  extraWhere?: Record<string, any>;
  mode?: RelationMode;
  startDate?: Date;
  endDate?: Date;
  relationFilter?: RelationFilter;
  orderBy?: Record<string, any>;
  status?: AllowedOrderStatuses;
  nestedIsActive?: Record<string, any>;
  paymentStatus?: AllowedOrderPaymentStatuses;
  include?: Prisma.ProductInclude;
  select?: Prisma.ProductSelect;
};

export class QueryBuilderService {
  static buildCommonFilters(
    options: Pick<
      FilterOptions,
      | "isActive"
      | "search"
      | "status"
      | "extraWhere"
      | "paymentStatus"
      | "startDate"
      | "endDate"
      | "isNestedActive"
      | "nestedIsActive"
      | "nestedModelActive"
    >,
    allowedFilters: string[] = [],
    searchName: string = "title"
  ): Record<string, any> {
    const where: Record<string, any> = {};
    const {
      status,
      paymentStatus,
      isActive,
      search,
      extraWhere,
      startDate,
      endDate,
      isNestedActive,
      nestedModelActive,
      nestedIsActive,
    } = options;
    if (allowedFilters.includes("isActive") && isActive !== undefined)
      where.isActive = isActive;

    if (allowedFilters.includes("search") && search)
      where[searchName] = { contains: search, mode: "insensitive" };
    if (
      allowedFilters.includes("status") &&
      status &&
      ALLOWED_ORDER_STATUSES.includes(status)
    )
      where.status = status;
    if (
      allowedFilters.includes("paymentStatus") &&
      paymentStatus &&
      ALLOWED_ORDER_PAYMENT_STATUSES.includes(paymentStatus)
    )
      where.paymentStatus = paymentStatus;
    if (
      allowedFilters.includes("isNestedActive") &&
      isNestedActive &&
      nestedIsActive
    )
      where[nestedModelActive as AllowedFilteringTables] = {
        some: {
          ...nestedIsActive,
        },
      };
    if (startDate !== undefined || endDate !== undefined)
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate as Date) } : {}),
        ...(endDate ? { lte: new Date(endDate as Date) } : {}),
      };
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
      orderBy,
      select,
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
          ...this.buildCommonFilters(options, [
            "isActive",
            "search",
            "isNestedActive",
          ]),
        };
        // console.log("After Common Filters: ", where);
        Object.assign(where, {
          ...(options.inStock !== undefined || options.isOnSale !== undefined
            ? {
                variants: {
                  ...(where["variants"] || {}),
                  some: {
                    ...((where["variants"] && where["variants"].some) || {}),
                    ...(options.inStock !== undefined
                      ? {
                          stock: {
                            ...(options.inStock ? { gt: 0 } : { equals: 0 }),
                          },
                        }
                      : {}),
                    ...(options.isOnSale !== undefined
                      ? {
                          isOnSale: {
                            equals: options.isOnSale,
                          },
                        }
                      : {}),
                  },
                },
              }
            : {}),
        });
        // console.log("After Stock & OnSale Filters: ", where);
        Object.assign(
          where,
          this.buildRelationFilter(EnumRelationTables.VARIANT, mode, where)
        );
        // console.log("After Relation Filter: ", where);
        Object.assign(
          where,
          this.buildFilterPrice(EnumRelationTables.VARIANT, priceOptions, where)
        );
        // console.log("----> Where : ", where);
        break;
      case "category": // -------- Categorys
        Object.assign(
          where,
          this.buildCommonFilters(
            options,
            ["isActive", "search", "isNestedActive"],
            "name"
          )
        );
        // console.log("After Common Filters: ", where);

        Object.assign(
          where,
          this.buildRelationFilter(EnumRelationTables.PRODUCT, mode, where)
        );
        break;
      case "order":
        where = {
          ...where,
          ...this.buildCommonFilters(
            options,
            ["search", "status", "startDate", "endDate", "paymentStatus"],
            "id"
          ),
          ...this.buildFilterPrice(
            EnumRelationTables.ORDER,
            priceOptions,
            where
          ),
        };
        break;
      case "user":
        Object.assign(
          where,
          this.buildCommonFilters(options, ["isActive", "search"], "email")
        );
        break;
    }
    return {
      where,
      ...QueryBuilderService.paginate({ page, limit }),
      orderBy: orderBy || { createdAt: "desc" },
      ...(include ? { include } : {}),
      ...(select ? { select } : {}),
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
    // console.log("Filtering Price : ", options);
    if (
      (ALLOWED_FILTERING_TABLES.includes(table as AllowedFilteringTables) &&
        minPrice !== undefined) ||
      maxPrice !== undefined
    ) {
      // console.log(
      //   "Building Price Filter...",
      //   prvWhere[table as AllowedFilteringTables]?.every,
      //   "minPrice",
      //   minPrice,
      //   "maxPrice",
      //   maxPrice
      // );
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
    where: Record<string, any>,
    nested?: any
  ): Record<string, any> => {
    if (!relationName) return {};
    // console.log("Building Relation Filter: ", where[relationName]);
    switch (mode.trim()) {
      case "with":
        return {
          [relationName]: {
            ...(where[relationName] || {}),
            some: {
              ...((where[relationName] && where[relationName].some) || {}),
              ...(nested || {}),
            },
          },
        };
      case "without":
        return {
          [relationName]: {
            ...(where[relationName] || {}),
            none: {
              ...((where[relationName] && where[relationName].none) || {}),
              ...(nested || {}),
            },
          },
        };
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
