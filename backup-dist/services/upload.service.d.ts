import { UploadResult } from "../types/type";
export declare const uploadBufferToCloudinary: (buffer: Buffer, folder: string) => Promise<UploadResult>;
export declare const deleteFromCloudinary: (publicId: string) => Promise<void>;
export declare const uploadPathToCloudinary: (files: Express.Multer.File[], folder: string) => Promise<UploadResult[]>;
export declare const deletePathToCloudinary: (publicIds: string[]) => Promise<{
    success: string[];
    failed: {
        id: string;
        error: any;
    }[];
}>;
