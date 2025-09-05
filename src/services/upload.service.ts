import cloudinary from "../config/cloudinary";
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<string> =>
  new Promise((res, rej) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => {
        if (err) return rej(err);
        if (!result?.secure_url) return rej(new Error("upload est echoue"));
        res(result.secure_url);
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
