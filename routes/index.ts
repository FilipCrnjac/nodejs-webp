import express, { Request, Response } from 'express';

const router = express.Router();

/* GET home page. */
router.get('/', function(req: Request, res: Response) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Image Upload App</title>
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
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          max-width: 800px;
          width: 100%;
          overflow: hidden;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }

        .header h1 {
          font-size: 32px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .header p {
          font-size: 14px;
          opacity: 0.9;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e0e0e0;
          background: #f5f5f5;
        }

        .tab-button {
          flex: 1;
          padding: 16px 20px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 3px solid transparent;
        }

        .tab-button:hover {
          background: #eee;
          color: #333;
        }

        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
          background: white;
        }

        .content {
          padding: 40px 30px;
          display: none;
          animation: fadeIn 0.3s ease;
        }

        .content.active {
          display: block;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .content h2 {
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        }

        .content p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .cta-button {
          display: inline-block;
          padding: 12px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: none;
          cursor: pointer;
          font-size: 14px;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .status {
          display: inline-block;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
        }

        .status.logged-out {
          background: #ffebee;
          color: #c62828;
        }

        .status.logged-in {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .info-box {
          background: #f0f4ff;
          border-left: 4px solid #667eea;
          padding: 16px;
          border-radius: 6px;
          margin: 20px 0;
        }

        .info-box strong {
          color: #667eea;
        }

        .footer {
          background: #f5f5f5;
          padding: 20px;
          text-align: center;
          color: #999;
          font-size: 12px;
          border-top: 1px solid #e0e0e0;
        }

        .toast-container {
          position: fixed;
          right: 20px;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 9999;
          pointer-events: none;
        }

        .toast {
          min-width: 260px;
          max-width: min(420px, 90vw);
          border-radius: 8px;
          padding: 12px 14px;
          color: #fff;
          font-size: 14px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .toast.show {
          opacity: 1;
          transform: translateY(0);
        }

        .toast.success { background: #2e7d32; }
        .toast.error { background: #c62828; }
        .toast.info { background: #546e7a; }

        .quality-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }

        .quality-card {
          border-radius: 10px;
          padding: 16px;
          border: 1px solid #e5e7eb;
        }

        .quality-card.lossy {
          background: #fff8f0;
          border-color: #f7dec3;
        }

        .quality-card.lossless {
          background: #f3fff6;
          border-color: #d9f0df;
        }

        .quality-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
          color: #333;
          font-size: 15px;
          font-weight: 600;
        }

        .quality-help {
          color: #666;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .quality-value {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.85);
          font-size: 12px;
          font-weight: 700;
          color: #333;
        }

        .quality-card input[type="range"] {
          width: 100%;
          accent-color: #667eea;
        }

        .upload-dropzone {
          border: 2px dashed #667eea;
          border-radius: 10px;
          background: #f6f7ff;
          padding: 18px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .upload-dropzone.active {
          border-color: #4f46e5;
          background: #eef0ff;
        }

        .upload-dropzone-title {
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .upload-dropzone-help {
          color: #6b7280;
          font-size: 12px;
        }

        .upload-preview {
          margin-top: 14px;
          border-radius: 10px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: center;
          display: none;
        }

        .upload-preview.show {
          display: block;
        }

        .upload-preview img {
          max-width: 100%;
          max-height: 260px;
          object-fit: contain;
          border-radius: 8px;
        }

        @media (max-width: 600px) {
          .header {
            padding: 30px 15px;
          }

          .header h1 {
            font-size: 24px;
          }

          .tab-button {
            padding: 12px 10px;
            font-size: 12px;
          }

          .content {
            padding: 25px 15px;
          }

          .quality-grid {
            grid-template-columns: 1fr;
          }
        }
      </style>
    </head>
    <body>
      <div style="display: none;">Path: /</div>
      <a href="/login" style="display: none;">/login</a>
      <div class="container">
        <div class="header">
          <h1>🖼️ Image Upload Studio</h1>
          <p>Share, manage, and optimize your images</p>
        </div>

        <div class="tabs">
          <button class="tab-button active" onclick="switchTab(event, 'home')">Home</button>
          <button class="tab-button" onclick="switchTab(event, 'login')">Account</button>
          <button class="tab-button" onclick="switchTab(event, 'upload')">Upload</button>
          <button class="tab-button" onclick="switchTab(event, 'gallery')">Gallery</button>
        </div>

        <!-- HOME TAB -->
        <div id="home" class="content active">
          <h2>Welcome to Image Upload Studio</h2>
          <p>Your personal image management platform with WebP optimization and secure authentication.</p>
          
          <div class="info-box">
            <strong>✨ Features:</strong>
            <ul style="margin: 10px 0 0 20px; color: #333;">
              <li>📤 Upload and optimize images automatically</li>
              <li>🎨 WebP conversion with lossless & lossy options</li>
              <li>🔒 Secure authentication with JWT tokens</li>
              <li>👤 Personal gallery per user</li>
              <li>🗑️ Easy image management</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            <strong>Get started:</strong> Sign in or register to manage your images.
          </p>
          <button class="cta-button" onclick="switchTab(event, 'login')">Go to Account →</button>
        </div>

        <!-- LOGIN/REGISTER TAB -->
        <div id="login" class="content">
          <h2>Account</h2>
          
          <div style="margin: 20px 0;">
            <div>
              <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;">Username</label>
              <input id="username" type="text" value="user1" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" />
            </div>

            <div style="margin-top: 16px;">
              <label style="display: block; margin-bottom: 8px; color: #333; font-weight: 500;">Password</label>
              <input id="password" type="password" value="password1" 
                     style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" />
            </div>

            <div style="margin-top: 24px; display: flex; gap: 10px;">
              <button id="sign-in-btn" class="cta-button" onclick="login()" style="flex: 1; text-align: center;">Sign In</button>
              <button id="register-btn" class="cta-button" onclick="register()" style="flex: 1; text-align: center; background: #764ba2;">Register</button>
            </div>

            <div style="margin-top: 16px; display: flex; gap: 10px;">
              <button class="cta-button" onclick="refreshToken()" style="flex: 1; background: #888;">Refresh Token</button>
              <button id="sign-out-btn" class="cta-button" onclick="logout()" style="flex: 1; background: #d32f2f;">Sign Out</button>
            </div>
          </div>

          <div style="margin-top: 30px;">
            <h3 style="color: #333; margin-bottom: 12px;">Status</h3>
            <div id="status" class="status logged-out">Not authenticated</div>
          </div>

          <div style="margin-top: 20px;">
            <h3 style="color: #333; margin-bottom: 12px;">Access Token</h3>
            <pre id="token" style="background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 11px; color: #666;">(none)</pre>
          </div>
        </div>

        <!-- UPLOAD TAB -->
        <div id="upload" class="content">
          <h2>Upload Image</h2>
          <p>Upload your images and we'll automatically optimize them for web.</p>
          
          <div id="upload-login-note" class="info-box" style="display: none;">
            <strong>Sign in required:</strong> Upload is enabled after you sign in from the <strong>Account</strong> tab.
          </div>

          <div style="margin-top: 30px;">
            <form id="home-upload-form" action="/uploads" method="POST" enctype="multipart/form-data">
              <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; color: #333; font-weight: 500;">Select Image</label>
                <input id="home-upload-file" type="file" name="myImage" accept="image/*" required style="display: none;" />
                <div id="home-upload-dropzone" class="upload-dropzone" tabindex="0" role="button" aria-label="Select image file">
                  <div class="upload-dropzone-title">Click or drag and drop image here</div>
                  <div class="upload-dropzone-help">PNG, JPG, GIF, WEBP</div>
                </div>
                <div id="home-upload-preview-section" class="upload-preview">
                  <img id="home-upload-preview" alt="Selected image preview">
                </div>
              </div>

              <div class="quality-grid">
                <div class="quality-card lossy">
                  <div class="quality-title">
                    <span>📊 Lossy quality</span>
                    <span id="home-lossy-quality-value" class="quality-value">75</span>
                  </div>
                  <p class="quality-help">Smaller file size with very good visual quality for web delivery.</p>
                  <input id="home-lossy-quality" type="range" name="lossyQuality" min="1" max="100" value="75" />
                </div>

                <div class="quality-card lossless">
                  <div class="quality-title">
                    <span>🎨 Lossless quality</span>
                    <span id="home-lossless-quality-value" class="quality-value">75</span>
                  </div>
                  <p class="quality-help">Keeps exact image fidelity while still producing a WebP variant.</p>
                  <input id="home-lossless-quality" type="range" name="losslessQuality" min="1" max="100" value="75" />
                </div>
              </div>

              <button id="home-upload-submit" type="submit" class="cta-button" style="width: 100%; text-align: center;">Upload & Optimize</button>
            </form>
            <p id="upload-status" style="display: none; margin-top: 12px; font-size: 14px;"></p>
          </div>

          <div style="margin-top: 30px;">
            <h3 style="color: #333; margin-bottom: 12px;">Supported Formats</h3>
            <p style="color: #666;">JPG, PNG, GIF, WebP</p>
          </div>
        </div>

        <!-- GALLERY TAB -->
        <div id="gallery" class="content">
          <h2>My Gallery</h2>
          <p>View and manage your uploaded images.</p>
          
          <div id="gallery-login-note" class="info-box">
            <strong>ℹ️ Note:</strong> Sign in to see your personal gallery.
          </div>

          <p id="gallery-link-container" style="margin-top: 20px; display: none;">
            <a id="my-images-link" href="#" class="cta-button">Open My Gallery →</a>
          </p>
        </div>

        <div class="footer">
          <p>© 2026 Image Upload Studio. All images are securely stored and optimized.</p>
        </div>
      </div>
      <div id="toast-container" class="toast-container"></div>

      <script>
        function setActiveTab(tabName) {

          // Hide all tabs
          const contents = document.querySelectorAll('.content');
          contents.forEach(content => content.classList.remove('active'));

          // Remove active state from all buttons
          const buttons = document.querySelectorAll('.tab-button');
          buttons.forEach(button => button.classList.remove('active'));

          // Show selected tab
          const targetContent = document.getElementById(tabName);
          if (!targetContent) {
            return;
          }

          targetContent.classList.add('active');

          const targetButton = document.querySelector('.tab-button[onclick*="' + tabName + '"]');
          if (targetButton) {
            targetButton.classList.add('active');
          }
        }

        function switchTab(event, tabName) {
          event?.preventDefault?.();
          setActiveTab(tabName);
        }

        function setToken(value) {
          localStorage.setItem('access_token', value || '');
          const tokenEl = document.getElementById('token');
          const statusEl = document.getElementById('status');
          if (value) {
            tokenEl.textContent = value;
            statusEl.textContent = '✓ Authenticated';
            statusEl.className = 'status logged-in';
          } else {
            tokenEl.textContent = '(none)';
            statusEl.textContent = '✗ Not authenticated';
            statusEl.className = 'status logged-out';
          }
          updateAuthButtons(Boolean(value));
          updateGalleryLink();
          updateUploadAccess();
        }

        function updateAuthButtons(isLoggedIn) {
          const signInButton = document.getElementById('sign-in-btn');
          const signOutButton = document.getElementById('sign-out-btn');
          const registerButton = document.getElementById('register-btn');
          if (signInButton) {
            signInButton.style.display = isLoggedIn ? 'none' : '';
          }
          if (signOutButton) {
            signOutButton.style.display = isLoggedIn ? '' : 'none';
          }
          if (registerButton) {
            registerButton.style.display = isLoggedIn ? 'none' : '';
          }
        }

        function showToast(message, type = 'info') {
          const container = document.getElementById('toast-container');
          if (!container) {
            return;
          }

          const toast = document.createElement('div');
          toast.className = 'toast ' + type;
          toast.textContent = message;
          container.appendChild(toast);

          requestAnimationFrame(() => toast.classList.add('show'));

          setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 200);
          }, 2600);
        }

        function updateUploadAccess() {
          const hasToken = Boolean(localStorage.getItem('access_token'));
          const note = document.getElementById('upload-login-note');
          const fileInput = document.getElementById('home-upload-file');
          const dropzone = document.getElementById('home-upload-dropzone');
          const submitButton = document.getElementById('home-upload-submit');
          const lossyQualityInput = document.getElementById('home-lossy-quality');
          const losslessQualityInput = document.getElementById('home-lossless-quality');
          const status = document.getElementById('upload-status');

          if (note) {
            note.style.display = hasToken ? 'none' : 'block';
          }

          if (fileInput) {
            fileInput.disabled = !hasToken;
          }

          if (dropzone) {
            dropzone.style.opacity = hasToken ? '1' : '0.6';
            dropzone.style.cursor = hasToken ? 'pointer' : 'not-allowed';
            dropzone.setAttribute('aria-disabled', hasToken ? 'false' : 'true');
          }

          if (submitButton) {
            submitButton.disabled = !hasToken;
            submitButton.style.opacity = hasToken ? '1' : '0.6';
            submitButton.style.cursor = hasToken ? 'pointer' : 'not-allowed';
          }

          if (lossyQualityInput) {
            lossyQualityInput.disabled = !hasToken;
          }

          if (losslessQualityInput) {
            losslessQualityInput.disabled = !hasToken;
          }

          if (status && !hasToken) {
            status.style.display = 'none';
            status.textContent = '';
          }
        }

        function syncHomeQualityLabel(inputId, outputId) {
          const input = document.getElementById(inputId);
          const output = document.getElementById(outputId);
          if (!input || !output) {
            return;
          }

          const update = () => {
            output.textContent = input.value;
          };

          input.addEventListener('input', update);
          update();
        }

        function setupHomeUploadDropzone() {
          const fileInput = document.getElementById('home-upload-file');
          const dropzone = document.getElementById('home-upload-dropzone');
          const previewSection = document.getElementById('home-upload-preview-section');
          const previewImage = document.getElementById('home-upload-preview');
          if (!fileInput || !dropzone || !previewSection || !previewImage) {
            return;
          }

          function showPreview(file) {
            if (!file || !file.type || !file.type.startsWith('image/')) {
              previewSection.classList.remove('show');
              previewImage.removeAttribute('src');
              return;
            }

            const reader = new FileReader();
            reader.onload = event => {
              previewImage.src = event.target?.result || '';
              previewSection.classList.add('show');
            };
            reader.readAsDataURL(file);
          }

          dropzone.addEventListener('click', () => {
            if (fileInput.disabled) {
              return;
            }
            fileInput.click();
          });
          dropzone.addEventListener('keydown', event => {
            if (fileInput.disabled) {
              return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              fileInput.click();
            }
          });

          ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, event => {
              event.preventDefault();
              dropzone.classList.add('active');
            });
          });

          ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, event => {
              event.preventDefault();
              dropzone.classList.remove('active');
            });
          });

          dropzone.addEventListener('drop', event => {
            if (fileInput.disabled) {
              return;
            }
            const file = event.dataTransfer?.files?.[0];
            if (!file) {
              return;
            }

            fileInput.files = event.dataTransfer.files;
            showPreview(file);
            dropzone.querySelector('.upload-dropzone-title').textContent = file.name;
          });

          fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            showPreview(file);
            const title = dropzone.querySelector('.upload-dropzone-title');
            if (title) {
              title.textContent = file ? file.name : 'Click or drag and drop image here';
            }
          });
        }

        async function register() {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          
          if (!username || !password) {
            showToast('Please enter username and password', 'error');
            return;
          }

          const response = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const body = await response.json();
          
          if (!response.ok) {
            showToast(body.message || 'Registration failed', 'error');
            return;
          }
          
          localStorage.setItem('user_id', String(body.userId || ''));
          setToken(body.token || '');
          showToast('Registration successful!', 'success');
        }

        async function login() {
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;

          const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const body = await response.json();
          
          if (!response.ok) {
            showToast(body.message || 'Login failed', 'error');
            return;
          }
          
          localStorage.setItem('user_id', String(body.userId || ''));
          setToken(body.token || '');
          showToast('Welcome back!', 'success');
        }

        function updateGalleryLink() {
          const userId = localStorage.getItem('user_id') || '';
          const container = document.getElementById('gallery-link-container');
          const link = document.getElementById('my-images-link');
          const note = document.getElementById('gallery-login-note');
          
          if (userId) {
            link.href = '/images/' + userId + '/grouped/html';
            link.textContent = '👤 Open My Gallery (User ' + userId + ') →';
            container.style.display = '';
            if (note) {
              note.style.display = 'none';
            }
          } else {
            container.style.display = 'none';
            if (note) {
              note.style.display = '';
            }
          }
        }

        async function refreshToken() {
          const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          const body = await response.json();
          
          if (!response.ok) {
            showToast(body.message || 'Refresh failed', 'error');
            return;
          }
          
          setToken(body.token || '');
          showToast('Token refreshed', 'success');
        }

        async function logout() {
          const response = await fetch('/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          
          setToken('');
          localStorage.removeItem('user_id');
          showToast('Signed out successfully', 'success');
        }

        async function submitUploadFromHomeTab(event) {
          event.preventDefault();

          const form = document.getElementById('home-upload-form');
          const submitButton = document.getElementById('home-upload-submit');
          const status = document.getElementById('upload-status');
          if (!form || !submitButton || !status) {
            return;
          }

          const formData = new FormData(form);
          const token = localStorage.getItem('access_token') || '';

          if (!token) {
            status.style.display = 'block';
            status.style.color = '#c62828';
            status.textContent = 'Please sign in first to upload.';
            return;
          }

          submitButton.disabled = true;
          status.style.display = 'block';
          status.style.color = '#666';
          status.textContent = 'Uploading...';

          try {
            const response = await fetch('/uploads', {
              method: 'POST',
              headers: token ? { Authorization: 'Bearer ' + token } : {},
              body: formData,
            });

            const body = await response.text();
            if (!response.ok) {
              status.style.color = '#c62828';
              status.textContent = body || 'Upload failed. Please sign in and try again.';
              return;
            }

            document.open();
            document.write(body);
            document.close();
          } catch (error) {
            status.style.color = '#c62828';
            status.textContent = 'Upload failed due to a network error.';
          } finally {
            submitButton.disabled = false;
          }
        }

        const homeUploadForm = document.getElementById('home-upload-form');
        if (homeUploadForm) {
          homeUploadForm.addEventListener('submit', submitUploadFromHomeTab);
        }

        syncHomeQualityLabel('home-lossy-quality', 'home-lossy-quality-value');
        syncHomeQualityLabel('home-lossless-quality', 'home-lossless-quality-value');
        setupHomeUploadDropzone();

        const initialTab = new URLSearchParams(window.location.search).get('tab') || 'home';
        setActiveTab(initialTab);

        // Initialize on page load
        setToken(localStorage.getItem('access_token') || '');
      </script>
    </body>
    </html>
  `;

  return res.type('.html').send(html);
});

router.get('/login', function(req: Request, res: Response) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Login</title>
      <style>
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .card {
          background: #fff;
          border-radius: 16px;
          max-width: 520px;
          width: 100%;
          padding: 32px 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.22);
          text-align: center;
        }

        h1 {
          margin: 0 0 12px;
          color: #222;
        }

        p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        a {
          display: inline-block;
          padding: 12px 20px;
          border-radius: 10px;
          color: #fff;
          text-decoration: none;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-weight: 600;
        }
      </style>
      <meta http-equiv="refresh" content="0; url=/?tab=login">
    </head>
    <body>
      <div class="card">
        <div style="display:none;">Path: /login</div>
        <h1>Login</h1>
        <p>Redirecting you to the account tab…</p>
        <a href="/?tab=login">Open Login</a>
      </div>
      <script>
        window.location.replace('/?tab=login');
      </script>
    </body>
    </html>
  `;

  return res.type('.html').send(html);
});


export = router;
