import FileHelperSync = require('./../utils/fileHelperSync');

class ImageService {
  getDirectories(): string[] {
    return FileHelperSync.getDirectories(process.env.UPLOADS_FOLDER!);
  }

  getDirectoryFiles(folderId: number): string[] {
    return FileHelperSync.getFiles(`${process.env.UPLOADS_FOLDER!}/${folderId}`);
  }
}

export = ImageService;

