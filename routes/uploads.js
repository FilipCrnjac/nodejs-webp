const express = require('express');
const router = express.Router();
const Auth = require('./../src/auth/auth');
const Upload = require("./../src/controller/upload");
const upload = new Upload();

/* GET uploads index page. */
router.get('/', function(req, res, next) {
  res.type('.html').send(upload.getUploadsPage());
});

router.post('/', Auth.isAuthenticated, async (req, res) => {
  try {
    res.type('.html').send(await upload.uploadPhoto(req, res));
  } catch (e) {
    const status = e && e.status ? e.status : 500;
    res.status(status).type('.html').send(e.message || 'Saving image failed. Please try again.');
  }
});

module.exports = router;
