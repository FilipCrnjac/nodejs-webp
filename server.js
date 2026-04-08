const express = require('express');
const path = require('path');

const port = parseInt(process.env.PORT || '3003', 10);
// adjust it to your needs (default is inside project)
process.env.UPLOADS_FOLDER = process.env.UPLOADS_FOLDER || path.join(__dirname, 'uploads/images');

const auth = require('./src/auth/auth');
const indexRouter = require('./routes/index');
const uploadsRouter = require('./routes/uploads');
const imagesRouter = require('./routes/images');

function createApp() {
  const app = express();

  // Serve folder as static so we can preview images
  app.use(express.static(process.env.UPLOADS_FOLDER));

  app.use('/', indexRouter);
  app.use('/uploads', uploadsRouter);
  // Auth middleware example of securing /images* routes -> check is user authenticated
  app.use('/images', auth.isAuthenticated, imagesRouter);

  // error handler
  app.use(function(err, req, res, next) {
    console.log(err);
    const status = err && err.status ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Server error!';
    res.locals.message = message;
    res.locals.error = req.app.get('env') === 'development' ? err : "Server error!";

    res.status(status);
    res.send(message);
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(port, () => {
    console.log('Listening at ' + port );
  });
}

module.exports = app;
