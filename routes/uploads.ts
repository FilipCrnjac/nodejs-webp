import express, { Request, Response } from 'express';

import Auth = require('./../src/auth/auth');
import Upload = require('./../src/controller/upload');
import UploadJobService = require('./../src/services/uploadJobService');

type HttpError = Error & { status?: number };

const router = express.Router();
const upload = new Upload();
const uploadJobService = new UploadJobService();

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

router.get('/jobs/:jobId/status', Auth.isAuthenticated, (req: Request, res: Response) => {
  const jobId = String(req.params.jobId || '').trim();
  if (!jobId) {
    return res.status(400).json({ error: true, message: 'Invalid job id.' });
  }

  const job = uploadJobService.getJob(jobId);
  if (!job) {
    return res.status(404).json({ error: true, message: 'Job not found.' });
  }

  const userId = (req as Request & { userId: number }).userId;
  if (job.userId !== userId) {
    return res.status(403).json({ error: true, message: 'Forbidden!' });
  }

  return res.json({
    id: job.id,
    status: job.status,
    groupId: job.groupId,
    error: job.error,
  });
});

export = router;
