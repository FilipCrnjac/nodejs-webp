const imagemin = require("imagemin");
const webp = require("imagemin-webp");
const path = require('path');
const FileHelperSync = require("./../utils/fileHelperSync");

module.exports = class Webp {
  static async convertLossy(inputImage, destination, quality = 75) {
    try {
      console.log(`convertLossy started (${inputImage})`);
      const startTimeLossy = process.hrtime();
      const result = await imagemin([inputImage], {
        destination, // same folder
        plugins: [
          webp({
            quality,
          })
        ]
      });
      logExecutionTime(startTimeLossy, `Lossy (${inputImage})`);
      const parsedPath = await path.parse(result[0].destinationPath);
      FileHelperSync.rename(result[0].destinationPath, path.join(parsedPath.dir, parsedPath.name  + `_${quality}-lossy.webp`));
    } catch (e) {
      console.log("Lossy image NOT converted!", e);
      return false;
    }

    return true;
  }

  static async convertLossless(inputImage, destination, quality = 75) {
    try {
      console.log(`convertLossless started (${inputImage})`);
      const startTimeLossless = process.hrtime();
      const result = await imagemin([inputImage], {
        destination, // same folder
        plugins: [
          webp({
            quality,
            lossless: true
          })
        ]
      });
      logExecutionTime(startTimeLossless, `Lossless (${inputImage})`);
      const parsedPath = await path.parse(result[0].destinationPath);
      FileHelperSync.rename(result[0].destinationPath, path.join(parsedPath.dir, parsedPath.name  + `_${quality}-lossless.webp`));
    } catch (e) {
      console.log("Lossless image NOT converted!", e);
      return false;
    }

    return true;
  }
};

function logExecutionTime(start, message) {
  const end = process.hrtime(start);
  console.info(`${message} execution time: ${end[0]}s ${(end[1] / 1000000).toFixed(2)}ms`);
}
