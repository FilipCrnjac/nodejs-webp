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
    let imagesHtml = "";
    imageService.getDirectoryFiles(folderId).forEach(file => {
      const safeFile = encodeURIComponent(file);
      imagesHtml += `<img src="/images/${folderId}/files/${safeFile}" alt="${file}" title="${file}" onload="doneLoading('${file}')">`;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Directories</title></head>
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
          ${imagesHtml}
      </body></html>`;
  }

  getDirectoryJson(folderId: number): { images: string[] } {
    return {
      images: imageService.getDirectoryFiles(folderId)
    };
  }
}

export = Image;
