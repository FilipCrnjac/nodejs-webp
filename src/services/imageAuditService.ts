import fsSync from 'fs';
import path from 'path';

type GroupAuditRecord = {
  uploadedAt: string;
  lastViewed: string | null;
  downloads: number;
  lossyQuality?: number;
  losslessQuality?: number;
};

type UserAuditRecord = {
  [groupName: string]: GroupAuditRecord;
};

type AuditStore = {
  [userId: string]: UserAuditRecord;
};

class ImageAuditService {
  recordUpload(userId: number, originalFileName: string, lossyQuality: number, losslessQuality: number): void {
    const store = this.readStore();
    const userKey = String(userId);
    const groupName = extractOriginalFileName(originalFileName);
    const current = store[userKey]?.[groupName];

    const nextRecord: GroupAuditRecord = {
      uploadedAt: current?.uploadedAt || new Date().toISOString(),
      lastViewed: current?.lastViewed || null,
      downloads: current?.downloads || 0,
      lossyQuality,
      losslessQuality,
    };

    if (!store[userKey]) {
      store[userKey] = {};
    }

    store[userKey][groupName] = nextRecord;
    this.writeStore(store);
  }

  recordView(userId: number, fileNameOrGroup: string): void {
    const store = this.readStore();
    const userKey = String(userId);
    const groupName = extractOriginalFileName(fileNameOrGroup);
    const current = store[userKey]?.[groupName];

    if (!store[userKey]) {
      store[userKey] = {};
    }

    store[userKey][groupName] = {
      uploadedAt: current?.uploadedAt || new Date().toISOString(),
      lastViewed: new Date().toISOString(),
      downloads: current?.downloads || 0,
      lossyQuality: current?.lossyQuality,
      losslessQuality: current?.losslessQuality,
    };

    this.writeStore(store);
  }

  incrementDownloads(userId: number, fileNameOrGroup: string): void {
    const store = this.readStore();
    const userKey = String(userId);
    const groupName = extractOriginalFileName(fileNameOrGroup);
    const current = store[userKey]?.[groupName];

    if (!store[userKey]) {
      store[userKey] = {};
    }

    store[userKey][groupName] = {
      uploadedAt: current?.uploadedAt || new Date().toISOString(),
      lastViewed: new Date().toISOString(),
      downloads: (current?.downloads || 0) + 1,
      lossyQuality: current?.lossyQuality,
      losslessQuality: current?.losslessQuality,
    };

    this.writeStore(store);
  }

  getGroupAudit(userId: number, fileNameOrGroup: string): GroupAuditRecord | null {
    const store = this.readStore();
    const userKey = String(userId);
    const groupName = extractOriginalFileName(fileNameOrGroup);
    return store[userKey]?.[groupName] || null;
  }

  private readStore(): AuditStore {
    const filePath = resolveAuditFilePath();
    if (!fsSync.existsSync(filePath)) {
      return {};
    }

    try {
      const raw = fsSync.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as AuditStore;
    } catch {
      return {};
    }
  }

  private writeStore(store: AuditStore): void {
    const filePath = resolveAuditFilePath();
    const dir = path.dirname(filePath);
    if (!fsSync.existsSync(dir)) {
      fsSync.mkdirSync(dir, { recursive: true });
    }

    fsSync.writeFileSync(filePath, JSON.stringify(store, null, 2), 'utf8');
  }
}

function extractOriginalFileName(fileNameOrGroup: string): string {
  const parsed = path.parse(fileNameOrGroup);
  const variantPattern = /^(\d+)-(lossy|lossless)_(.+)$/;
  const match = parsed.name.match(variantPattern);
  return match ? match[3] : parsed.name;
}

function resolveAuditFilePath(): string {
  const uploadsFolder = process.env.UPLOADS_FOLDER || path.join(process.cwd(), 'uploads/images');
  return path.join(uploadsFolder, '.image-audit.json');
}

export = ImageAuditService;

