import fs from 'fs';
import path from 'path';

import express, { Request, Response } from 'express';

import Image = require('../src/controller/image');

type AuthenticatedRequest = Request & { userId: number };

const router = express.Router();
const image = new Image();

/* GET uploaded images folders list in HTML */
router.get('/', function(req: Request, res: Response) {
  const response = image.getImageDirectories();

  return res.type("html").send(response);
});

/* GET uploaded images of selected folder in HTML format */
router.get('/:id/html', function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  try {
    return res.type("html").send(image.getDirectoryHtml(folderId));
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: true, message: `Couldn't load folder ${folderId} images (HTML).`});
  }
});

/* GET uploads images in JSON format */
router.get('/:id/json', function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  try {
    return res.json(image.getDirectoryJson(folderId));
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: true, message: `Couldn't load folder ${folderId} images (JSON).`});
  }
});

/* GET single image file from selected folder (authorized user only) */
router.get('/:id/files/:name', function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  const fileName = path.basename(String(req.params.name));
  let decodedName = '';
  try {
    decodedName = decodeURIComponent(fileName);
  } catch (e) {
    return res.status(400).json({ error: true, message: 'Invalid file name!' });
  }

  if (!decodedName) {
    return res.status(400).json({ error: true, message: 'Invalid file name!' });
  }

  const fullPath = path.join(process.env.UPLOADS_FOLDER!, `${folderId}`, decodedName);
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: true, message: 'Non existing file!' });
  }

  return res.sendFile(fullPath);
});

/* DELETE image file and its variants from selected folder */
router.delete('/:id/files/:name', function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  const fileName = path.basename(String(req.params.name));
  let decodedName = '';
  try {
    decodedName = decodeURIComponent(fileName);
  } catch (e) {
    return res.status(400).json({ error: true, message: 'Invalid file name!' });
  }

  const fullPath = path.join(process.env.UPLOADS_FOLDER!, String(folderId), decodedName);
  const folderPath = path.dirname(fullPath);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: true, message: 'File not found!' });
  }

  try {
    const baseName = path.parse(decodedName).name;
    const toDelete = [
      fullPath,
      path.join(folderPath, `${baseName}_75-lossy.webp`),
      path.join(folderPath, `${baseName}_75-lossless.webp`),
    ];

    toDelete.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    return res.json({ success: true, message: 'File deleted.' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: true, message: 'Failed to delete file.' });
  }
});

export = router;

function validateRequestedFolder(req: AuthenticatedRequest, res: Response): number | null {
  const folderId = parseInt(String(req.params.id), 10);
  if (!folderId) {
    res.status(400).json({ error: true, message: "Invalid folder id!"});
    return null;
  }

  if (folderId !== req.userId) {
    res.status(403).json({ error: true, message: "Forbidden!"});
    return null;
  }

  if (!fs.existsSync(`${process.env.UPLOADS_FOLDER!}/${folderId}`)) {
    res.status(404).json({ error: true, message: "Non existing folder!"});
    return null;
  }

  return folderId;
}

