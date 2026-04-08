import FileHelperSync = require('./../utils/fileHelperSync');
import fs from 'fs';
import path from 'path';

type FileWithSize = {
  name: string;
  sizeBytes: number;
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
      };
    });
  }
}

export = ImageService;

