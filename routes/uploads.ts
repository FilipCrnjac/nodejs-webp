import express, { Request, Response } from 'express';

import Auth = require('./../src/auth/auth');
import Upload = require('./../src/controller/upload');

type HttpError = Error & { status?: number };

const router = express.Router();
const upload = new Upload();

/* GET uploads index page. */
router.get('/', function(req: Request, res: Response) {
  res.type('.html').send(upload.getUploadsPage());
});

router.post('/', Auth.isAuthenticated, async (req: Request, res: Response) => {
  try {
    res.type('.html').send(await upload.uploadPhoto(req as Request & { userId: number }, res));
  } catch (error) {
    const typedError = error as HttpError;
    const status = typedError && typedError.status ? typedError.status : 500;
    res.status(status).type('.html').send(typedError.message || 'Saving image failed. Please try again.');
  }
});

export = router;
