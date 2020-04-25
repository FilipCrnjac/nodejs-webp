const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  const html = `
    <!DOCTYPE html>
    <html><body>
    <h1>Path: /</h1>
    <h2><a href=/images?auth=1>/images</a></h2>
    <h2><a href=/uploads>/uploads</a></h2>
    </body></html>
  `;

  return res.type('.html').send(html);
});

module.exports = router;
