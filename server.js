const express = require('express');
const app = express();
const port = 3003;
// adjust it to your needs (default is inside project)
process.env.UPLOADS_FOLDER = `${__dirname}/uploads/images`;

const auth = require('./src/auth/auth');
const indexRouter = require('./routes/index');
const uploadsRouter = require('./routes/uploads');
const imagesRouter = require('./routes/images');

// Serve folder as static so we can preview images
app.use(express.static(process.env.UPLOADS_FOLDER));

app.use('/', indexRouter);
app.use('/uploads', uploadsRouter);
// Auth middleware example of securing /images* routes -> check is user authenticated
app.use('/images', auth.isAuthenticated, imagesRouter);

// error handler
app.use(function(err, req, res, next) {
  console.log(err);
  const message = err instanceof Error ? `Error: ${err.message}` : err;
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? message : "Server error!";

  // render the error page
  res.status(err.status || 500);
  res.send(message);
});

app.listen(port, () => {
  console.log('Listening at ' + port );
});
