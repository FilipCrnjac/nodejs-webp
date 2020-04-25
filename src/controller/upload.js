const path = require('path');
const multer = require('multer');
const Webp = require("./../../src/utils/webp");
const FileHelperSync = require("./../utils/fileHelperSync");

const supportedImageFormats = ["image/png", "image/jpeg"];
const quality = 75;

module.exports = class Upload {
  getUploadsPage() {
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

  uploadPhoto(req, res) {
    return new Promise((resolve, reject) => {
      const userId = req.userId;

      // create folder if doesn't exists
      FileHelperSync.createDirectory(`${process.env.UPLOADS_FOLDER}/${userId}`)

      // multer configuration about destination and filename
      const storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, `${process.env.UPLOADS_FOLDER}/${userId}`)
        },
        filename: function (req, file, cb) {
          const parsedFile = path.parse(file.originalname);
          cb(null, parsedFile.name + '-' + Date.now() + parsedFile.ext)
          // or form's input name
          // cb(null, file.fieldname + '-' + Date.now() + parsedFile.ext)
        }
      });

      const multerUpload = multer({ storage }).single('myImage');
      multerUpload(req, res, async function (err) {
        if (err) {
          console.log(err);
          return reject('Saving image failed. Please try again.')
        }
        if (!req.file) {
          console.log(err);
          return reject('Saving image failed. Please double check selected image.')
        }
        if (!supportedImageFormats.includes(req.file.mimetype)) {
          console.log(err);
          return reject('Invalid image format. Please double check selected image format.')
        }

        const startTimeConversion = process.hrtime()
        /*
        await runConversionSynchronous(req, quality);
        logExecutionTime(startTimeConversion, "Synchronous conversion")
        */
        await runConvertConcurrently(req, quality);
        logExecutionTime(startTimeConversion, "Concurrent conversion")

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
      });
    })
  }
};

async function convertToMultipleQualities(req) {
  const qualities = [50, 75, 100];

  return Promise.all(qualities.map(q => runConvertConcurrently(req, q)));
}

async function runConversionSynchronous(req, quality) {
  await Webp.convertLossy(req.file.path, req.file.destination, quality);
  await Webp.convertLossless(req.file.path, req.file.destination, quality);

  return true;
}

function runConvertConcurrently(req, quality) {
  return Promise.all([
    Webp.convertLossy(req.file.path, req.file.destination, quality),
    Webp.convertLossless(req.file.path, req.file.destination, quality)
  ]);
}

function logExecutionTime(start, message) {
  const end = process.hrtime(start);
  console.info(`${message} execution time: ${end[0]}s ${(end[1] / 1000000).toFixed(2)}ms`);
}
