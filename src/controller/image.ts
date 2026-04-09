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
        <figure class="image-card">
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

          .gallery {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 20px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
          let currentGroupImages = [];
          let currentGroupIndex = 0;
          
          function doneLoading(name) {
            let loadTime = new Date().getTime() - startTime;
            console.log("Image [" + name + "] took " + loadTime + "ms to load");
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

      const variantOne = group.variants[0];
      const variantTwo = group.variants[1];

      const variantOneUrl = variantOne ? `/images/${folderId}/files/${encodeURIComponent(variantOne.name)}` : '';
      const variantTwoUrl = variantTwo ? `/images/${folderId}/files/${encodeURIComponent(variantTwo.name)}` : '';
      const groupImageSet = [
        { url: fileUrl, name: group.original.name },
        ...(variantOne ? [{ url: variantOneUrl, name: variantOne.name }] : []),
        ...(variantTwo ? [{ url: variantTwoUrl, name: variantTwo.name }] : []),
      ];
      const encodedGroupImageSet = escapeHtml(JSON.stringify(groupImageSet));

      groupsHtml += `
        <div class="image-group-card">
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
            <div class="image-wrapper small ${variantOne ? '' : 'empty'}" ${variantOne ? `data-image-url="${escapeHtml(variantOneUrl)}" data-image-name="${escapeHtml(variantOne.name)}" data-group-images="${encodedGroupImageSet}" data-group-index="1" onclick="openLightboxFromCard(this)" onkeydown="handleImageCardKeydown(event, this)" role="button" tabindex="0" aria-label="Open ${escapeHtml(variantOne.name)}"` : ''}>
              ${variantOne ? `<img src="${variantOneUrl}" alt="${escapeHtml(variantOne.name)}" onload="doneLoading(${JSON.stringify(variantOne.name)})" title="Variant 1">` : `<span class="slot-label">No variant</span>`}
            </div>
            <div class="image-wrapper small ${variantTwo ? '' : 'empty'}" ${variantTwo ? `data-image-url="${escapeHtml(variantTwoUrl)}" data-image-name="${escapeHtml(variantTwo.name)}" data-group-images="${encodedGroupImageSet}" data-group-index="2" onclick="openLightboxFromCard(this)" onkeydown="handleImageCardKeydown(event, this)" role="button" tabindex="0" aria-label="Open ${escapeHtml(variantTwo.name)}"` : ''}>
              ${variantTwo ? `<img src="${variantTwoUrl}" alt="${escapeHtml(variantTwo.name)}" onload="doneLoading(${JSON.stringify(variantTwo.name)})" title="Variant 2">` : `<span class="slot-label">No variant</span>`}
            </div>
          </div>
          <div class="image-group-meta">
            <div class="image-name">${escapedFileName}</div>
            <div class="image-size">${formatFileSize(group.totalSize)}</div>
            <div class="image-variants">${group.variants.length} variant${group.variants.length !== 1 ? 's' : ''}</div>
            <a href="${shareLink}" class="share-link" title="Share this group">🔗 Share</a>
            <button class="delete-group-btn" data-group-id="${escapeHtml(group.originalName)}" onclick="deleteGroupFromButton(this, event)">🗑️ Delete group</button>
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
            transition: all 0.3s ease;
            border: 1px solid #f0f0f0;
            display: flex;
            flex-direction: column;
            height: 100%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }

          .image-group-card:hover {
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

          .image-group-card:hover .image-overlay {
            background: rgba(102, 126, 234, 0.4);
            opacity: 1;
          }

          .zoom-icon {
            width: 40px;
            height: 40px;
            color: white;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
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

          .image-variants {
            font-size: 11px;
            color: #aaa;
            margin-top: 4px;
          }

          .share-link {
            display: inline-block;
            margin-top: 8px;
            padding: 6px 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-align: center;
            transition: transform 0.2s ease;
          }

          .share-link:hover {
            transform: scale(1.05);
          }

          .delete-group-btn {
            margin-top: 8px;
            padding: 8px 10px;
            border: none;
            border-radius: 4px;
            background: #d32f2f;
            color: white;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s ease;
          }

          .delete-group-btn:hover {
            background: #b71c1c;
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

          <div id="gallery-container" class="gallery${groups.length === 0 ? ' empty' : ''}">
            ${emptyState}
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
          
          function doneLoading(name) {
            let loadTime = new Date().getTime() - startTime;
            console.log("Image [" + name + "] took " + loadTime + "ms to load");
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
              alert('Failed to delete image group');
            }
          }

          document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeLightbox();
          });
        </script>
      </body>
      </html>`;
  }

  getImageGroups(folderId: number): any[] {
    const imageService = require('./../services/imageService');
    const service = new imageService();
    return service.getImageGroups(folderId);
  }

  getGroupDetailHtml(folderId: number, group: any): string {
    const safeOriginalName = encodeURIComponent(group.original.name);
    const fileUrl = `/images/${folderId}/files/${safeOriginalName}`;
    const escapedFileName = escapeHtml(group.original.name);

    let imagesHtml = `
      <div class="group-main">
        <div class="image-wrapper" style="position: relative; width: 100%; padding-bottom: 100%; margin-bottom: 20px; background:#f5f5f5; border-radius: 10px; overflow: hidden;">
          <img src="${fileUrl}" alt="${escapedFileName}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: contain; padding: 8px;">
        </div>
        <h3>${escapedFileName}</h3>
        <p style="color: #999; margin-top: 10px;">Original image • ${formatFileSize(group.original.sizeBytes)}</p>
        <p style="color: #999; margin-top: 4px;">Total group size: ${formatFileSize(group.totalSize)}</p>
      </div>
    `;

    if (group.variants.length > 0) {
      imagesHtml += `<div class="variants-section"><h4>Generated WebP Variants (${group.variants.length})</h4><div class="variants-grid">`;
      group.variants.forEach((variant: any) => {
        const safeVariantName = encodeURIComponent(variant.name);
        const variantUrl = `/images/${folderId}/files/${safeVariantName}`;
        imagesHtml += `
          <div class="variant-card">
            <div class="variant-preview">
              <img src="${variantUrl}" alt="${escapeHtml(variant.name)}">
            </div>
            <div class="variant-name">${escapeHtml(variant.name)}</div>
            <div class="variant-size">${formatFileSize(variant.sizeBytes)}</div>
          </div>
        `;
      });
      imagesHtml += '</div></div>';
    }

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

          .variants-section {
            margin-top: 40px;
          }

          .variants-section h4 {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
          }

          .variant-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 4px solid #667eea;
          }

          .variants-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
          }

          .variant-preview {
            width: 100%;
            padding-bottom: 100%;
            position: relative;
            background: #f2f3f8;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 10px;
          }

          .variant-preview img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 6px;
          }

          .variant-name {
            font-size: 12px;
            color: #666;
            margin-bottom: 6px;
            word-break: break-word;
          }

          .variant-size {
            font-size: 12px;
            color: #999;
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export = Image;
