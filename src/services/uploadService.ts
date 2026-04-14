import fs from 'fs';
import path from 'path';

import { Request, Response } from 'express';
import multer from 'multer';

import Webp = require('./../utils/webp');
import FileHelperSync = require('./../utils/fileHelperSync');
import createHttpError = require('./../utils/httpError');
import ImageAuditService = require('./imageAuditService');
import UploadJobService = require('./uploadJobService');
import ImageService = require('./imageService');
import AuthService = require('./../auth/authService');

type HttpError = Error & { status: number };
type AuthenticatedUploadRequest = Request & { userId: number; body?: { lossyQuality?: string; losslessQuality?: string } };

const supportedImageFormats = new Set(['image/png', 'image/jpeg']);
const defaultQuality = 75;
const maxUploadSizeBytes = 10 * 1024 * 1024;
const imageAuditService = new ImageAuditService();
const uploadJobService = new UploadJobService();
const imageService = new ImageService();
const authService = new AuthService();
const projectedVariantMultiplier = 2;

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
          const baseName = `${parsedFile.name}-${Date.now()}`;
          cb(null, createAvailableFileName(`${process.env.UPLOADS_FOLDER}/${userId}`, baseName, parsedFile.ext));
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
          cleanupUploadArtifacts(req.file && req.file.path, [defaultQuality, defaultQuality]);
          return reject(mapUploadError(err));
        }

        if (!req.file) {
          return reject(createHttpError(400, 'Saving image failed. Please double check selected image.'));
        }

        let lossyQuality = defaultQuality;
        let losslessQuality = defaultQuality;

        try {
          // Parse quality settings from form data
          const lossyQualityStr = (req.body?.lossyQuality || String(defaultQuality)).toString().trim();
          const losslessQualityStr = (req.body?.losslessQuality || String(defaultQuality)).toString().trim();

          lossyQuality = Math.max(1, Math.min(100, parseInt(lossyQualityStr, 10) || defaultQuality));
          losslessQuality = Math.max(1, Math.min(100, parseInt(losslessQualityStr, 10) || defaultQuality));

          console.log(`📊 Upload quality settings - Lossy: ${lossyQuality}, Lossless: ${losslessQuality}`);

          // Estimate final footprint as original + two generated variants.
          const usage = imageService.getUserStorageUsage(userId);
          const quotaBytes = authService.getUserQuotaBytes(userId);
          const projectedTotalBytes = usage.totalBytes + (req.file.size * projectedVariantMultiplier);
          if (projectedTotalBytes > quotaBytes) {
            cleanupUploadArtifacts(req.file.path, [lossyQuality, losslessQuality]);
            return reject(createHttpError(
              413,
              `Storage quota exceeded. Used ${formatFileSize(usage.totalBytes)} of ${formatFileSize(quotaBytes)}.`
            ));
          }

          const job = uploadJobService.createJob({
            userId,
            originalFileName: req.file.originalname,
            storedFileName: req.file.filename,
            lossyQuality,
            losslessQuality,
          });

          void processUploadInBackground({
            jobId: job.id,
            req,
            userId,
            lossyQuality,
            losslessQuality,
          });

          const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Upload Processing</title>
              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }

                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  min-height: 100vh;
                  padding: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                }

                .page {
                  width: 100%;
                  max-width: 860px;
                }

                .card {
                  background: #fff;
                  border-radius: 18px;
                  overflow: hidden;
                  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
                }

                .hero {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: #fff;
                  padding: 36px 32px;
                  text-align: center;
                }

                .hero-badge {
                  width: 78px;
                  height: 78px;
                  margin: 0 auto 18px;
                  border-radius: 50%;
                  background: rgba(255, 255, 255, 0.16);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 38px;
                  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2);
                }

                .hero h1 {
                  font-size: 32px;
                  margin-bottom: 10px;
                }

                .hero p {
                  font-size: 15px;
                  opacity: 0.94;
                  max-width: 560px;
                  margin: 0 auto;
                  line-height: 1.6;
                }

                .content {
                  padding: 30px;
                }

                .summary {
                  display: grid;
                  grid-template-columns: repeat(3, minmax(0, 1fr));
                  gap: 16px;
                  margin-bottom: 24px;
                }

                .summary-card {
                  background: #f8f9ff;
                  border: 1px solid #e5e9ff;
                  border-radius: 14px;
                  padding: 18px;
                }

                .summary-label {
                  font-size: 11px;
                  text-transform: uppercase;
                  letter-spacing: 0.08em;
                  color: #7b8098;
                  margin-bottom: 8px;
                }

                .summary-value {
                  color: #222;
                  font-size: 17px;
                  font-weight: 700;
                  line-height: 1.4;
                  word-break: break-word;
                }

                .info-box {
                  background: #f4f7ff;
                  border-left: 4px solid #667eea;
                  border-radius: 10px;
                  padding: 18px;
                  margin-bottom: 24px;
                  color: #374151;
                  line-height: 1.6;
                }

                .info-box strong {
                  color: #4f46e5;
                }

                .quality-grid {
                  display: grid;
                  grid-template-columns: repeat(2, minmax(0, 1fr));
                  gap: 16px;
                  margin-bottom: 28px;
                }

                .quality-card {
                  border-radius: 14px;
                  padding: 20px;
                  border: 1px solid #ececec;
                }

                .quality-card.lossy {
                  background: #fff8f0;
                  border-color: #fde5c7;
                }

                .quality-card.lossless {
                  background: #f2fff6;
                  border-color: #d8f0de;
                }

                .quality-card h2 {
                  font-size: 18px;
                  margin-bottom: 10px;
                  color: #222;
                }

                .quality-card p {
                  color: #5b6475;
                  font-size: 14px;
                  line-height: 1.6;
                }

                .quality-score {
                  display: inline-block;
                  margin-top: 12px;
                  padding: 8px 12px;
                  border-radius: 999px;
                  background: rgba(255,255,255,0.82);
                  color: #222;
                  font-weight: 700;
                  font-size: 14px;
                }

                .actions {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 12px;
                }

                .button {
                  flex: 1 1 180px;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: 8px;
                  text-decoration: none;
                  padding: 14px 18px;
                  border-radius: 12px;
                  font-weight: 600;
                  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
                }

                .button:hover {
                  transform: translateY(-2px);
                }

                .button-primary {
                  color: #fff;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.28);
                }

                .button-secondary {
                  background: #f4f4f6;
                  color: #2f3542;
                }

                .button-secondary:hover {
                  background: #ececf1;
                }

                @media (max-width: 760px) {
                  .hero {
                    padding: 30px 22px;
                  }

                  .hero h1 {
                    font-size: 28px;
                  }

                  .content {
                    padding: 22px;
                  }

                  .summary,
                  .quality-grid {
                    grid-template-columns: 1fr;
                  }
                }

                @media (max-width: 520px) {
                  body {
                    padding: 12px;
                  }

                  .hero {
                    padding: 24px 18px;
                  }

                  .hero h1 {
                    font-size: 24px;
                  }

                  .hero-badge {
                    width: 66px;
                    height: 66px;
                    font-size: 32px;
                  }

                  .content {
                    padding: 18px;
                  }

                  .actions {
                    flex-direction: column;
                  }
                }
              </style>
            </head>
            <body>
              <div class="page">
                <div class="card">
                  <div class="hero">
                    <div class="hero-badge">✅</div>
                     <h1>Upload Accepted</h1>
                     <p>Your image has been saved. WebP variants are now being generated in the background.</p>
                  </div>

                  <div class="content">
                    <div class="summary">
                      <div class="summary-card">
                        <div class="summary-label">Original file</div>
                        <div class="summary-value">${escapeHtml(req.file.originalname)}</div>
                      </div>
                      <div class="summary-card">
                        <div class="summary-label">Saved as</div>
                        <div class="summary-value">${escapeHtml(req.file.filename)}</div>
                      </div>
                      <div class="summary-card">
                        <div class="summary-label">Gallery</div>
                        <div class="summary-value">User ${userId}</div>
                      </div>
                    </div>

                    <div class="info-box">
                      <strong>In progress:</strong> processing runs in the background. This page checks status automatically.
                    </div>

                    <div id="job-status" class="info-box">
                      <strong>Status:</strong> queued
                    </div>

                    <div class="quality-grid">
                      <div class="quality-card lossy">
                        <h2>📊 Lossy WebP</h2>
                        <p>Optimized for smaller file size and faster delivery while keeping visual quality high.</p>
                        <div class="quality-score">Quality ${lossyQuality}</div>
                      </div>
                      <div class="quality-card lossless">
                        <h2>🎨 Lossless WebP</h2>
                        <p>Preserves image fidelity with minimal compromise, ideal when exact detail matters.</p>
                        <div class="quality-score">Quality ${losslessQuality}</div>
                      </div>
                    </div>

                    <div class="actions">
                      <a id="open-group-btn" class="button button-primary" href="#" style="display:none;">Open uploaded group</a>
                      <a class="button button-primary" href="/images/${userId}/html">View images</a>
                      <a class="button button-secondary" href="/uploads">Upload another image</a>
                      <a class="button button-secondary" href="/">Back to app</a>
                    </div>
                  </div>
                </div>
              </div>
              <script>
                const statusBox = document.getElementById('job-status');
                const openGroupBtn = document.getElementById('open-group-btn');

                async function pollJobStatus() {
                  try {
                    const response = await fetch('/uploads/jobs/${job.id}/status', { credentials: 'same-origin' });
                    if (!response.ok) {
                      statusBox.innerHTML = '<strong>Status:</strong> failed to fetch processing status';
                      return;
                    }

                    const body = await response.json();
                    statusBox.innerHTML = '<strong>Status:</strong> ' + body.status;

                    if (body.status === 'completed' && body.groupId) {
                      const groupLink = '/images/${userId}/groups/' + encodeURIComponent(body.groupId) + '/html';
                      openGroupBtn.href = groupLink;
                      openGroupBtn.style.display = '';
                      statusBox.innerHTML = '<strong>Status:</strong> completed';
                      return;
                    }

                    if (body.status === 'failed') {
                      statusBox.innerHTML = '<strong>Status:</strong> failed (' + (body.error || 'conversion error') + ')';
                      return;
                    }

                    setTimeout(pollJobStatus, 1200);
                  } catch {
                    statusBox.innerHTML = '<strong>Status:</strong> network error while polling';
                  }
                }

                setTimeout(pollJobStatus, 400);
              </script>
            </body>
            </html>
          `;

          resolve(html);
        } catch (conversionError) {
          console.log(conversionError);
          cleanupUploadArtifacts(req.file.path, [lossyQuality, losslessQuality]);
          reject(createHttpError(500, 'Image conversion failed. Please try again.'));
        }
      });
    });
  }
}

function runConvertConcurrently(req: AuthenticatedUploadRequest, lossyQuality: number, losslessQuality: number): Promise<string[]> {
  return Promise.all([
    Webp.convertLossy(req.file!.path, req.file!.destination, lossyQuality),
    Webp.convertLossless(req.file!.path, req.file!.destination, losslessQuality)
  ]);
}

async function processUploadInBackground(payload: {
  jobId: string;
  req: AuthenticatedUploadRequest;
  userId: number;
  lossyQuality: number;
  losslessQuality: number;
}): Promise<void> {
  const { jobId, req, userId, lossyQuality, losslessQuality } = payload;
  uploadJobService.markProcessing(jobId);

  try {
    const startTimeConversion = process.hrtime();
    await runConvertConcurrently(req, lossyQuality, losslessQuality);
    logExecutionTime(startTimeConversion, 'Concurrent conversion');
    imageAuditService.recordUpload(userId, req.file!.filename, lossyQuality, losslessQuality);
    const groupId = path.parse(req.file!.filename).name;
    uploadJobService.markCompleted(jobId, groupId);
  } catch (error) {
    cleanupUploadArtifacts(req.file?.path, [lossyQuality, losslessQuality]);
    const message = error instanceof Error ? error.message : 'Image conversion failed.';
    uploadJobService.markFailed(jobId, message);
  }
}

function logExecutionTime(start: [number, number], message: string): void {
  const end = process.hrtime(start);
  console.info(`${message} execution time: ${end[0]}s ${(end[1] / 1000000).toFixed(2)}ms`);
}

function cleanupUploadArtifacts(originalFilePath: string | undefined, qualityValues: number[]): void {
  if (!originalFilePath) {
    return;
  }

  const parsedFile = path.parse(originalFilePath);
  const derivedFiles = [
    originalFilePath,
    ...qualityValues.flatMap(quality => [
      path.join(parsedFile.dir, Webp.buildVariantFileName(`${parsedFile.name}${parsedFile.ext}`, quality, 'lossy')),
      path.join(parsedFile.dir, Webp.buildVariantFileName(`${parsedFile.name}${parsedFile.ext}`, quality, 'lossless')),
      path.join(parsedFile.dir, `${parsedFile.name}_${quality}-lossy.webp`),
      path.join(parsedFile.dir, `${parsedFile.name}_${quality}-lossless.webp`),
    ]),
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

function createAvailableFileName(directory: string, baseName: string, extension: string): string {
  let suffix = 0;

  while (true) {
    const candidateName = suffix === 0 ? `${baseName}${extension}` : `${baseName}-${suffix}${extension}`;
    const candidatePath = path.join(directory, candidateName);
    if (!fs.existsSync(candidatePath)) {
      return candidateName;
    }

    suffix += 1;
  }
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

export = UploadService;

