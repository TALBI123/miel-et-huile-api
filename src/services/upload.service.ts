import { UploadResult } from "../types/type";
import cloudinary from "../config/cloudinary";
import sharp from 'sharp';
import fs from "fs";
// Upload image to cloudinary from buffer
export const uploadBufferToCloudinary = <T extends string = "secure_url">(
  buffer: Buffer,
  folder: string,
  keyImageUrl?: T,
  keyPublicId?: string
): Promise<UploadResult<T>> =>
  new Promise((res, rej) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        // resource_type: "image",
        // // 🔧 Ajoutez ces configurations pour optimiser
        // timeout: 30000, // 30 secondes max
        // quality: "auto:good",
        // fetch_format: "auto",
        // format: "webp", // Conversion automatique
        // transformation: [
        //   { width: 1920, height: 1080, crop: "limit", quality: 80 },
        // ],
      },
      (err, result) => {
        if (err) return rej(err);
        if (!result?.secure_url) return rej(new Error("upload est echoue"));
        const Response = {
          [keyImageUrl ?? "secure_url"]: result.secure_url,
          public_id: result.public_id,
          derivedIdKey: keyPublicId,
        } as UploadResult<T>;
        res(Response);
      }
    );
    stream.end(buffer);
  });
export const compressLargeImage = async (buffer: Buffer): Promise<Buffer> => {
  const sizeInMB = buffer.length / 1024 / 1024;

  if (sizeInMB > 4) {
    // > 10MB
    console.log(`🗜️ Compression nécessaire: ${sizeInMB.toFixed(2)}MB`);

    return await sharp(buffer)
      .resize(1920, 1080, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 70 })
      .toBuffer();
  }

  return buffer;
};
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
