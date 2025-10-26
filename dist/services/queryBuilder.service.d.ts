import { Prisma, PrismaClient } from "@prisma/client";
import { AllowedFilteringTables, AllowedOrderPaymentStatuses, AllowedOrderStatuses } from "../data/allowedNames";
import { ProductTypeKeys } from "../types/type";
type RelationMode = "with" | "without" | "all";
type RelationFilter = {
    relation: string;
    mode: RelationMode;
    nested?: Record<string, any>;
};
type FilterOptions = {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    inStock?: boolean;
    isOnSale?: boolean;
    categoryId?: string;
    productType: ProductTypeKeys;
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
export declare class QueryBuilderService {
    static buildCommonFilters(options: Pick<FilterOptions, "isActive" | "search" | "status" | "extraWhere" | "paymentStatus" | "startDate" | "endDate" | "isNestedActive" | "nestedIsActive" | "nestedModelActive">, allowedFilters?: string[], searchName?: string): Record<string, any>;
    static buildAdvancedQuery<T extends keyof PrismaClient, M = PrismaClient[T], A extends Prisma.Args<M, "findMany"> = Prisma.Args<M, "findMany">>(table: T, options: FilterOptions): A;
    static buildFilterPrice(table: AllowedFilteringTables, options: Pick<FilterOptions, "minPrice" | "maxPrice" | "champPrice" | "isNestedPrice" | "mode">, prvWhere: Record<string, any>): Record<string, any>;
    static buildRelationFilter: (relationName: string, mode: RelationMode, where: Record<string, any>, nested?: any) => Record<string, any>;
    static paginate: ({ page, limit, }: Pick<FilterOptions, "page" | "limit">) => {
        skip: number;
        take: number | undefined;
    };
    static calculateLastPage: (totalItems: number, limit?: number) => number;
}
export {};
