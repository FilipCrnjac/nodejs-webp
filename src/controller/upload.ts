import { Request, Response } from 'express';

import UploadService = require('./../services/uploadService');

type AuthenticatedUploadRequest = Request & { userId: number };

const uploadService = new UploadService();

class Upload {
  getUploadsPage(): string {
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
        async function submitUploadPhotoForm(event){
          event.preventDefault();
          const token = document.getElementsByName("token")[0].value.trim();

          const uploadPhotoForm = document.getElementById('uploadPhotoForm');
          const formData = new FormData(uploadPhotoForm);
          const headers = {};
          if (token) {
            headers.Authorization = 'Bearer ' + token;
          }

          const response = await fetch('/uploads', {
            method: 'POST',
            headers,
            body: formData
          });
          const body = await response.text();
          document.open();
          document.write(body);
          document.close();
        }

        window.addEventListener('DOMContentLoaded', () => {
          const savedToken = localStorage.getItem('access_token') || '';
          const tokenInput = document.getElementsByName("token")[0];
          tokenInput.value = savedToken;
        });
      </script>
        <h1>Path: /uploads</h1>
        <h2><a href="/">HOME</a></h2><br>
        <div>
        <form id = "uploadPhotoForm" action="" enctype="multipart/form-data" method="POST" onsubmit="submitUploadPhotoForm(event)"> 
          <label for="token" class="pad">Bearer Token</label><br>
          <input type="text" name="token" class="pad" placeholder="optional when logged in via /login" style="width: 100%"><br>
          <input type="file" name="myImage" class="pad" accept="image/*" /><br>
          <input type="submit" class="pad" value="Upload Photo"/>
        </form>
        </div>
      </body>
      </html>
  `;
  }

  uploadPhoto(req: AuthenticatedUploadRequest, res: Response): Promise<string> {
    return uploadService.uploadPhoto(req, res);
  }
}

export = Upload;

