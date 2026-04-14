type UploadJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

type UploadJob = {
  id: string;
  userId: number;
  originalFileName: string;
  storedFileName: string;
  lossyQuality: number;
  losslessQuality: number;
  status: UploadJobStatus;
  createdAt: number;
  updatedAt: number;
  groupId?: string;
  error?: string;
};

const jobs = new Map<string, UploadJob>();
const jobTtlMs = 60 * 60 * 1000;

class UploadJobService {
  createJob(payload: {
    userId: number;
    originalFileName: string;
    storedFileName: string;
    lossyQuality: number;
    losslessQuality: number;
  }): UploadJob {
    this.pruneExpired();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const now = Date.now();
    const job: UploadJob = {
      id,
      userId: payload.userId,
      originalFileName: payload.originalFileName,
      storedFileName: payload.storedFileName,
      lossyQuality: payload.lossyQuality,
      losslessQuality: payload.losslessQuality,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };
    jobs.set(id, job);
    return job;
  }

  markProcessing(id: string): void {
    const job = jobs.get(id);
    if (!job) return;
    job.status = 'processing';
    job.updatedAt = Date.now();
  }

  markCompleted(id: string, groupId: string): void {
    const job = jobs.get(id);
    if (!job) return;
    job.status = 'completed';
    job.groupId = groupId;
    job.updatedAt = Date.now();
  }

  markFailed(id: string, error: string): void {
    const job = jobs.get(id);
    if (!job) return;
    job.status = 'failed';
    job.error = error;
    job.updatedAt = Date.now();
  }

  getJob(id: string): UploadJob | null {
    this.pruneExpired();
    return jobs.get(id) || null;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [id, job] of jobs.entries()) {
      if (now - job.updatedAt > jobTtlMs) {
        jobs.delete(id);
      }
    }
  }
}

export = UploadJobService;

