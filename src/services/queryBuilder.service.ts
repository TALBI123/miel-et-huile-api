type RelationMode = "with" | "without" | "all";
type RelationFilter = {
  relation: string; // ex: "variants" | "category"
  mode: RelationMode;
  nested?: Record<string, any>; // filtres internes
};

type FilterOptions = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  inStock?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  extraWhere?: Record<string, any>;
  orderBy?: any;
  include?: Record<string, any>;
};

export class QueryBuilderService {

  private buildRelationFilter = (
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
