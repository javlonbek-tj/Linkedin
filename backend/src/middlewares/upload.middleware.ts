import multer from 'multer';
import type { Request, Response, NextFunction } from 'express';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/appError';

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image and video files are allowed.', 400) as unknown as null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Cloudinary upload failed'));
        else resolve(result.secure_url);
      },
    );
    stream.end(buffer);
  });
}

// Middleware for post media — accepts up to 10 files on the "media" field
export const postMediaUpload = [
  upload.array('media', 10),
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) return next();

      const urls = await Promise.all(
        files.map((f) => uploadToCloudinary(f.buffer, 'linkedin/posts')),
      );
      req.body.media = urls;
      next();
    } catch (err) {
      next(err);
    }
  },
];

// Middleware for profile photo and banner image
export const profileImagesUpload = [
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 },
  ]),
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      if (!files) return next();

      if (files.profilePhoto?.[0]) {
        req.body.profilePhoto = await uploadToCloudinary(
          files.profilePhoto[0].buffer,
          'linkedin/profiles',
        );
      }
      if (files.bannerImage?.[0]) {
        req.body.bannerImage = await uploadToCloudinary(
          files.bannerImage[0].buffer,
          'linkedin/banners',
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  },
];
