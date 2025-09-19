type Role = "USER" | "ADMIN";
export type isString<T> = T extends string ? "string" : "number";
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
  slug?: string;
  image?: string;
  publicId?: string;
}

export interface IntProduct {
  title: string;
  description: string;
  isOnSale: boolean;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  categoryId: string;
  image: string;
  publicId: string;
  stock: number;
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
