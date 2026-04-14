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

