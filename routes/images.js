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
  const folderId = parseInt(req.params.id, 10);
  if (!folderId) {
    return res.json({ error: true, message: "Invalid folder id!"});
  }

  if (folderId !== req.userId) {
    return res.json({ error: true, message: "Forbidden!"});
  }

  if (!fs.existsSync(`${process.env.UPLOADS_FOLDER}/${folderId}`)) {
    return res.json({ error: true, message: "Non existing folder!"});
  }

  try {
    return res.type("html").send(await image.getDirectoryHtml(folderId));
  } catch (e) {
    console.log(e);
    return res.json({ error: true, message: `Couldn't load folder ${folderId} images (HTML).`});
  }
});

/* GET uploads images in JSON format */
router.get('/:id/json', async function(req, res, next) {
  const folderId = parseInt(req.params.id, 10);
  if (!folderId) {
    return res.json({ error: true, message: "Invalid folder id!"})
  }

  if (folderId !== req.userId) {
    return res.json({ error: true, message: "Forbidden!"});
  }

  if (!fs.existsSync(`${process.env.UPLOADS_FOLDER}/${folderId}`)) {
    return res.json({ error: true, message: "Non existing folder!"});
  }

  try {
    return res.json(await image.getDirectoryJson(folderId));
  } catch (e) {
    console.log(e);
    return res.json({ error: true, message: `Couldn't load folder ${folderId} images (JSON).`});
  }
});

module.exports = router;
