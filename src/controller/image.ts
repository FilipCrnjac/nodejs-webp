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
      imagesHtml += `
        <figure class="image-card">
          <img src="/images/${folderId}/files/${safeFile}" alt="${file.name}" title="${file.name}" onload="doneLoading('${file.name}')">
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
        </script>
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
