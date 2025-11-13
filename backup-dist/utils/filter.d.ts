import { ProductType } from "@prisma/client";
type RelationMode = "with" | "without" | "all";
type RelationFilter = {
    relation: string;
    mode: RelationMode;
    nested?: Record<string, any>;
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
    isNestedActive?: boolean;
    isNestedPrice?: boolean;
    mode?: RelationMode;
    nested?: any;
    champPrice?: "price" | "totalAmount";
    relationName?: string;
    include?: Record<string, any>;
    orderBy?: Record<string, any>;
    extraWhere?: Record<string, any>;
    relationFilter: RelationFilter | RelationFilter[];
}
export declare const buildRelationsFilter: (relations: RelationFilter | RelationFilter[]) => Record<string, any>;
export declare const buildProductQuery: (options: ProductFilterOptions) => {
    include: Record<string, any>;
    orderBy?: Record<string, any> | undefined;
    where: Record<string, any>;
    skip: number;
    take: number | undefined;
};
export declare const objFiltered: <T extends Record<string, any>, K extends keyof T>(oldObj: T, newObj: Partial<T>) => Partial<T>;
export declare const getAllowedPropertiesForProductType: (productType: keyof typeof ProductType) => readonly string[];
export {};
