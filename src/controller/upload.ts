import path from 'path';

import { Request, Response } from 'express';
import multer from 'multer';

import Webp = require('./../../src/utils/webp');
import FileHelperSync = require('./../utils/fileHelperSync');
import createHttpError = require('./../utils/httpError');

type HttpError = Error & { status: number };
type AuthenticatedUploadRequest = Request & { userId: number };

const supportedImageFormats = new Set(["image/png", "image/jpeg"]);
const quality = 75;
const maxUploadSizeBytes = 10 * 1024 * 1024;

class Upload {
  getUploadsPage(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>MY APP</title></head>
      <style>
        input[type=text] {
            padding: 6px 10px;
            margin: 8px 0;
            display: inline-block;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        input[type=submit] {
          background-color: #4CAF50;
          color: white;
          padding: 14px 20px;
          margin: 8px 0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        input[type=submit]:hover {
          background-color: #45a049;
        }
        div {
          border-radius: 5px;
          background-color: #f2f2f2;
          padding: 20px;
          width: 30%;
        }
      </style>
      <body>    
      <script>
        function submitUploadPhotoForm(){
          const userId = + document.getElementsByName("userId")[0].value;
          const uploadPhotoForm = document.getElementById('uploadPhotoForm');
          uploadPhotoForm.action = "/uploads?auth=" + userId;
        }
      </script>
        <h1>Path: /uploads</h1>
        <h2><a href="/">HOME</a></h2><br>
        <div>
        <form id = "uploadPhotoForm" action="" enctype="multipart/form-data" method="POST" onsubmit="submitUploadPhotoForm()"> 
          <label for="userId" class="pad">User ID</label><br>
          <input type="text" name="userId" class="pad" placeholder="ID"><br>
          <input type="file" name="myImage" class="pad" accept="image/*" /><br>
          <input type="submit" class="pad" value="Upload Photo"/>
        </form>
        </div>
      </body>
      </html>
  `;
  }

  uploadPhoto(req: AuthenticatedUploadRequest, res: Response): Promise<string> {
    return new Promise((resolve, reject: (reason: HttpError) => void) => {
      const userId = req.userId;

      // create folder if doesn't exists
      FileHelperSync.createDirectory(`${process.env.UPLOADS_FOLDER}/${userId}`);

      // multer configuration about destination and filename
      const storage = multer.diskStorage({
        destination(request, file, cb) {
          cb(null, `${process.env.UPLOADS_FOLDER}/${userId}`);
        },
        filename(request, file, cb) {
          const parsedFile = path.parse(file.originalname);
          cb(null, parsedFile.name + '-' + Date.now() + parsedFile.ext);
          // or form's input name
          // cb(null, file.fieldname + '-' + Date.now() + parsedFile.ext)
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
          /*
          await runConversionSynchronous(req, quality);
          logExecutionTime(startTimeConversion, "Synchronous conversion")
          */
          await runConvertConcurrently(req, quality);
          logExecutionTime(startTimeConversion, "Concurrent conversion");

          /*
          await convertToMultipleQualities(req);
          logExecutionTime(startTimeConversion, "convertToMultipleQualities conversion")
          */

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

async function convertToMultipleQualities(req: AuthenticatedUploadRequest): Promise<string[][]> {
  const qualities = [50, 75, 100];

  return Promise.all(qualities.map(q => runConvertConcurrently(req, q)));
}

async function runConversionSynchronous(req: AuthenticatedUploadRequest, qualityValue: number): Promise<true> {
  await Webp.convertLossy(req.file!.path, req.file!.destination, qualityValue);
  await Webp.convertLossless(req.file!.path, req.file!.destination, qualityValue);

  return true;
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

export = Upload;

