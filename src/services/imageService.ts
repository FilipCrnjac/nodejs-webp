import FileHelperSync = require('./../utils/fileHelperSync');
import fs from 'fs';
import path from 'path';

type FileWithSize = {
  name: string;
  sizeBytes: number;
  uploadedAtMs: number;
};

type ImageGroup = {
  originalName: string;
  original: FileWithSize | null;
  variants: FileWithSize[];
  totalSize: number;
  uploadedAtMs: number;
};

type GallerySort = 'newest' | 'oldest' | 'name' | 'size';

type GalleryQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  sort?: GallerySort;
};

type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  sort: GallerySort;
};

class ImageService {
  getDirectories(): string[] {
    return FileHelperSync.getDirectories(process.env.UPLOADS_FOLDER!);
  }

  getDirectoryFiles(folderId: number): string[] {
    return FileHelperSync.getFiles(`${process.env.UPLOADS_FOLDER!}/${folderId}`);
  }

  getDirectoryFilesWithSize(folderId: number): FileWithSize[] {
    const folderPath = `${process.env.UPLOADS_FOLDER!}/${folderId}`;

    return this.getDirectoryFiles(folderId).map(name => {
      const filePath = path.join(folderPath, name);
      const stats = fs.statSync(filePath);

      return {
        name,
        sizeBytes: stats.size,
        // Upload writes each file once, so mtimeMs acts as a stable uploaded-at timestamp.
        uploadedAtMs: stats.mtimeMs,
      };
    }).sort((a, b) => b.uploadedAtMs - a.uploadedAtMs);
  }

  getImageGroups(folderId: number): ImageGroup[] {
    const files = this.getDirectoryFilesWithSize(folderId);
    const groups = new Map<string, ImageGroup>();

    files.forEach(file => {
      const originalName = this.extractOriginalFileName(file.name);

      if (!groups.has(originalName)) {
        groups.set(originalName, {
          originalName,
          original: null,
          variants: [],
          totalSize: 0,
          uploadedAtMs: file.uploadedAtMs,
        });
      }

      const group = groups.get(originalName)!;
      group.totalSize += file.sizeBytes;
      group.uploadedAtMs = Math.max(group.uploadedAtMs, file.uploadedAtMs);

      if (this.isOriginalImage(file.name, originalName)) {
        group.original = file;
        group.uploadedAtMs = file.uploadedAtMs;
      } else {
        group.variants.push(file);
      }
    });

    return Array.from(groups.values())
      .filter(g => g.original !== null)
      .sort((a, b) => b.uploadedAtMs - a.uploadedAtMs);
  }

  getPagedDirectoryFilesWithSize(folderId: number, query: GalleryQuery): PagedResult<FileWithSize> {
    const normalized = normalizeGalleryQuery(query);
    const filtered = this.getDirectoryFilesWithSize(folderId).filter(file =>
      !normalized.q || file.name.toLowerCase().includes(normalized.q)
    );

    filtered.sort((a, b) => {
      if (normalized.sort === 'oldest') {
        return a.uploadedAtMs - b.uploadedAtMs;
      }
      if (normalized.sort === 'name') {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }
      if (normalized.sort === 'size') {
        return b.sizeBytes - a.sizeBytes;
      }
      return b.uploadedAtMs - a.uploadedAtMs;
    });

    return paginate(filtered, normalized);
  }

  getPagedImageGroups(folderId: number, query: GalleryQuery): PagedResult<ImageGroup> {
    const normalized = normalizeGalleryQuery(query);
    const filtered = this.getImageGroups(folderId).filter(group =>
      !normalized.q || group.originalName.toLowerCase().includes(normalized.q)
    );

    filtered.sort((a, b) => {
      if (normalized.sort === 'oldest') {
        return a.uploadedAtMs - b.uploadedAtMs;
      }
      if (normalized.sort === 'name') {
        return a.originalName.toLowerCase().localeCompare(b.originalName.toLowerCase());
      }
      if (normalized.sort === 'size') {
        return b.totalSize - a.totalSize;
      }
      return b.uploadedAtMs - a.uploadedAtMs;
    });

    return paginate(filtered, normalized);
  }

  private extractOriginalFileName(fileName: string): string {
    const parsed = path.parse(fileName);
    const variantPattern = /^(\d+)-(lossy|lossless)_(.+)$/;
    const match = parsed.name.match(variantPattern);
    return match ? match[3] : parsed.name;
  }

  private isOriginalImage(fileName: string, originalName: string): boolean {
    const parsed = path.parse(fileName);
    return parsed.name === originalName || fileName === originalName;
  }
}

export = ImageService;

function normalizeGalleryQuery(query: GalleryQuery): { page: number; pageSize: number; q: string; sort: GallerySort } {
  const rawPage = Number.parseInt(String(query.page || ''), 10);
  const rawPageSize = Number.parseInt(String(query.pageSize || ''), 10);
  const rawSort = String(query.sort || 'newest').toLowerCase();

  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const pageSize = Number.isFinite(rawPageSize) ? Math.max(3, Math.min(30, rawPageSize)) : 15;
  const q = String(query.q || '').trim().toLowerCase();
  const sort: GallerySort = ['newest', 'oldest', 'name', 'size'].includes(rawSort) ? rawSort as GallerySort : 'newest';

  return { page, pageSize, q, sort };
}

function paginate<T>(items: T[], query: { page: number; pageSize: number; q: string; sort: GallerySort }): PagedResult<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.pageSize;
  const end = start + query.pageSize;

  return {
    items: items.slice(start, end),
    total,
    page,
    pageSize: query.pageSize,
    totalPages,
    q: query.q,
    sort: query.sort,
  };
}

