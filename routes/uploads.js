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
  res.type('.html').send(await upload.uploadPhoto(req, res).catch(e => e));
});

module.exports = router;
