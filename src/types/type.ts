type Role = "USER" | "ADMIN";
export type isString<T> = T extends string ? "string" : "number";
type FieldType = "number" | "string";

export type FieldOptions = {
  type?: FieldType;
  name: string;
  required?: boolean;
  min?: number; // pour number
  minLength?: number; // pour string
  isUUID?: boolean; // pour string
  messages?: {
    required?: string;
    invalid?: string;
    min?: string;
    minLength?: string;
  };
};
export interface MailOptions<T> {
  to: string;
  subject: string;
  htmlFileName: string;
  context: T;
}
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  errors?: string;
  data?: T;
  lastPage?: number;
  len?: number;
}

export interface UserTokenPayload {
  id: string;
  role: Role;
  email: string;
}

export interface UploadResult {
  secure_url: string;
  public_id: string;
}

export interface IntCategory {
  name: string;
  description?: string | null;
  isActive?: boolean;
  slug?: string;
  image?: string;
  publicId?: string;
}

export interface Product {
  title: string;
  categoryId: string;
  description: string;
  subDescription: string;
  isActive?: boolean;
  images?: { id: string; image: string; publicId: string }[];
}
export interface ProductVariant {
  amount: number;
  unit: string;
  price: number;
  discountPercentage?: number;
  discountPrice?: number;
  isOnSale?: boolean;
  isActive?: boolean;
  stock: number;
  productId: string;
}



interface IntUser {
  id: string;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  role: "USER" | "ADMIN";
  image: string;
  publicId: string;
}