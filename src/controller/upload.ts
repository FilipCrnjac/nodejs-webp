import { Request, Response } from 'express';

import UploadService = require('./../services/uploadService');

type AuthenticatedUploadRequest = Request & { userId: number };

const uploadService = new UploadService();

class Upload {
  getUploadsPage(): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Upload Image</title>
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
          }

          .container {
            max-width: 600px;
            margin: 0 auto;
          }

          .header {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .header h1 {
            color: #333;
            margin-bottom: 8px;
            font-size: 28px;
          }

          .header p {
            color: #666;
            font-size: 14px;
          }

          .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: #f0f0f0;
            color: #333;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
            margin-right: 10px;
          }

          .back-link:hover {
            background: #e0e0e0;
          }

          .form-group {
            margin-bottom: 24px;
          }

          .form-group label {
            display: block;
            margin-bottom: 10px;
            color: #333;
            font-weight: 500;
            font-size: 14px;
          }

          .file-input-wrapper {
            position: relative;
            overflow: hidden;
            display: inline-block;
            width: 100%;
          }

          .file-input-wrapper input[type=file] {
            position: absolute;
            left: -9999px;
          }

          .file-input-label {
            display: block;
            padding: 30px;
            border: 2px dashed #667eea;
            border-radius: 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            background: #f9f7ff;
          }

          .file-input-label:hover {
            background: #f0edff;
            border-color: #764ba2;
          }

          .file-input-label.active {
            background: #f0edff;
            border-color: #667eea;
            border-style: solid;
          }

          .file-input-icon {
            font-size: 32px;
            margin-bottom: 10px;
            display: block;
          }

          .file-input-text {
            color: #333;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .file-input-hint {
            color: #999;
            font-size: 12px;
          }

          .selected-file {
            margin-top: 16px;
            padding: 12px;
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            border-radius: 4px;
            display: none;
          }

          .selected-file.show {
            display: block;
          }

          .selected-file-name {
            color: #2e7d32;
            font-weight: 500;
            margin-bottom: 8px;
          }

          .selected-file-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 12px;
            color: #666;
          }

          .file-info-item {
            background: white;
            padding: 8px;
            border-radius: 4px;
          }

          .file-info-label {
            color: #999;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .file-info-value {
            color: #333;
            font-weight: 500;
            margin-top: 4px;
          }

          .progress-section {
            display: none;
            margin: 24px 0;
          }

          .progress-section.show {
            display: block;
          }

          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 14px;
            color: #333;
          }

          .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 4px;
          }

          .progress-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-top: 12px;
          }

          .stat {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
          }

          .stat-label {
            font-size: 11px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }

          .stat-value {
            font-size: 16px;
            font-weight: 600;
            color: #667eea;
          }

          .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 30px;
          }

          button {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 14px;
          }

          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }

          .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }

          .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .btn-secondary {
            background: #f0f0f0;
            color: #333;
          }

          .btn-secondary:hover {
            background: #e0e0e0;
          }

          .status {
            margin-top: 20px;
            padding: 16px;
            border-radius: 6px;
            font-size: 14px;
            display: none;
          }

          .status.show {
            display: block;
          }

          .status.success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid #4caf50;
          }

          .status.error {
            background: #ffebee;
            color: #c62828;
            border-left: 4px solid #f44336;
          }

          .status-icon {
            margin-right: 8px;
          }

          .info-box {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #333;
            line-height: 1.6;
          }

          .info-box strong {
            color: #667eea;
          }

          @media (max-width: 600px) {
            .header {
              padding: 20px;
            }

            .card {
              padding: 20px;
            }

            .file-input-label {
              padding: 20px;
            }

            .progress-stats {
              grid-template-columns: 1fr;
            }

            .form-actions {
              flex-direction: column;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="margin-bottom: 16px;">
              <a href="/" class="back-link">← Back to App</a>
            </div>
            <h1>📤 Upload Image</h1>
            <p>Drag and drop or select an image file</p>
          </div>

          <div class="card">
            <div class="info-box">
              <strong>💡 Tip:</strong> Your images will be automatically optimized and converted to WebP format in both lossy and lossless variants.
            </div>

          <form id="uploadForm" enctype="multipart/form-data">
              <div class="form-group">
                <label>Select Image File</label>
                <div class="file-input-wrapper">
                  <input 
                    type="file" 
                    id="fileInput" 
                    name="myImage" 
                    accept="image/*"
                    required
                  >
                  <label for="fileInput" class="file-input-label" id="fileLabel">
                    <span class="file-input-icon">🖼️</span>
                    <div class="file-input-text">Click to select or drag & drop</div>
                    <div class="file-input-hint">PNG, JPG, GIF, or WebP (max 50MB)</div>
                  </label>
                </div>

                <div class="selected-file" id="selectedFile">
                  <div class="selected-file-name" id="selectedFileName"></div>
                  <div class="selected-file-info">
                    <div class="file-info-item">
                      <div class="file-info-label">File Size</div>
                      <div class="file-info-value" id="fileSize"></div>
                    </div>
                    <div class="file-info-item">
                      <div class="file-info-label">File Type</div>
                      <div class="file-info-value" id="fileType"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Image Preview -->
              <div class="form-group" id="previewSection" style="display: none;">
                <label>Preview</label>
                <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center;">
                  <img id="imagePreview" style="max-width: 100%; max-height: 300px; border-radius: 6px;" alt="Preview">
                </div>
              </div>

              <!-- Quality Settings -->
              <div class="form-group" id="qualitySection" style="display: none;">
                <label>WebP Quality Settings</label>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                  <!-- Lossy Quality -->
                  <div style="background: #f9f7ff; border-radius: 8px; padding: 16px; border: 2px solid #e8e0ff;">
                    <h4 style="color: #667eea; margin-bottom: 12px; font-size: 14px;">📊 Lossy</h4>
                    <div style="margin-bottom: 12px;">
                      <label style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                        <span>Quality Level</span>
                        <span id="lossyQualityValue" style="font-weight: 600; color: #667eea;">75</span>
                      </label>
                      <input type="range" id="lossyQuality" min="1" max="100" value="75" style="width: 100%; cursor: pointer;">
                    </div>
                    <div style="background: white; padding: 8px; border-radius: 4px; font-size: 11px; color: #666;">
                      <div>Better compression</div>
                      <div style="margin-top: 4px; color: #999;">Smaller file size</div>
                    </div>
                  </div>

                  <!-- Lossless Quality -->
                  <div style="background: #f5fff0; border-radius: 8px; padding: 16px; border: 2px solid #e0f2d4;">
                    <h4 style="color: #4caf50; margin-bottom: 12px; font-size: 14px;">🎨 Lossless</h4>
                    <div style="margin-bottom: 12px;">
                      <label style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px;">
                        <span>Quality Level</span>
                        <span id="losslessQualityValue" style="font-weight: 600; color: #4caf50;">75</span>
                      </label>
                      <input type="range" id="losslessQuality" min="1" max="100" value="75" style="width: 100%; cursor: pointer;">
                    </div>
                    <div style="background: white; padding: 8px; border-radius: 4px; font-size: 11px; color: #666;">
                      <div>Perfect quality</div>
                      <div style="margin-top: 4px; color: #999;">Larger file size</div>
                    </div>
                  </div>
                </div>

                <!-- Savings Preview -->
                <div id="savingsPreview" style="background: #fff8e1; border-left: 4px solid #fbc02d; padding: 16px; border-radius: 6px; display: none;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    <div>
                      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Original Size</div>
                      <div style="font-size: 18px; font-weight: 600; color: #333;" id="originalSize">-</div>
                    </div>
                    <div>
                      <div style="font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Estimated Savings</div>
                      <div style="font-size: 18px; font-weight: 600; color: #4caf50;" id="estimatedSavings">-</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="progress-section" id="progressSection">
                <div class="progress-label">
                  <span>Uploading...</span>
                  <span id="progressPercent">0%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" id="progressFill"></div>
                </div>
                <div class="progress-stats">
                  <div class="stat">
                    <div class="stat-label">Speed</div>
                    <div class="stat-value" id="uploadSpeed">0 MB/s</div>
                  </div>
                  <div class="stat">
                    <div class="stat-label">Elapsed</div>
                    <div class="stat-value" id="elapsedTime">0s</div>
                  </div>
                  <div class="stat">
                    <div class="stat-label">Remaining</div>
                    <div class="stat-value" id="remainingTime">-</div>
                  </div>
                </div>
              </div>

              <div class="status" id="status"></div>

              <div class="form-actions">
                <button type="submit" class="btn-primary" id="submitBtn">Upload Image</button>
                <button type="reset" class="btn-secondary" id="resetBtn">Clear</button>
              </div>
            </form>
          </div>
        </div>

        <script>
          const fileInput = document.getElementById('fileInput');
          const fileLabel = document.getElementById('fileLabel');
          const selectedFile = document.getElementById('selectedFile');
          const uploadForm = document.getElementById('uploadForm');
          const progressSection = document.getElementById('progressSection');
          const statusDiv = document.getElementById('status');
          const submitBtn = document.getElementById('submitBtn');
          const previewSection = document.getElementById('previewSection');
          const qualitySection = document.getElementById('qualitySection');
          const lossyQuality = document.getElementById('lossyQuality');
          const losslessQuality = document.getElementById('losslessQuality');
          const lossyQualityValue = document.getElementById('lossyQualityValue');
          const losslessQualityValue = document.getElementById('losslessQualityValue');
          const savingsPreview = document.getElementById('savingsPreview');

          const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
          let currentFileSize = 0;

          // Quality slider events
          lossyQuality.addEventListener('input', (e) => {
            lossyQualityValue.textContent = e.target.value;
            updateSavingsEstimate();
          });

          losslessQuality.addEventListener('input', (e) => {
            losslessQualityValue.textContent = e.target.value;
            updateSavingsEstimate();
          });

          // Drag and drop
          fileLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileLabel.classList.add('active');
          });

          fileLabel.addEventListener('dragleave', () => {
            fileLabel.classList.remove('active');
          });

          fileLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            fileLabel.classList.remove('active');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              fileInput.files = files;
              handleFileSelect();
            }
          });

          fileInput.addEventListener('change', handleFileSelect);

          function handleFileSelect() {
            const file = fileInput.files?.[0];
            if (!file) {
              selectedFile.classList.remove('show');
              previewSection.style.display = 'none';
              qualitySection.style.display = 'none';
              return;
            }

            // Validate file
            if (!file.type.startsWith('image/')) {
              showStatus('error', '❌ Please select a valid image file');
              fileInput.value = '';
              selectedFile.classList.remove('show');
              previewSection.style.display = 'none';
              qualitySection.style.display = 'none';
              return;
            }

            if (file.size > MAX_FILE_SIZE) {
              showStatus('error', '❌ File size exceeds 50MB limit');
              fileInput.value = '';
              selectedFile.classList.remove('show');
              previewSection.style.display = 'none';
              qualitySection.style.display = 'none';
              return;
            }

            // Store file size for savings calculation
            currentFileSize = file.size;

            // Show file info
            document.getElementById('selectedFileName').textContent = '✓ ' + file.name;
            document.getElementById('fileSize').textContent = formatFileSize(file.size);
            document.getElementById('fileType').textContent = file.type || 'Unknown';
            selectedFile.classList.add('show');
            statusDiv.classList.remove('show');
            progressSection.classList.remove('show');

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
              document.getElementById('imagePreview').src = e.target?.result || '';
              previewSection.style.display = 'block';
            };
            reader.readAsDataURL(file);

            // Show quality settings
            qualitySection.style.display = 'block';
            updateSavingsEstimate();
          }

          function updateSavingsEstimate() {
            if (currentFileSize === 0) return;

            // Rough estimation: WebP typically saves 25-35% of size
            const savingsPercentage = 30;
            const estimatedSavings = (currentFileSize * savingsPercentage) / 100;
            
            document.getElementById('originalSize').textContent = formatFileSize(currentFileSize);
            document.getElementById('estimatedSavings').textContent = formatFileSize(estimatedSavings) + ' (~' + savingsPercentage + '%)';
            savingsPreview.style.display = 'block';
          }

          uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const file = fileInput.files?.[0];
            if (!file) {
              showStatus('error', '❌ Please select a file');
              return;
            }

            // Get quality settings
            const lossyQualityValue = parseInt(lossyQuality.value, 10);
            const losslessQualityValue = parseInt(losslessQuality.value, 10);

            // Start upload
            progressSection.classList.add('show');
            statusDiv.classList.remove('show');
            submitBtn.disabled = true;

            const formData = new FormData();
            formData.append('myImage', file);
            formData.append('lossyQuality', String(lossyQualityValue));
            formData.append('losslessQuality', String(losslessQualityValue));

            const token = localStorage.getItem('access_token') || '';
            const headers = {};
            if (token) {
              headers.Authorization = 'Bearer ' + token;
            }

            const startTime = Date.now();
            let lastUpdateTime = startTime;
            let lastLoadedBytes = 0;

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                document.getElementById('progressPercent').textContent = percent + '%';
                document.getElementById('progressFill').style.width = percent + '%';

                // Calculate speed
                const now = Date.now();
                const timeDelta = (now - lastUpdateTime) / 1000; // seconds
                if (timeDelta >= 0.5) {
                  const bytesDelta = e.loaded - lastLoadedBytes;
                  const speedMbps = (bytesDelta / timeDelta / 1024 / 1024).toFixed(2);
                  document.getElementById('uploadSpeed').textContent = speedMbps + ' MB/s';
                  lastUpdateTime = now;
                  lastLoadedBytes = e.loaded;
                }

                // Elapsed time
                const elapsedSeconds = Math.round((now - startTime) / 1000);
                document.getElementById('elapsedTime').textContent = formatTime(elapsedSeconds);

                // Remaining time
                if (e.loaded > 0) {
                  const totalSeconds = (elapsedSeconds * e.total) / e.loaded;
                  const remainingSeconds = Math.round(totalSeconds - elapsedSeconds);
                  document.getElementById('remainingTime').textContent = formatTime(Math.max(0, remainingSeconds));
                }
              }
            });

            xhr.addEventListener('load', () => {
              submitBtn.disabled = false;
              progressSection.classList.remove('show');

              if (xhr.status === 200) {
                showStatus('success', '✅ Image uploaded successfully! Processing with selected quality settings...');
                uploadForm.reset();
                selectedFile.classList.remove('show');
                previewSection.style.display = 'none';
                qualitySection.style.display = 'none';
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              } else {
                const error = xhr.responseText || 'Upload failed';
                showStatus('error', '❌ ' + error);
              }
            });

            xhr.addEventListener('error', () => {
              submitBtn.disabled = false;
              progressSection.classList.remove('show');
              showStatus('error', '❌ Upload error. Please try again.');
            });

            xhr.addEventListener('abort', () => {
              submitBtn.disabled = false;
              progressSection.classList.remove('show');
              showStatus('error', '❌ Upload cancelled.');
            });

            xhr.open('POST', '/uploads');
            if (token) {
              xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
            xhr.send(formData);
          });

          function showStatus(type, message) {
            statusDiv.className = 'status show ' + type;
            statusDiv.innerHTML = message;
          }

          function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
          }

          function formatTime(seconds) {
            if (seconds < 60) return seconds + 's';
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return mins + 'm ' + secs + 's';
          }
        </script>
      </body>
      </html>
    `;
  }

  uploadPhoto(req: AuthenticatedUploadRequest, res: Response): Promise<string> {
    return uploadService.uploadPhoto(req, res);
  }
}

export = Upload;

