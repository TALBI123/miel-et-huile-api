import { UploadResult } from "../types/type";
import cloudinary from "../config/cloudinary";
import fs from "fs";
// Upload image to cloudinary from buffer
export const uploadBufferToCloudinary = <T extends string = "secure_url">(
  buffer: Buffer,
  folder: string,
  key?: T
): Promise<UploadResult<T>> =>
  new Promise((res, rej) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return rej(err);
        if (!result?.secure_url) return rej(new Error("upload est echoue"));
        const Response = {
          [key ?? "secure_url"]: result.secure_url,
          public_id: result.public_id,
        } as UploadResult<T>;
        res(Response);
      }
    );
    stream.end(buffer);
  });

export const deleteFromCloudinary = (publicId: string): Promise<void> =>
  new Promise((res, rej) => {
    cloudinary.uploader.destroy(publicId, (err, result) => {
      if (err) return rej(err);
      if (result?.result !== "ok")
        return rej(new Error("Échec de la suppression de l'image"));
      res();
    });
  });

// Upload image to cloudinary from path
export const uploadPathToCloudinary = (
  files: Express.Multer.File[],
  folder: string
): Promise<UploadResult[]> => {
  const uploads = files.map(async (file) => {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
      });
      fs.unlinkSync(file.path);
      return result;
    } catch (err) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      throw err;
    }
  });
  return Promise.all(uploads);
};

export const deletePathToCloudinary = async (
  publicIds: string[]
): Promise<{ success: string[]; failed: { id: string; error: any }[] }> => {
  const results = await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== "ok")
          throw new Error("Échec de la suppression de l'image");
        return { publicId, status: "success" };
      } catch (err) {
        return { publicId, status: "failed", error: err };
      }
    })
  );
  const success = results
    .filter((r) => r.status === "success")
    .map((r) => r.publicId);
  const failed = results
    .filter((r) => r.status === "failed")
    .map((r) => ({ id: r.publicId, error: r.error }));
  return {
    success,
    failed,
  };
};
