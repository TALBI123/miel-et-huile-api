import { Role } from "./enums";

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
