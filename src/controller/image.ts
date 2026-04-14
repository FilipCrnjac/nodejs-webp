import ImageService = require('./../services/imageService');

const imageService = new ImageService();

class Image {
  getImageDirectories(): string {
    const links = imageService.getDirectories().map(dir => {
      return `<li><h3>${dir} - <a href=images/${dir}/html>HTML</a> / <a href=images/${dir}/json>JSON</a></<br></h3></li>`;
    });
    const isEmpty = links.length ? `:` : ` is empty. Upload some images on <a href="/uploads">/uploads</a>.`;

    return `
      <!DOCTYPE html>
      <html><body>
        <h1>Path: /images</h1>
        <h2><a href="/">HOME</a></h2>
        <h2>List of directories${isEmpty}</h2>
          <ul>${links.join("")}</ul>
      </body></html>
     `;
  }

  getDirectoryHtml(folderId: number): string {
    let imagesHtml = '';
    imageService.getDirectoryFilesWithSize(folderId).forEach(file => {
      const safeFile = encodeURIComponent(file.name);
      const fileUrl = `/images/${folderId}/files/${safeFile}`;
      const escapedFileName = escapeHtml(file.name);
      const escapedFileUrl = escapeHtml(fileUrl);
      imagesHtml += `
        <figure class="image-card" data-page-item="true" data-image-name="${escapeHtml(file.name.toLowerCase())}">
          <div class="image-wrapper" data-image-url="${escapedFileUrl}" data-image-name="${escapedFileName}" onclick="openLightboxFromCard(this)" onkeydown="handleImageCardKeydown(event, this)" role="button" tabindex="0" aria-label="Open ${escapedFileName}">
            <img src="${fileUrl}" alt="${escapedFileName}" onload="doneLoading(${JSON.stringify(file.name)})" title="Click to enlarge">
            <div class="image-overlay">
              <svg class="zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
                <path d="M11 8v6M8 11h6"></path>
              </svg>
            </div>
          </div>
          <figcaption class="image-meta">
            <div class="image-name">${file.name}</div>
            <div class="image-size">${formatFileSize(file.sizeBytes)}</div>
          </figcaption>
        </figure>
      `;
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Gallery</title>
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
            max-width: 1400px;
            margin: 0 auto;
          }

          .header {
            background: white;
            border-radius: 12px;
            padding: 30px 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }

          .header-content h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 8px;
          }

          .header-content p {
            color: #666;
            font-size: 14px;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: none;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
          }

          .back-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }

          .view-toggle {
            display: inline-flex;
            border: 1px solid #dbe2ff;
            border-radius: 999px;
            overflow: hidden;
            background: #f7f8ff;
          }

          .view-toggle-link {
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 700;
            color: #4b5563;
            text-decoration: none;
            letter-spacing: 0.2px;
          }

          .view-toggle-link.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
          }

          .view-toggle-link:not(.active):hover {
            background: #e9edff;
            color: #374151;
          }

          .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .gallery-toolbar {
            margin-bottom: 14px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .gallery-search {
            flex: 1;
            min-width: 220px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 14px;
          }

          .gallery-search:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
          }

          .clear-search-btn {
            border: none;
            border-radius: 8px;
            background: #eef0f9;
            color: #374151;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 12px;
            cursor: pointer;
          }

          .pagination {
            margin-top: 16px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .pagination.hidden {
            display: none;
          }

          .pagination-meta {
            color: #666;
            font-size: 13px;
          }

          .pagination-actions {
            display: flex;
            gap: 8px;
          }

          .pagination-btn {
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #eef0f9;
            color: #374151;
          }

          .pagination-btn:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          .pagination-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .gallery.empty {
            grid-template-columns: 1fr;
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
          }

          .empty-state svg {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            opacity: 0.5;
          }

          .empty-state h2 {
            color: #666;
            margin-bottom: 10px;
          }

          .empty-state p {
            color: #999;
            margin-bottom: 20px;
          }

          .empty-state a {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s ease;
          }

          .empty-state a:hover {
            transform: translateY(-2px);
          }

          .image-card {
            margin: 0;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 1px solid #f0f0f0;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .image-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
            border-color: #667eea;
          }

          .image-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 100%;
            overflow: hidden;
            background: #f5f5f5;
          }

          .image-wrapper img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 8px;
            transition: opacity 0.2s ease;
          }

          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(102, 126, 234, 0);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s ease;
            opacity: 0;
            pointer-events: none;
          }

          .image-card:hover .image-overlay {
            background: rgba(102, 126, 234, 0.4);
            opacity: 1;
          }

          .zoom-icon {
            width: 40px;
            height: 40px;
            color: white;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          }

          .image-meta {
            padding: 12px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .image-name {
            font-size: 13px;
            font-weight: 500;
            color: #333;
            word-break: break-word;
            line-height: 1.3;
          }

          .image-size {
            font-size: 12px;
            color: #999;
          }

          /* Lightbox */
          #lightbox {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.92);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 20px;
            animation: fadeIn 0.2s ease;
          }

          #lightbox.open {
            display: flex;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          #lightbox img {
            max-width: 95vw;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          #lightbox-caption {
            color: #eee;
            margin-top: 20px;
            font-size: 14px;
            text-align: center;
            max-width: 90vw;
            word-break: break-word;
          }

          #lightbox-close {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 40px;
            color: #fff;
            cursor: pointer;
            line-height: 1;
            user-select: none;
            transition: color 0.2s ease;
            background: rgba(0, 0, 0, 0.4);
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          #lightbox-close:hover {
            color: #fff;
            background: rgba(0, 0, 0, 0.6);
          }

          .lightbox-controls {
            display: flex;
            gap: 12px;
            margin-top: 20px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .lightbox-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
          }

          .delete-btn {
            background: #d32f2f;
            color: white;
          }

          .delete-btn:hover {
            background: #b71c1c;
            box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
          }

          .close-btn {
            background: #666;
            color: white;
          }

          .close-btn:hover {
            background: #555;
          }

          #lightbox-filename {
            display: none;
          }

          @media (max-width: 768px) {
            .gallery {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 16px;
              padding: 16px;
            }

            .header {
              flex-direction: column;
              align-items: flex-start;
            }

            .back-link {
              width: 100%;
              justify-content: center;
            }

            #lightbox img {
              max-height: 60vh;
            }

            .lightbox-controls {
              gap: 8px;
            }

            .lightbox-btn {
              padding: 8px 16px;
              font-size: 13px;
            }
          }

          @media (max-width: 480px) {
            .gallery {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 12px;
              padding: 12px;
            }

            .header-content h1 {
              font-size: 22px;
            }

            #lightbox img {
              max-height: 50vh;
            }

            #lightbox-close {
              top: 10px;
              right: 10px;
              font-size: 32px;
              width: 40px;
              height: 40px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <h1>📸 My Gallery</h1>
              <p>User #${folderId}</p>
            </div>
            <a href="/" class="back-link">← Back to App</a>
          </div>

          <div class="gallery-toolbar">
            <div class="view-toggle" role="tablist" aria-label="Gallery view mode">
              <a href="/images/${folderId}/html" class="view-toggle-link active" role="tab" aria-selected="true">All Images</a>
              <a href="/images/${folderId}/grouped/html" class="view-toggle-link" role="tab" aria-selected="false">Grouped</a>
            </div>
            <input id="gallery-search-input" class="gallery-search" type="search" placeholder="Search by image name..." aria-label="Search images by file name">
            <button id="gallery-search-clear" class="clear-search-btn" type="button">Clear</button>
          </div>

          <div id="gallery-container" class="gallery${imagesHtml.trim() === '' ? ' empty' : ''}">
            ${imagesHtml.trim() === '' ? `
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <path d="m21 15-5-5L5 21"></path>
                </svg>
                <h2>No images yet</h2>
                <p>Upload your first image to get started</p>
                <a href="/">Go to Upload</a>
              </div>
            ` : imagesHtml}
          </div>
          <div id="gallery-pagination" class="pagination hidden">
            <div id="gallery-pagination-meta" class="pagination-meta"></div>
            <div class="pagination-actions">
              <button id="gallery-prev-btn" class="pagination-btn" type="button">Previous</button>
              <button id="gallery-next-btn" class="pagination-btn" type="button">Next</button>
            </div>
          </div>
        </div>

        <div id="lightbox" onclick="closeLightbox()">
          <span id="lightbox-close" onclick="closeLightbox()">&times;</span>
          <img id="lightbox-img" src="" alt="" onclick="event.stopPropagation()">
          <div id="lightbox-caption"></div>
          <div id="lightbox-counter"></div>
          <div class="lightbox-controls">
            <button class="lightbox-btn close-btn" onclick="showPrevImage(event)">Prev</button>
            <button class="lightbox-btn close-btn" onclick="showNextImage(event)">Next</button>
            <button class="lightbox-btn delete-btn" onclick="deleteImage()">🗑️ Delete</button>
            <button class="lightbox-btn close-btn" onclick="closeLightbox()">Close</button>
          </div>
          <span id="lightbox-filename" style="display:none;"></span>
        </div>

        <script>
          const startTime = new Date().getTime();
          const PAGE_SIZE = 9;
          let currentPage = 1;
          let totalPages = 1;
          let currentFilterQuery = '';
          let currentGroupImages = [];
          let currentGroupIndex = 0;
          
          function doneLoading(name) {
            let loadTime = new Date().getTime() - startTime;
            console.log("Image [" + name + "] took " + loadTime + "ms to load");
          }

          function getGalleryItems() {
            return Array.from(document.querySelectorAll('[data-page-item="true"]'));
          }

          function renderPagination() {
            const allItems = getGalleryItems();
            const items = allItems.filter(item => {
              const imageName = (item.dataset.imageName || '').toLowerCase();
              const matches = !currentFilterQuery || imageName.includes(currentFilterQuery);
              if (!matches) {
                item.style.display = 'none';
              }
              return matches;
            });

            const paginationContainer = document.getElementById('gallery-pagination');
            const meta = document.getElementById('gallery-pagination-meta');
            const prevBtn = document.getElementById('gallery-prev-btn');
            const nextBtn = document.getElementById('gallery-next-btn');

            if (!paginationContainer || !meta || !prevBtn || !nextBtn) {
              return;
            }

            if (!items.length) {
              paginationContainer.classList.add('hidden');
              meta.textContent = 'No images match your search.';
              allItems.forEach(item => {
                if (item.style.display !== 'none') {
                  item.style.display = '';
                }
              });
              return;
            }

            if (items.length <= PAGE_SIZE) {
              paginationContainer.classList.add('hidden');
              items.forEach(item => {
                item.style.display = '';
              });
              return;
            }

            totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
            if (currentPage > totalPages) {
              currentPage = totalPages;
            }

            const start = (currentPage - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            items.forEach((item, index) => {
              item.style.display = index >= start && index < end ? '' : 'none';
            });

            meta.textContent = 'Page ' + currentPage + ' of ' + totalPages + ' (' + items.length + ' matching images)';
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
            paginationContainer.classList.remove('hidden');
          }

          function changePage(nextPage) {
            currentPage = Math.max(1, Math.min(nextPage, totalPages));
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          function applyImageSearch(query) {
            currentFilterQuery = String(query || '').trim().toLowerCase();
            currentPage = 1;
            renderPagination();
          }

          function openLightboxFromCard(card) {
            if (!card) {
              return;
            }

            const fallbackUrl = card.dataset.imageUrl || '';
            const fallbackName = card.dataset.imageName || '';
            const groupImagesRaw = card.dataset.groupImages || '';
            const clickedIndex = parseInt(card.dataset.groupIndex || '0', 10);

            try {
              const parsed = JSON.parse(groupImagesRaw || '[]');
              currentGroupImages = Array.isArray(parsed) ? parsed.filter(item => item && item.url) : [];
            } catch {
              currentGroupImages = [];
            }

            if (currentGroupImages.length === 0 && fallbackUrl) {
              currentGroupImages = [{ url: fallbackUrl, name: fallbackName }];
            }

            currentGroupIndex = Number.isFinite(clickedIndex) ? Math.max(0, Math.min(clickedIndex, currentGroupImages.length - 1)) : 0;
            openLightbox();
          }

          function handleImageCardKeydown(event, card) {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openLightboxFromCard(card);
            }
          }

          function openLightbox() {
            if (!currentGroupImages.length) {
              return;
            }

            renderCurrentImage();
            const lb = document.getElementById('lightbox');
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
          }

          function renderCurrentImage() {
            if (!currentGroupImages.length) {
              return;
            }

            const current = currentGroupImages[currentGroupIndex];
            document.getElementById('lightbox-img').src = current.url;
            document.getElementById('lightbox-caption').textContent = current.name || '';
            document.getElementById('lightbox-filename').textContent = current.name || '';
            document.getElementById('lightbox-counter').textContent = (currentGroupIndex + 1) + ' / ' + currentGroupImages.length;
          }

          function showPrevImage(event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }

            if (currentGroupImages.length <= 1) {
              return;
            }

            currentGroupIndex = (currentGroupIndex - 1 + currentGroupImages.length) % currentGroupImages.length;
            renderCurrentImage();
          }

          function showNextImage(event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }

            if (currentGroupImages.length <= 1) {
              return;
            }

            currentGroupIndex = (currentGroupIndex + 1) % currentGroupImages.length;
            renderCurrentImage();
          }

          function closeLightbox() {
            document.getElementById('lightbox').classList.remove('open');
            document.getElementById('lightbox-img').src = '';
            document.body.style.overflow = '';
            currentGroupImages = [];
            currentGroupIndex = 0;
          }

          function getUnauthorizedMessage(responseBody) {
            try {
              const parsed = JSON.parse(responseBody || '{}');
              if (parsed && typeof parsed.message === 'string') {
                return parsed.message;
              }
            } catch {
              return '';
            }
            return '';
          }

          function redirectToLoginWithMessage(message) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            const target = '/?tab=login&authMessage=' + encodeURIComponent(message || 'Please sign in to continue.');
            window.location.replace(target);
          }

          async function deleteImage() {
            const name = document.getElementById('lightbox-filename').textContent;
            if (!confirm('Delete ' + name + ' and its WebP variants?')) return;
            const encoded = encodeURIComponent(name);
            const token = localStorage.getItem('access_token') || '';
            const response = await fetch('/images/${folderId}/files/' + encoded, {
              method: 'DELETE',
              headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            if (response.ok) {
              alert('Image deleted successfully');
              location.reload();
            } else {
              if (response.status === 401) {
                redirectToLoginWithMessage(getUnauthorizedMessage(await response.text()));
                return;
              }
              alert('Failed to delete image');
            }
          }

          document.addEventListener('keydown', e => {
            const lightboxOpen = document.getElementById('lightbox').classList.contains('open');
            if (!lightboxOpen) {
              return;
            }

            if (e.key === 'Escape') {
              closeLightbox();
            } else if (e.key === 'ArrowLeft') {
              showPrevImage();
            } else if (e.key === 'ArrowRight') {
              showNextImage();
            }
          });

          document.getElementById('lightbox-img').addEventListener('wheel', e => {
            e.preventDefault();
            if (e.deltaY > 0) {
              showNextImage();
            } else if (e.deltaY < 0) {
              showPrevImage();
            }
          }, { passive: false });

          const prevBtn = document.getElementById('gallery-prev-btn');
          const nextBtn = document.getElementById('gallery-next-btn');
          if (prevBtn) {
            prevBtn.addEventListener('click', () => changePage(currentPage - 1));
          }
          if (nextBtn) {
            nextBtn.addEventListener('click', () => changePage(currentPage + 1));
          }

          const searchInput = document.getElementById('gallery-search-input');
          const clearSearchButton = document.getElementById('gallery-search-clear');
          if (searchInput) {
            searchInput.addEventListener('input', event => {
              applyImageSearch(event.target.value || '');
            });
          }
          if (clearSearchButton) {
            clearSearchButton.addEventListener('click', () => {
              if (searchInput) {
                searchInput.value = '';
              }
              applyImageSearch('');
            });
          }

          renderPagination();
        </script>
      </body>
      </html>`;
  }

  getDirectoryJson(folderId: number): { images: string[] } {
    return {
      images: imageService.getDirectoryFiles(folderId)
    };
  }

  getGroupedGalleryHtml(folderId: number): string {
    const groups = imageService.getImageGroups(folderId);
    let groupsHtml = '';

    groups.forEach(group => {
      if (!group.original) return;

      const safeOriginalName = encodeURIComponent(group.original.name);
      const fileUrl = `/images/${folderId}/files/${safeOriginalName}`;
      const escapedFileName = escapeHtml(group.original.name);
      const groupId = encodeURIComponent(group.originalName);
      const shareLink = `/images/${folderId}/groups/${groupId}/html`;
      const downloadGroupLink = `/images/${folderId}/groups/${groupId}/download`;

      const lossyVariant = group.variants.find((variant: any) => isLossyVariantName(variant.name));
      const losslessVariant = group.variants.find((variant: any) => isLosslessVariantName(variant.name));
      const originalSize = formatFileSize(group.original.sizeBytes);
      const lossySize = lossyVariant ? formatFileSize(lossyVariant.sizeBytes) : '—';
      const losslessSize = losslessVariant ? formatFileSize(losslessVariant.sizeBytes) : '—';
      const lossyCompression = lossyVariant ? formatCompressionPercent(group.original.sizeBytes, lossyVariant.sizeBytes) : '';
      const losslessCompression = losslessVariant ? formatCompressionPercent(group.original.sizeBytes, losslessVariant.sizeBytes) : '';

      const lossyVariantUrl = lossyVariant ? `/images/${folderId}/files/${encodeURIComponent(lossyVariant.name)}` : '';
      const losslessVariantUrl = losslessVariant ? `/images/${folderId}/files/${encodeURIComponent(losslessVariant.name)}` : '';
      const groupImageSet = [
        { url: fileUrl, name: group.original.name },
        ...(lossyVariant ? [{ url: lossyVariantUrl, name: lossyVariant.name }] : []),
        ...(losslessVariant ? [{ url: losslessVariantUrl, name: losslessVariant.name }] : []),
      ];
      const encodedGroupImageSet = escapeHtml(JSON.stringify(groupImageSet));

      groupsHtml += `
        <div class="image-group-card" data-page-item="true" data-group-name="${escapeHtml(group.originalName)}" data-group-link="${escapeHtml(shareLink)}" ondblclick="openGroupFromCard(event, this)">
          <div class="group-preview-grid">
            <div class="image-wrapper" data-image-url="${escapeHtml(fileUrl)}" data-image-name="${escapedFileName}" data-group-images="${encodedGroupImageSet}" data-group-index="0" onclick="openLightboxFromCard(this)" onkeydown="handleImageCardKeydown(event, this)" role="button" tabindex="0" aria-label="Open ${escapedFileName}">
              <img src="${fileUrl}" alt="${escapedFileName}" onload="doneLoading(${JSON.stringify(group.original.name)})" title="Original image">
              <div class="image-overlay">
                <svg class="zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                  <path d="M11 8v6M8 11h6"></path>
                </svg>
              </div>
            </div>
            <div class="image-wrapper small ${lossyVariant ? '' : 'empty'}" ${lossyVariant ? `data-image-url="${escapeHtml(lossyVariantUrl)}" data-image-name="${escapeHtml(lossyVariant.name)}" data-group-images="${encodedGroupImageSet}" data-group-index="1" onclick="openLightboxFromCard(this)" onkeydown="handleImageCardKeydown(event, this)" role="button" tabindex="0" aria-label="Open ${escapeHtml(lossyVariant.name)}"` : ''}>
               ${lossyVariant ? `<img src="${lossyVariantUrl}" alt="${escapeHtml(lossyVariant.name)}" onload="doneLoading(${JSON.stringify(lossyVariant.name)})" title="Lossy variant"><div class="image-overlay"><svg class="zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><path d="M11 8v6M8 11h6"></path></svg></div>` : `<span class="slot-label">No lossy</span>`}
            </div>
            <div class="image-wrapper small ${losslessVariant ? '' : 'empty'}" ${losslessVariant ? `data-image-url="${escapeHtml(losslessVariantUrl)}" data-image-name="${escapeHtml(losslessVariant.name)}" data-group-images="${encodedGroupImageSet}" data-group-index="2" onclick="openLightboxFromCard(this)" onkeydown="handleImageCardKeydown(event, this)" role="button" tabindex="0" aria-label="Open ${escapeHtml(losslessVariant.name)}"` : ''}>
               ${losslessVariant ? `<img src="${losslessVariantUrl}" alt="${escapeHtml(losslessVariant.name)}" onload="doneLoading(${JSON.stringify(losslessVariant.name)})" title="Lossless variant"><div class="image-overlay"><svg class="zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path><path d="M11 8v6M8 11h6"></path></svg></div>` : `<span class="slot-label">No lossless</span>`}
            </div>
          </div>
          <div class="image-group-meta">
            <div class="image-name">${escapedFileName}</div>
            <div class="image-size group-total-size">Total group size: ${formatFileSize(group.totalSize)}</div>
            <div class="group-size-breakdown">
              <div class="group-size-item"><span>Original</span><strong>${originalSize}</strong></div>
              <div class="group-size-item"><span>Lossy ${lossyCompression ? `<em class="compression-chip compression-lossy">${lossyCompression}</em>` : ''}</span><strong>${lossySize}</strong></div>
              <div class="group-size-item"><span>Lossless ${losslessCompression ? `<em class="compression-chip compression-lossless">${losslessCompression}</em>` : ''}</span><strong>${losslessSize}</strong></div>
            </div>
            <div class="group-actions">
              <a href="${shareLink}" class="group-action-btn view-group-btn" title="Open this group details page" data-label="View group" aria-label="View group">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span class="action-label">View group</span>
              </a>
              <div class="group-actions-secondary">
                <button class="group-action-btn copy-link-btn" data-share-link="${escapeHtml(shareLink)}" onclick="copyGroupLink(this, event)" data-label="Copy link" aria-label="Copy link">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span class="action-label">Copy link</span>
                </button>
                <a href="${downloadGroupLink}" class="group-action-btn zip-btn" title="Download original and variants as ZIP" data-label="ZIP" aria-label="ZIP">
                  <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span class="action-label">ZIP</span>
                </a>
              </div>
              <button class="group-action-btn delete-group-btn" data-group-id="${escapeHtml(group.originalName)}" onclick="deleteGroupFromButton(this, event)" data-label="Delete" aria-label="Delete">
                <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                <span class="action-label">Delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    const emptyState = groups.length === 0 ? `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <path d="m21 15-5-5L5 21"></path>
        </svg>
        <h2>No images yet</h2>
        <p>Upload your first image to get started</p>
        <a href="/">Go to Upload</a>
      </div>
    ` : groupsHtml;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Gallery</title>
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
            max-width: 1400px;
            margin: 0 auto;
          }

          .header {
            background: white;
            border-radius: 12px;
            padding: 30px 20px;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
          }

          .header-content h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 8px;
          }

          .header-content p {
            color: #666;
            font-size: 14px;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border: none;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
          }

          .back-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
          }

          .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .gallery-toolbar {
            margin-bottom: 14px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .gallery-search {
            flex: 1;
            min-width: 220px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 10px 12px;
            font-size: 14px;
          }

          .gallery-search:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
          }

          .clear-search-btn {
            border: none;
            border-radius: 8px;
            background: #eef0f9;
            color: #374151;
            font-size: 13px;
            font-weight: 600;
            padding: 10px 12px;
            cursor: pointer;
          }

          .view-toggle {
            display: inline-flex;
            border: 1px solid #dbe2ff;
            border-radius: 999px;
            overflow: hidden;
            background: #f7f8ff;
          }

          .view-toggle-link {
            padding: 8px 14px;
            font-size: 12px;
            font-weight: 700;
            color: #4b5563;
            text-decoration: none;
            letter-spacing: 0.2px;
            white-space: nowrap;
          }

          .view-toggle-link.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
          }

          .view-toggle-link:not(.active):hover {
            background: #e9edff;
            color: #374151;
          }

          .pagination {
            margin-top: 16px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
          }

          .pagination.hidden {
            display: none;
          }

          .pagination-meta {
            color: #666;
            font-size: 13px;
          }

          .pagination-actions {
            display: flex;
            gap: 8px;
          }

          .pagination-btn {
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #eef0f9;
            color: #374151;
          }

          .pagination-btn:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          .pagination-btn:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .gallery.empty {
            grid-template-columns: 1fr;
          }

          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
          }

          .empty-state svg {
            width: 80px;
            height: 80px;
            margin-bottom: 20px;
            opacity: 0.5;
          }

          .empty-state h2 {
            color: #666;
            margin-bottom: 10px;
          }

          .empty-state p {
            color: #999;
            margin-bottom: 20px;
          }

          .empty-state a {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s ease;
          }

          .empty-state a:hover {
            transform: translateY(-2px);
          }

          .image-group-card {
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
            border: 1px solid #f0f0f0;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .image-group-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 22px rgba(37, 55, 120, 0.12);
            border-color: #667eea;
          }

          .image-wrapper {
            position: relative;
            width: 100%;
            padding-bottom: 100%;
            overflow: hidden;
            background: #f5f5f5;
            border-radius: 6px;
            transition: box-shadow 0.2s ease, transform 0.2s ease;
          }

          .group-preview-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 8px;
            padding: 10px;
          }

          .group-preview-grid .image-wrapper:first-child {
            grid-row: 1 / span 2;
          }

          .image-wrapper.small {
            padding-bottom: 0;
            min-height: 112px;
          }

          .image-wrapper:hover {
            box-shadow: inset 0 0 0 1px rgba(102, 126, 234, 0.35);
          }

          .image-wrapper.small img {
            position: relative;
            width: 100%;
            height: 100%;
          }

          .image-wrapper.empty {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f1f5;
            border: 1px dashed #cfd2da;
          }

          .slot-label {
            font-size: 11px;
            color: #8a8f99;
            font-weight: 600;
          }

          .image-wrapper img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 8px;
            transition: opacity 0.2s ease;
          }

          .image-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(102, 126, 234, 0);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.3s ease;
            opacity: 0;
            pointer-events: none;
          }

          .image-wrapper:hover .image-overlay {
            background: rgba(102, 126, 234, 0.22);
            opacity: 1;
          }

          .zoom-icon {
            width: 32px;
            height: 32px;
            color: white;
            filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.22));
          }

          .image-group-meta {
            padding: 12px;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .image-name {
            font-size: 13px;
            font-weight: 500;
            color: #333;
            word-break: break-word;
            line-height: 1.3;
          }

          .image-size {
            font-size: 12px;
            color: #999;
          }

          .group-total-size {
            font-size: 13px;
            color: #374151;
            font-weight: 700;
          }

          .group-size-breakdown {
            margin-top: 4px;
            display: grid;
            grid-template-columns: 1fr;
            gap: 4px;
          }

          .group-size-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #6b7280;
            padding: 4px 6px;
            border-radius: 4px;
            background: #f8f9fc;
          }

          .group-size-item strong {
            color: #111827;
            font-size: 11px;
          }

          .compression-chip {
            margin-left: 4px;
            font-style: normal;
            font-weight: 700;
          }

          .compression-lossy {
            color: #15803d;
          }

          .compression-lossless {
            color: #b91c1c;
          }


          .group-actions {
            margin-top: 8px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
          }

          .group-actions-secondary {
            display: flex;
            gap: 6px;
          }

          .group-action-btn {
            border: none;
            border-radius: 6px;
            padding: 8px;
            font-size: 11px;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            line-height: 1.1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
            position: relative;
            min-height: 34px;
            min-width: 34px;
          }

          .group-action-btn:hover {
            transform: translateY(-1px);
          }

          .action-icon {
            width: 14px;
            height: 14px;
            flex-shrink: 0;
          }

          .action-label {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }

          .group-action-btn::after {
            content: attr(data-label);
            position: absolute;
            left: 50%;
            bottom: calc(100% + 6px);
            transform: translate(-50%, 4px);
            background: #111827;
            color: #fff;
            font-size: 10px;
            font-weight: 600;
            line-height: 1;
            padding: 5px 7px;
            border-radius: 5px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.16s ease, transform 0.16s ease;
            z-index: 3;
          }

          .group-action-btn:hover::after,
          .group-action-btn:focus-visible::after {
            opacity: 1;
            transform: translate(-50%, 0);
          }

          .view-group-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            grid-column: 1 / -1;
            text-align: center;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.28);
          }

          .group-actions-secondary .group-action-btn {
            flex: 1;
            min-height: 36px;
          }

          .copy-link-btn {
            background: #e0ecff;
            color: #1f3b8f;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.22);
          }

          .copy-link-btn:hover {
            background: #cfe2ff;
          }

          .zip-btn {
            background: #e8fff0;
            color: #166534;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.2);
          }

          .zip-btn:hover {
            background: #d6fbe6;
          }

          .delete-group-btn {
            background: #d32f2f;
            color: #fff;
            width: 100%;
            box-shadow: 0 2px 8px rgba(211, 47, 47, 0.28);
          }

          .delete-group-btn:hover {
            background: #b71c1c;
          }

          .group-action-btn:focus-visible {
            outline: 2px solid #1d4ed8;
            outline-offset: 1px;
          }

          @media (max-width: 768px) {
            .gallery {
              grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
              gap: 16px;
              padding: 16px;
            }

            .header {
              flex-direction: column;
              align-items: flex-start;
            }

            .back-link {
              width: 100%;
              justify-content: center;
            }
          }

          @media (max-width: 480px) {
            .gallery {
              grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
              gap: 12px;
              padding: 12px;
            }

            .header-content h1 {
              font-size: 22px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <h1>📸 My Gallery (Grouped)</h1>
              <p>User #${folderId}</p>
            </div>
            <a href="/" class="back-link">← Back to App</a>
          </div>

          <div class="gallery-toolbar">
            <div class="view-toggle" role="tablist" aria-label="Gallery view mode">
              <a href="/images/${folderId}/html" class="view-toggle-link" role="tab" aria-selected="false">All Images</a>
              <a href="/images/${folderId}/grouped/html" class="view-toggle-link active" role="tab" aria-selected="true">Grouped</a>
            </div>
            <input id="gallery-search-input" class="gallery-search" type="search" placeholder="Search by image name..." aria-label="Search groups by image name">
            <button id="gallery-search-clear" class="clear-search-btn" type="button">Clear</button>
          </div>

          <div id="gallery-container" class="gallery${groups.length === 0 ? ' empty' : ''}">
            ${emptyState}
          </div>
          <div id="gallery-pagination" class="pagination hidden">
            <div id="gallery-pagination-meta" class="pagination-meta"></div>
            <div class="pagination-actions">
              <button id="gallery-prev-btn" class="pagination-btn" type="button">Previous</button>
              <button id="gallery-next-btn" class="pagination-btn" type="button">Next</button>
            </div>
          </div>
        </div>

        <div id="lightbox" onclick="closeLightbox()">
          <span id="lightbox-close" onclick="closeLightbox()">&times;</span>
          <img id="lightbox-img" src="" alt="" onclick="event.stopPropagation()">
          <div id="lightbox-caption"></div>
          <div class="lightbox-controls">
            <button class="lightbox-btn delete-btn" onclick="deleteImage()">🗑️ Delete</button>
            <button class="lightbox-btn close-btn" onclick="closeLightbox()">Close</button>
          </div>
          <span id="lightbox-filename" style="display:none;"></span>
        </div>

        <style>
          #lightbox {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.92);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 20px;
            animation: fadeIn 0.2s ease;
          }

          #lightbox.open {
            display: flex;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          #lightbox img {
            max-width: 95vw;
            max-height: 70vh;
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          #lightbox-caption {
            color: #eee;
            margin-top: 20px;
            font-size: 14px;
            text-align: center;
            max-width: 90vw;
            word-break: break-word;
          }

          #lightbox-counter {
            color: #c7c7c7;
            margin-top: 8px;
            font-size: 12px;
          }

          #lightbox-close {
            position: absolute;
            top: 20px;
            right: 20px;
            font-size: 40px;
            color: #fff;
            cursor: pointer;
            line-height: 1;
            user-select: none;
            transition: color 0.2s ease;
            background: rgba(0, 0, 0, 0.4);
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }

          #lightbox-close:hover {
            color: #fff;
            background: rgba(0, 0, 0, 0.6);
          }

          .lightbox-controls {
            display: flex;
            gap: 12px;
            margin-top: 20px;
            justify-content: center;
            flex-wrap: wrap;
          }

          .lightbox-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            font-size: 14px;
          }

          .delete-btn {
            background: #d32f2f;
            color: white;
          }

          .delete-btn:hover {
            background: #b71c1c;
            box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
          }

          .close-btn {
            background: #666;
            color: white;
          }

          .close-btn:hover {
            background: #555;
          }
        </style>

        <script>
          const startTime = new Date().getTime();
          const PAGE_SIZE = 9;
          let currentPage = 1;
          let totalPages = 1;
          let currentFilterQuery = '';
          
          function doneLoading(name) {
            let loadTime = new Date().getTime() - startTime;
            console.log("Image [" + name + "] took " + loadTime + "ms to load");
          }

          function getGalleryItems() {
            return Array.from(document.querySelectorAll('[data-page-item="true"]'));
          }

          function renderPagination() {
            const allItems = getGalleryItems();
            const items = allItems.filter(item => {
              const groupName = (item.dataset.groupName || '').toLowerCase();
              const matches = !currentFilterQuery || groupName.includes(currentFilterQuery);
              if (!matches) {
                item.style.display = 'none';
              }
              return matches;
            });
            const paginationContainer = document.getElementById('gallery-pagination');
            const meta = document.getElementById('gallery-pagination-meta');
            const prevBtn = document.getElementById('gallery-prev-btn');
            const nextBtn = document.getElementById('gallery-next-btn');

            if (!paginationContainer || !meta || !prevBtn || !nextBtn) {
              return;
            }

            if (!items.length) {
              paginationContainer.classList.add('hidden');
              if (meta) {
                meta.textContent = 'No groups match your search.';
              }
              allItems.forEach(item => {
                if (item.style.display !== 'none') {
                  item.style.display = '';
                }
              });
              return;
            }

            if (items.length <= PAGE_SIZE) {
              paginationContainer.classList.add('hidden');
              items.forEach(item => {
                item.style.display = '';
              });
              return;
            }

            totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
            if (currentPage > totalPages) {
              currentPage = totalPages;
            }

            const start = (currentPage - 1) * PAGE_SIZE;
            const end = start + PAGE_SIZE;
            items.forEach((item, index) => {
              item.style.display = index >= start && index < end ? '' : 'none';
            });

            meta.textContent = 'Page ' + currentPage + ' of ' + totalPages + ' (' + items.length + ' matching groups)';
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
            paginationContainer.classList.remove('hidden');
          }

          function changePage(nextPage) {
            currentPage = Math.max(1, Math.min(nextPage, totalPages));
            renderPagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }

          function applyGroupSearch(query) {
            currentFilterQuery = String(query || '').trim().toLowerCase();
            currentPage = 1;
            renderPagination();
          }

          function openGroupFromCard(event, card) {
            if (!card) {
              return;
            }

            const target = event && event.target ? event.target : null;
            if (target && typeof target.closest === 'function') {
              if (target.closest('.image-wrapper') || target.closest('.group-actions') || target.closest('a') || target.closest('button')) {
                return;
              }
            }

            const link = card.dataset.groupLink || '';
            if (link) {
              window.location.href = link;
            }
          }

          function openLightboxFromCard(card) {
            if (!card) {
              return;
            }

            openLightbox(card.dataset.imageUrl || '', card.dataset.imageName || '');
          }

          function handleImageCardKeydown(event, card) {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openLightboxFromCard(card);
            }
          }

          function openLightbox(url, name) {
            if (!url) {
              return;
            }
            const lb = document.getElementById('lightbox');
            document.getElementById('lightbox-img').src = url;
            document.getElementById('lightbox-caption').textContent = name;
            document.getElementById('lightbox-filename').textContent = name;
            lb.classList.add('open');
            document.body.style.overflow = 'hidden';
          }

          function closeLightbox() {
            document.getElementById('lightbox').classList.remove('open');
            document.getElementById('lightbox-img').src = '';
            document.body.style.overflow = '';
          }

          async function getUnauthorizedMessage(response) {
            try {
              const parsed = await response.clone().json();
              if (parsed && typeof parsed.message === 'string') {
                return parsed.message;
              }
            } catch {
              return '';
            }
            return '';
          }

          async function redirectIfUnauthorized(response, fallbackMessage) {
            if (response.status !== 401) {
              return false;
            }

            const message = (await getUnauthorizedMessage(response)) || fallbackMessage;
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            const target = '/?tab=login&authMessage=' + encodeURIComponent(message || 'Please sign in to continue.');
            window.location.replace(target);
            return true;
          }

          async function deleteImage() {
            const name = document.getElementById('lightbox-filename').textContent;
            if (!confirm('Delete ' + name + ' and its WebP variants?')) return;
            const encoded = encodeURIComponent(name);
            const token = localStorage.getItem('access_token') || '';
            const response = await fetch('/images/${folderId}/files/' + encoded, {
              method: 'DELETE',
              headers: token ? { Authorization: 'Bearer ' + token } : {}
            });
            if (response.ok) {
              alert('Image deleted successfully');
              location.reload();
            } else {
              if (await redirectIfUnauthorized(response, 'Your session expired. Please sign in again.')) {
                return;
              }
              alert('Failed to delete image');
            }
          }

          async function deleteGroupFromButton(button, event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }

            const groupId = button?.dataset?.groupId || '';
            if (!groupId) {
              return;
            }

            const confirmed = confirm('Delete this whole group (original + WebP variants)?');
            if (!confirmed) {
              return;
            }

            const token = localStorage.getItem('access_token') || '';
            const response = await fetch('/images/${folderId}/groups/' + encodeURIComponent(groupId), {
              method: 'DELETE',
              headers: token ? { Authorization: 'Bearer ' + token } : {}
            });

            if (response.ok) {
              location.reload();
            } else {
              if (await redirectIfUnauthorized(response, 'Your session expired. Please sign in again.')) {
                return;
              }
              alert('Failed to delete image group');
            }
          }

          async function copyGroupLink(button, event) {
            if (event) {
              event.preventDefault();
              event.stopPropagation();
            }

            const relativeLink = button?.dataset?.shareLink || '';
            if (!relativeLink) {
              return;
            }

            const fullLink = new URL(relativeLink, window.location.origin).toString();

            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(fullLink);
              } else {
                const tmp = document.createElement('textarea');
                tmp.value = fullLink;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
              }
              alert('Group link copied.');
            } catch {
              alert('Failed to copy link.');
            }
          }

          document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeLightbox();
          });

          const prevBtn = document.getElementById('gallery-prev-btn');
          const nextBtn = document.getElementById('gallery-next-btn');
          if (prevBtn) {
            prevBtn.addEventListener('click', () => changePage(currentPage - 1));
          }
          if (nextBtn) {
            nextBtn.addEventListener('click', () => changePage(currentPage + 1));
          }

          const searchInput = document.getElementById('gallery-search-input');
          const clearSearchButton = document.getElementById('gallery-search-clear');
          if (searchInput) {
            searchInput.addEventListener('input', event => {
              applyGroupSearch(event.target.value || '');
            });
          }
          if (clearSearchButton) {
            clearSearchButton.addEventListener('click', () => {
              if (searchInput) {
                searchInput.value = '';
              }
              applyGroupSearch('');
            });
          }

          renderPagination();
        </script>
      </body>
      </html>`;
  }

  getImageGroups(folderId: number): any[] {
    const imageService = require('./../services/imageService');
    const service = new imageService();
    return service.getImageGroups(folderId);
  }

  getGroupDetailHtml(folderId: number, group: any, groupAudit?: { uploadedAt?: string; lastViewed?: string | null; downloads?: number; lossyQuality?: number; losslessQuality?: number } | null): string {
    const safeOriginalName = encodeURIComponent(group.original.name);
    const fileUrl = `/images/${folderId}/files/${safeOriginalName}`;
    const escapedFileName = escapeHtml(group.original.name);
    const groupZipUrl = `/images/${folderId}/groups/${encodeURIComponent(group.originalName)}/download`;

    const uploadedAtText = groupAudit?.uploadedAt ? new Date(groupAudit.uploadedAt).toLocaleString() : 'Unknown';
    const lastViewedText = groupAudit?.lastViewed ? new Date(groupAudit.lastViewed).toLocaleString() : 'Not viewed yet';
    const downloadsText = String(groupAudit?.downloads || 0);
    const qualityText = groupAudit?.lossyQuality && groupAudit?.losslessQuality
      ? `Lossy ${groupAudit.lossyQuality} / Lossless ${groupAudit.losslessQuality}`
      : 'Unknown';

    const lossyVariant = group.variants.find((variant: any) => isLossyVariantName(variant.name));
    const losslessVariant = group.variants.find((variant: any) => isLosslessVariantName(variant.name));
    const variantCards = [
      {
        label: 'Lossy',
        variant: lossyVariant,
        emptyText: 'No lossy variant',
        compressionText: lossyVariant ? formatCompressionPercent(group.original.sizeBytes, lossyVariant.sizeBytes) : '',
        compressionClass: 'compression-lossy',
      },
      {
        label: 'Lossless',
        variant: losslessVariant,
        emptyText: 'No lossless variant',
        compressionText: losslessVariant ? formatCompressionPercent(group.original.sizeBytes, losslessVariant.sizeBytes) : '',
        compressionClass: 'compression-lossless',
      },
    ].map(item => {
      if (!item.variant) {
        return `
         <div class="image-set-card empty">
           <div class="image-set-label">${item.label}</div>
           <div class="image-set-preview empty"><span>${item.emptyText}</span></div>
           <div class="image-set-name">Not available</div>
         </div>
      `;
      }

       const safeVariantName = encodeURIComponent(item.variant.name);
       const variantUrl = `/images/${folderId}/files/${safeVariantName}`;
       const escapedVariantName = escapeHtml(item.variant.name);
       return `
         <div class="image-set-card">
           <div class="image-set-label">${item.label}${item.compressionText ? ` <span class="compression-chip ${item.compressionClass}">${item.compressionText}</span>` : ''} <span class="image-set-size-inline">${formatFileSize(item.variant.sizeBytes)}</span></div>
           <div class="image-set-preview" data-preview-url="${escapeHtml(variantUrl)}" data-preview-name="${escapedVariantName}" onclick="openDetailLightbox(this)" onkeydown="handleDetailPreviewKeydown(event, this)" tabindex="0" role="button" aria-label="Preview ${escapedVariantName}">
             <img src="${variantUrl}" alt="${escapedVariantName}">
             <div class="image-set-overlay">Click to preview</div>
           </div>
           <div class="image-set-name">${escapedVariantName}</div>
           <a class="download-btn" href="${variantUrl}" download="${escapedVariantName}">Download</a>
         </div>
       `;
    });

    const imagesHtml = `
      <div class="group-main">
        <h3>${escapedFileName}</h3>
        <p style="color: #999; margin-top: 10px;">Total group size: ${formatFileSize(group.totalSize)}</p>
        <div class="audit-row"><strong>Uploaded:</strong> ${escapeHtml(uploadedAtText)}</div>
        <div class="audit-row"><strong>Last viewed:</strong> ${escapeHtml(lastViewedText)}</div>
        <div class="audit-row"><strong>Downloads:</strong> ${escapeHtml(downloadsText)}</div>
        <div class="audit-row"><strong>Quality:</strong> ${escapeHtml(qualityText)}</div>
        <a class="download-btn secondary" href="${groupZipUrl}">Download full group ZIP</a>
      </div>

      <div class="image-set-section">
        <h4>Image Set (Original + Variants)</h4>
        <div class="image-set-grid">
           <div class="image-set-card">
             <div class="image-set-label">Original <span class="image-set-size-inline">${formatFileSize(group.original.sizeBytes)}</span></div>
             <div class="image-set-preview" data-preview-url="${escapeHtml(fileUrl)}" data-preview-name="${escapedFileName}" onclick="openDetailLightbox(this)" onkeydown="handleDetailPreviewKeydown(event, this)" tabindex="0" role="button" aria-label="Preview ${escapedFileName}">
               <img src="${fileUrl}" alt="${escapedFileName}">
               <div class="image-set-overlay">Click to preview</div>
             </div>
             <div class="image-set-name">${escapedFileName}</div>
             <a class="download-btn" href="${fileUrl}" download="${escapedFileName}">Download</a>
           </div>
          ${variantCards.join('')}
        </div>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapedFileName}</title>
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
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }

          .header h1 {
            font-size: 28px;
            color: #333;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: transform 0.2s ease;
          }

          .back-link:hover {
            transform: translateY(-2px);
          }

          .group-main {
            margin-bottom: 40px;
          }

          .group-main h3 {
            font-size: 24px;
            color: #333;
            margin-top: 20px;
          }

          .audit-row {
            margin-top: 8px;
            color: #4b5563;
            font-size: 13px;
          }

          .image-set-section {
            margin-top: 34px;
          }

          .image-set-section h4 {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }

          .image-set-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }

          .image-set-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            border: 1px solid #e9edf6;
            display: flex;
            flex-direction: column;
          }

          .image-set-card.empty {
            opacity: 0.75;
          }

          .image-set-label {
            font-size: 12px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 10px;
          }

          .compression-chip {
            margin-left: 4px;
            font-style: normal;
            font-weight: 700;
          }

          .compression-lossy {
            color: #15803d;
          }

          .compression-lossless {
            color: #b91c1c;
          }

          .image-set-preview {
            width: 100%;
            min-height: 240px;
            background: #f2f3f8;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            cursor: zoom-in;
          }

          .image-set-preview img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 6px;
          }

          .image-set-preview.empty {
            border: 1px dashed #cdd3e1;
            background: #f8faff;
            color: #6b7280;
            font-size: 13px;
            font-weight: 600;
            cursor: default;
          }

          .image-set-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(17, 24, 39, 0.1);
            color: #fff;
            opacity: 0;
            transition: opacity 0.2s ease;
            font-size: 12px;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          }

          .image-set-preview:hover .image-set-overlay,
          .image-set-preview:focus .image-set-overlay {
            opacity: 1;
          }

          .image-set-name {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
            word-break: break-word;
          }

           .image-set-size {
             font-size: 12px;
             color: #999;
           }

           .image-set-size-inline {
             margin-left: 8px;
             font-size: 12px;
             color: #999;
             font-weight: 400;
           }

           .download-btn {
            display: inline-block;
            margin-top: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            transition: transform 0.2s ease;
          }

          .download-btn:hover {
            transform: translateY(-2px);
          }

          .download-btn.secondary {
            margin-left: 8px;
            background: #eef0f9;
            color: #2f3a5f;
          }

          #detail-lightbox {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.92);
            z-index: 9999;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 24px;
          }

          #detail-lightbox.open {
            display: flex;
          }

          #detail-lightbox img {
            max-width: 94vw;
            max-height: 76vh;
            object-fit: contain;
            border-radius: 10px;
            background: #111827;
          }

          #detail-lightbox-caption {
            margin-top: 14px;
            color: #e5e7eb;
            font-size: 13px;
            text-align: center;
            word-break: break-word;
          }

          #detail-lightbox-close {
            position: absolute;
            top: 14px;
            right: 16px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            font-size: 26px;
            cursor: pointer;
          }

          @media (max-width: 600px) {
            .container {
              padding: 20px;
            }

            .header {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }

            .header h1 {
              font-size: 20px;
            }

            .back-link {
              width: 100%;
              justify-content: center;
            }

            .image-set-grid {
              grid-template-columns: 1fr;
            }

            .image-set-preview {
              min-height: 220px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Image Details</h1>
            <a href="/images/${folderId}/grouped/html" class="back-link">← Back to Gallery</a>
          </div>

          ${imagesHtml}
        </div>
        <div id="detail-lightbox" onclick="closeDetailLightbox()">
          <button id="detail-lightbox-close" onclick="closeDetailLightbox()" aria-label="Close preview">&times;</button>
          <img id="detail-lightbox-image" src="" alt="" onclick="event.stopPropagation()">
          <div id="detail-lightbox-caption"></div>
        </div>
        <script>
          function openDetailLightbox(preview) {
            if (!preview || preview.classList.contains('empty')) {
              return;
            }

            const url = preview.dataset.previewUrl || '';
            const name = preview.dataset.previewName || '';
            if (!url) {
              return;
            }

            const modal = document.getElementById('detail-lightbox');
            document.getElementById('detail-lightbox-image').src = url;
            document.getElementById('detail-lightbox-image').alt = name;
            document.getElementById('detail-lightbox-caption').textContent = name;
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
          }

          function closeDetailLightbox() {
            const modal = document.getElementById('detail-lightbox');
            modal.classList.remove('open');
            document.getElementById('detail-lightbox-image').src = '';
            document.body.style.overflow = '';
          }

          function handleDetailPreviewKeydown(event, preview) {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openDetailLightbox(preview);
            }
          }

          document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
              closeDetailLightbox();
            }
          });
        </script>
      </body>
      </html>
    `;
  }
}

function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  const sizeKb = sizeBytes / 1024;
  if (sizeKb < 1024) {
    return `${sizeKb.toFixed(1)} KB`;
  }

  return `${(sizeKb / 1024).toFixed(2)} MB`;
}

function formatCompressionPercent(originalBytes: number, variantBytes: number): string {
  if (originalBytes <= 0) {
    return '0%';
  }

  const percent = Math.round(((originalBytes - variantBytes) / originalBytes) * 100);
  return `${percent}%`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isLossyVariantName(fileName: string): boolean {
  return /lossy/i.test(fileName) && !/lossless/i.test(fileName);
}

function isLosslessVariantName(fileName: string): boolean {
  return /lossless/i.test(fileName);
}

export = Image;
