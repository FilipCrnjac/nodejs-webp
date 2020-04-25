const { readdirSync, statSync, existsSync, mkdirSync, renameSync } = require('fs');
const { join } = require('path');

module.exports = class FileHelperSync {
  static getFiles(p) {
    return readdirSync(p).filter(f => statSync(join(p, f)).isFile())
  }

  static getDirectories(p) {
    return readdirSync(p).filter(f => statSync(join(p, f)).isDirectory())
  }

  static loadFilesRecursively(path) {
    const directories = FileHelperSync.getDirectories(path);
    return directories.length ? directories.map(directory => FileHelperSync.loadFilesRecursively(path + `/${directory}`)) : FileHelperSync.getFiles(path);
  }

  static checkDirectory(path) {
    return existsSync(path);
  }

  static createDirectory(path) {
    if (FileHelperSync.checkDirectory(path)) {
      return true;
    }
    console.log(`Creating folder synchronously: ${path}`);
    mkdirSync(path);

    return true;
  }

  static rename(oldPath, newPath) {
    return renameSync(oldPath, newPath);
  }
};
