import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import express, { Request, Response } from 'express';

import Image = require('../src/controller/image');
import ImageAuditService = require('../src/services/imageAuditService');

type AuthenticatedRequest = Request & { userId: number };

const router = express.Router();
const image = new Image();
const imageAuditService = new ImageAuditService();

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
router.get('/:id/files/:name', async function(req: Request, res: Response) {
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

  try {
    await fs.access(fullPath);
    imageAuditService.incrementDownloads(folderId, decodedName);
    return res.sendFile(fullPath);
  } catch {
    return res.status(404).json({ error: true, message: 'Non existing file!' });
  }
});

/* DELETE image file and its variants from selected folder */
router.delete('/:id/files/:name', async function(req: Request, res: Response) {
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

  try {
    await fs.access(fullPath);
  } catch {
    return res.status(404).json({ error: true, message: 'File not found!' });
  }

  try {
    const baseName = path.parse(decodedName).name;
    const filesInFolder = await fs.readdir(folderPath);
    const variantPattern = new RegExp(`^(?:\\d+-(?:lossy|lossless)_${escapeRegExp(baseName)}|${escapeRegExp(baseName)}_\\d+-(?:lossy|lossless))\\.webp$`);
    const toDelete = [
      fullPath,
      ...filesInFolder.filter(file => variantPattern.test(file)).map(file => path.join(folderPath, file)),
    ];

    await Promise.all(
      toDelete.map(filePath =>
        fs.unlink(filePath).catch(() => {
          // File might not exist, that's ok
        })
      )
    );

    return res.json({ success: true, message: 'File deleted.' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: true, message: 'Failed to delete file.' });
  }
});

/* DELETE whole image group (original + variants) */
router.delete('/:id/groups/:groupId', async function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  let groupId = '';
  try {
    groupId = decodeURIComponent(String(req.params.groupId || '')).trim();
  } catch {
    return res.status(400).json({ error: true, message: 'Invalid group id!' });
  }

  if (!groupId) {
    return res.status(400).json({ error: true, message: 'Invalid group id!' });
  }

  const folderPath = path.join(process.env.UPLOADS_FOLDER!, String(folderId));

  try {
    const filesInFolder = await fs.readdir(folderPath);
    const escapedGroupId = escapeRegExp(groupId);
    const groupPattern = new RegExp(`^(?:${escapedGroupId}\\.[^/\\\\]+|\\d+-(?:lossy|lossless)_${escapedGroupId}\\.webp|${escapedGroupId}_\\d+-(?:lossy|lossless)\\.webp)$`);
    const toDelete = filesInFolder
      .filter(file => groupPattern.test(file))
      .map(file => path.join(folderPath, file));

    if (toDelete.length === 0) {
      return res.status(404).json({ error: true, message: 'Image group not found!' });
    }

    await Promise.all(
      toDelete.map(filePath =>
        fs.unlink(filePath).catch(() => {
          // File might already be gone, continue cleanup.
        })
      )
    );

    return res.json({ success: true, message: `Deleted ${toDelete.length} file(s).` });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: true, message: 'Failed to delete image group.' });
  }
});

/* GET whole image group as ZIP (original + variants) */
router.get('/:id/groups/:groupId/download', async function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  let groupId = '';
  try {
    groupId = decodeURIComponent(String(req.params.groupId || '')).trim();
  } catch {
    return res.status(400).json({ error: true, message: 'Invalid group id!' });
  }

  if (!groupId) {
    return res.status(400).json({ error: true, message: 'Invalid group id!' });
  }

  const folderPath = path.join(process.env.UPLOADS_FOLDER!, String(folderId));

  try {
    const filesInFolder = await fs.readdir(folderPath);
    const escapedGroupId = escapeRegExp(groupId);
    const groupPattern = new RegExp(`^(?:${escapedGroupId}\\.[^/\\\\]+|\\d+-(?:lossy|lossless)_${escapedGroupId}\\.webp|${escapedGroupId}_\\d+-(?:lossy|lossless)\\.webp)$`);
    const groupFiles = filesInFolder
      .filter(file => groupPattern.test(file))
      .map(file => path.join(folderPath, file));

    if (groupFiles.length === 0) {
      return res.status(404).json({ error: true, message: 'Image group not found!' });
    }

    const safeArchiveName = `${groupId.replace(/[^a-zA-Z0-9._-]/g, '_') || 'group'}.zip`;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeArchiveName}"`);

    const zipProcess = spawn('zip', ['-j', '-q', '-', ...groupFiles], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    zipProcess.on('error', () => {
      if (!res.headersSent) {
        res.status(500).json({ error: true, message: 'Failed to create archive.' });
      }
    });

    zipProcess.stdout.pipe(res);
    zipProcess.on('close', code => {
      if (code !== 0 && !res.headersSent) {
        res.status(500).json({ error: true, message: 'Failed to create archive.' });
      }
    });

    return null;
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: true, message: 'Failed to create archive.' });
  }
});

/* GET uploaded images of selected folder in HTML format (GROUPED) */
router.get('/:id/grouped/html', function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  try {
    return res.type("html").send(image.getGroupedGalleryHtml(folderId));
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: true, message: `Couldn't load folder ${folderId} images (grouped HTML).`});
  }
});

/* GET single image group by original file name */
router.get('/:id/groups/:groupId/html', function(req: Request, res: Response) {
  const folderId = validateRequestedFolder(req as AuthenticatedRequest, res);
  if (!folderId) {
    return null;
  }

  try {
    const groupId = decodeURIComponent(String(req.params.groupId));
    const groups = image.getImageGroups(folderId);
    const group = groups.find(g => g.originalName === groupId);

    if (!group || !group.original) {
      return res.status(404).json({ error: true, message: 'Image group not found!' });
    }

    imageAuditService.recordView(folderId, group.originalName);
    const groupAudit = imageAuditService.getGroupAudit(folderId, group.originalName);

    // Generate HTML for this specific group
    const html = image.getGroupDetailHtml(folderId, group, groupAudit);
    return res.type("html").send(html);
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: true, message: 'Failed to load image group.' });
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

  if (!fsSync.existsSync(`${process.env.UPLOADS_FOLDER!}/${folderId}`)) {
    res.status(404).json({ error: true, message: "Non existing folder!"});
    return null;
  }

  return folderId;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
