"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePathToCloudinary = exports.uploadPathToCloudinary = exports.deleteFromCloudinary = exports.uploadBufferToCloudinary = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const fs_1 = __importDefault(require("fs"));
// Upload image to cloudinary from buffer
const uploadBufferToCloudinary = (buffer, folder) => new Promise((res, rej) => {
    const stream = cloudinary_1.default.uploader.upload_stream({ folder }, (err, result) => {
        if (err)
            return rej(err);
        if (!result?.secure_url)
            return rej(new Error("upload est echoue"));
        res(result);
    });
    stream.end(buffer);
});
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
const deleteFromCloudinary = (publicId) => new Promise((res, rej) => {
    cloudinary_1.default.uploader.destroy(publicId, (err, result) => {
        if (err)
            return rej(err);
        if (result?.result !== "ok")
            return rej(new Error("Échec de la suppression de l'image"));
        res();
    });
});
exports.deleteFromCloudinary = deleteFromCloudinary;
// Upload image to cloudinary from path
const uploadPathToCloudinary = (files, folder) => {
    const uploads = files.map(async (file) => {
        try {
            const result = await cloudinary_1.default.uploader.upload(file.path, {
                folder,
            });
            fs_1.default.unlinkSync(file.path);
            return result;
        }
        catch (err) {
            if (fs_1.default.existsSync(file.path))
                fs_1.default.unlinkSync(file.path);
            throw err;
        }
    });
    return Promise.all(uploads);
};
exports.uploadPathToCloudinary = uploadPathToCloudinary;
const deletePathToCloudinary = async (publicIds) => {
    const results = await Promise.all(publicIds.map(async (publicId) => {
        try {
            const result = await cloudinary_1.default.uploader.destroy(publicId);
            if (result.result !== "ok")
                throw new Error("Échec de la suppression de l'image");
            return { publicId, status: "success" };
        }
        catch (err) {
            return { publicId, status: "failed", error: err };
        }
    }));
    const success = results
        .filter((r) => r.status === "success")
        .map((r) => r.publicId);
    const failed = results
        .filter((r) => r.status === "failed")
        .map((r) => ({ id: r.publicId, error: r.error }));
    return {
        success,
        failed
    };
};
exports.deletePathToCloudinary = deletePathToCloudinary;
//# sourceMappingURL=upload.service.js.map