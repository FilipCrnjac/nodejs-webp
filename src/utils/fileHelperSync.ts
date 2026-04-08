import { existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

class FileHelperSync {
  static getFiles(directoryPath: string): string[] {
    return readdirSync(directoryPath).filter(fileName => statSync(join(directoryPath, fileName)).isFile());
  }

  static getDirectories(directoryPath: string): string[] {
    return readdirSync(directoryPath).filter(fileName => statSync(join(directoryPath, fileName)).isDirectory());
  }

  static loadFilesRecursively(directoryPath: string): unknown[] {
    const directories = FileHelperSync.getDirectories(directoryPath);

    return directories.length
      ? directories.map(directory => FileHelperSync.loadFilesRecursively(`${directoryPath}/${directory}`))
      : FileHelperSync.getFiles(directoryPath);
  }

  static checkDirectory(directoryPath: string): boolean {
    return existsSync(directoryPath);
  }

  static createDirectory(directoryPath: string): true {
    if (FileHelperSync.checkDirectory(directoryPath)) {
      return true;
    }

    console.log(`Creating folder synchronously: ${directoryPath}`);
    mkdirSync(directoryPath, { recursive: true });

    return true;
  }

  static rename(oldPath: string, newPath: string): void {
    renameSync(oldPath, newPath);
  }

  static deleteFile(filePath: string): boolean {
    if (!existsSync(filePath)) {
      return false;
    }

    unlinkSync(filePath);

    return true;
  }
}

export = FileHelperSync;
