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
      imagesHtml += `
        <figure class="image-card">
          <img src="${fileUrl}" alt="${file.name}" onload="doneLoading('${file.name}')" onclick="openLightbox('${fileUrl}', '${file.name.replace(/'/g, "\\'")}')" title="Click to enlarge">
          <figcaption class="image-meta">${file.name}<br>${formatFileSize(file.sizeBytes)}</figcaption>
        </figure>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Directories</title>
        <style>
          .gallery {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }
          .image-card {
            margin: 0;
            border: 1px solid #ddd;
            padding: 8px;
            border-radius: 6px;
            background: #fff;
          }
          .image-card img {
            width: 100%;
            height: min(28vw, 260px);
            min-height: 170px;
            object-fit: contain;
            display: block;
            background: #f5f5f5;
            cursor: zoom-in;
            transition: opacity 0.15s;
          }
          .image-card img:hover { opacity: 0.85; }
          /* Lightbox */
          #lightbox {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.88);
            z-index: 999;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          #lightbox.open { display: flex; }
          #lightbox img {
            max-width: 92vw;
            max-height: 82vh;
            object-fit: contain;
            border-radius: 4px;
            box-shadow: 0 4px 32px rgba(0,0,0,0.6);
          }
          #lightbox-caption {
            color: #eee;
            margin-top: 12px;
            font-size: 14px;
            text-align: center;
          }
          #lightbox-close {
            position: absolute;
            top: 16px;
            right: 24px;
            font-size: 36px;
            color: #fff;
            cursor: pointer;
            line-height: 1;
            user-select: none;
          }
          .image-meta {
            margin-top: 8px;
            font-size: 13px;
            color: #333;
            line-height: 1.4;
            word-break: break-word;
          }
          @media (max-width: 1100px) {
            .gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (max-width: 700px) {
            .gallery { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <script>
          const startTime = new Date().getTime();
          function doneLoading(name) {
            let loadTime = new Date().getTime() - startTime;
            console.log("Image ["+ name + "] took " + loadTime + "ms to load");
          }
          function openLightbox(url, name) {
            const lb = document.getElementById('lightbox');
            document.getElementById('lightbox-img').src = url;
            document.getElementById('lightbox-caption').textContent = name;
            document.getElementById('lightbox-filename').textContent = name;
            lb.classList.add('open');
          }
          function closeLightbox() {
            document.getElementById('lightbox').classList.remove('open');
            document.getElementById('lightbox-img').src = '';
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
              alert('Deleted');
              location.reload();
            } else {
              alert('Delete failed');
            }
          }
          document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
        </script>
        <div id="lightbox" onclick="closeLightbox()">
          <span id="lightbox-close" onclick="closeLightbox()">&times;</span>
          <img id="lightbox-img" src="" alt="" onclick="event.stopPropagation()">
          <div id="lightbox-caption"></div>
          <div style="margin-top: 10px;">
            <button onclick="deleteImage()" style="padding: 8px 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
          </div>
          <span id="lightbox-filename" style="display:none;"></span>
        </div>
        <h1>Path: /images/${folderId}/html</h1>
        <h2><a href="/">HOME</a></h2><br>
        <div class="gallery">${imagesHtml}</div>
      </body></html>`;
  }

  getDirectoryJson(folderId: number): { images: string[] } {
    return {
      images: imageService.getDirectoryFiles(folderId)
    };
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

export = Image;
