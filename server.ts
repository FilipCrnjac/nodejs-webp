import express, { NextFunction, Request, Response } from 'express';
import path from 'path';

import auth = require('./src/auth/auth');
import authRouter = require('./routes/auth');
import indexRouter = require('./routes/index');
import uploadsRouter = require('./routes/uploads');
import imagesRouter = require('./routes/images');

type HttpError = Error & { status?: number };

const port = parseInt(process.env.PORT || '3003', 10);
// adjust it to your needs (default is inside project)
process.env.UPLOADS_FOLDER = process.env.UPLOADS_FOLDER || path.join(__dirname, '../uploads/images');

function createApp() {
  const app = express();

  app.use(express.json());

  app.use('/', indexRouter);
  app.use('/auth', authRouter);
  app.use('/uploads', uploadsRouter);
  // Auth middleware example of securing /images* routes -> check is user authenticated
  app.use('/images', auth.isAuthenticated, imagesRouter);

  // error handler
  app.use(function(err: HttpError, req: Request, res: Response, next: NextFunction) {
    void next;
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

export = app;
