import path from 'path';

import { Request, Response } from 'express';
import multer from 'multer';

import Webp = require('./../utils/webp');
import FileHelperSync = require('./../utils/fileHelperSync');
import createHttpError = require('./../utils/httpError');

type HttpError = Error & { status: number };
type AuthenticatedUploadRequest = Request & { userId: number };

const supportedImageFormats = new Set(['image/png', 'image/jpeg']);
const quality = 75;
const maxUploadSizeBytes = 10 * 1024 * 1024;

class UploadService {
  async uploadPhoto(req: AuthenticatedUploadRequest, res: Response): Promise<string> {
    return new Promise((resolve, reject: (reason: HttpError) => void) => {
      const userId = req.userId;

      FileHelperSync.createDirectory(`${process.env.UPLOADS_FOLDER}/${userId}`);

      const storage = multer.diskStorage({
        destination(request, file, cb) {
          cb(null, `${process.env.UPLOADS_FOLDER}/${userId}`);
        },
        filename(request, file, cb) {
          const parsedFile = path.parse(file.originalname);
          cb(null, parsedFile.name + '-' + Date.now() + parsedFile.ext);
        }
      });

      const multerUpload = multer({
        storage,
        limits: {
          fileSize: maxUploadSizeBytes,
        },
        fileFilter: (request, file, cb) => {
          if (!supportedImageFormats.has(file.mimetype)) {
            return cb(createHttpError(400, 'Invalid image format. Please double check selected image format.'));
          }

          return cb(null, true);
        }
      }).single('myImage');

      multerUpload(req, res, async err => {
        if (err) {
          console.log(err);
          cleanupUploadArtifacts(req.file && req.file.path, quality);
          return reject(mapUploadError(err));
        }

        if (!req.file) {
          return reject(createHttpError(400, 'Saving image failed. Please double check selected image.'));
        }

        try {
          const startTimeConversion = process.hrtime();
          await runConvertConcurrently(req, quality);
          logExecutionTime(startTimeConversion, 'Concurrent conversion');

          const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><title>MY APP</title></head>
            <body>
              <h1>Path: /uploads?auth=${userId}</h1>
              <h2>- <a href="/images?auth=${userId}">View images (/images)</a></h2>
              <h2>- <a href="/uploads?auth=${userId}">Upload again (/uploads)</a></h2>
            </body>
            </html>
          `;

          resolve(html);
        } catch (conversionError) {
          console.log(conversionError);
          cleanupUploadArtifacts(req.file.path, quality);
          reject(createHttpError(500, 'Image conversion failed. Please try again.'));
        }
      });
    });
  }
}

function runConvertConcurrently(req: AuthenticatedUploadRequest, qualityValue: number): Promise<string[]> {
  return Promise.all([
    Webp.convertLossy(req.file!.path, req.file!.destination, qualityValue),
    Webp.convertLossless(req.file!.path, req.file!.destination, qualityValue)
  ]);
}

function logExecutionTime(start: [number, number], message: string): void {
  const end = process.hrtime(start);
  console.info(`${message} execution time: ${end[0]}s ${(end[1] / 1000000).toFixed(2)}ms`);
}

function cleanupUploadArtifacts(originalFilePath: string | undefined, qualityValue: number): void {
  if (!originalFilePath) {
    return;
  }

  const parsedFile = path.parse(originalFilePath);
  const derivedFiles = [
    originalFilePath,
    path.join(parsedFile.dir, `${parsedFile.name}_${qualityValue}-lossy.webp`),
    path.join(parsedFile.dir, `${parsedFile.name}_${qualityValue}-lossless.webp`),
  ];

  derivedFiles.forEach(filePath => {
    try {
      FileHelperSync.deleteFile(filePath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown cleanup error';
      console.log(`Cleanup skipped for ${filePath}`, message);
    }
  });
}

function mapUploadError(err: unknown): HttpError {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return createHttpError(413, `Image is too large. Max allowed size is ${Math.round(maxUploadSizeBytes / (1024 * 1024))}MB.`);
    }

    return createHttpError(400, err.message);
  }

  if (err instanceof Error && 'status' in err && typeof err.status === 'number') {
    return err as HttpError;
  }

  return createHttpError(500, 'Saving image failed. Please try again.');
}

export = UploadService;

