const FileHelperSync = require("./../utils/fileHelperSync");

module.exports = class Image {
  getImageDirectories() {
    const links = FileHelperSync.getDirectories(process.env.UPLOADS_FOLDER).map(dir => {
       return `<li><h3>${dir} - <a href=images/${dir}/html?auth=${dir}>HTML</a> / <a href=images/${dir}/json?auth=${dir}>JSON</a></<br></h3></li>`;
    });
    const isEmpty = links.length ? `:` : ` is empty. Upload some images on <a href="/uploads">/uploads</a>.`;

    return `
      <!DOCTYPE html>
      <html><body>
        <h1>Path: /images?auth=1</h1>
        <h2><a href="/">HOME</a></h2>
        <h2>List of directories${isEmpty}</h2>
          <ul>${links.join("")}</ul>
      </body></html>
     `;
  }

  getDirectoryHtml(folderId) {
    let imagesHtml = "";
    FileHelperSync.getFiles(`${process.env.UPLOADS_FOLDER}/${folderId}`).forEach(file => {
      imagesHtml += `<img src="../../${folderId}/${file}" alt="${file}" title="${file}" onload="doneLoading('${file}')">`;
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
        <h1>Path: /images/${folderId}/html?auth=${folderId}</h1>
        <h2><a href="/">HOME</a></h2><br>
          ${imagesHtml}
      </body></html>`;
  }

  getDirectoryJson(folderId) {
    return {
      images: FileHelperSync.getFiles(`${process.env.UPLOADS_FOLDER}/${folderId}`)
    };
  }
};
