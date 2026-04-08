const express = require('express');
const router = express.Router();
const fs = require('fs');
const Image = require("../src/controller/image");
const image = new Image();

/* GET uploaded images folders list in HTML */
router.get('/', function(req, res, next) {
  const response = image.getImageDirectories();

  return res.type("html").send(response);
});

/* GET uploaded images of selected folder in HTML format */
router.get('/:id/html', async function(req, res, next) {
  const folderId = validateRequestedFolder(req, res);
  if (!folderId) {
    return null;
  }

  try {
    return res.type("html").send(await image.getDirectoryHtml(folderId));
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: true, message: `Couldn't load folder ${folderId} images (HTML).`});
  }
});

/* GET uploads images in JSON format */
router.get('/:id/json', async function(req, res, next) {
  const folderId = validateRequestedFolder(req, res);
  if (!folderId) {
    return null;
  }

  try {
    return res.json(await image.getDirectoryJson(folderId));
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: true, message: `Couldn't load folder ${folderId} images (JSON).`});
  }
});

module.exports = router;

function validateRequestedFolder(req, res) {
  const folderId = parseInt(req.params.id, 10);
  if (!folderId) {
    res.status(400).json({ error: true, message: "Invalid folder id!"});
    return null;
  }

  if (folderId !== req.userId) {
    res.status(403).json({ error: true, message: "Forbidden!"});
    return null;
  }

  if (!fs.existsSync(`${process.env.UPLOADS_FOLDER}/${folderId}`)) {
    res.status(404).json({ error: true, message: "Non existing folder!"});
    return null;
  }

  return folderId;
}

