const imagemin = require("imagemin");
const webp = require("imagemin-webp");
const fs = require('fs');
const os = require('os');
const path = require('path');
const FileHelperSync = require("./../utils/fileHelperSync");

module.exports = class Webp {
  static async convertLossy(inputImage, destination, quality = 75) {
    return convert(inputImage, destination, quality, 'lossy', {
      quality,
    });
  }

  static async convertLossless(inputImage, destination, quality = 75) {
    return convert(inputImage, destination, quality, 'lossless', {
      quality,
      lossless: true
    });
  }
};

async function convert(inputImage, destination, quality, label, pluginOptions) {
  const tempDestination = fs.mkdtempSync(path.join(os.tmpdir(), `nodejs-webp-${label}-`));

  try {
    console.log(`convert${capitalize(label)} started (${inputImage})`);
    const startTime = process.hrtime();
    const result = await imagemin([inputImage], {
      destination: tempDestination,
      plugins: [
        webp(pluginOptions)
      ]
    });
    logExecutionTime(startTime, `${capitalize(label)} (${inputImage})`);

    if (!result[0] || !result[0].destinationPath) {
      throw new Error(`Converted ${label} image is missing output path.`);
    }

    const parsedPath = path.parse(result[0].destinationPath);
    const outputPath = path.join(destination, `${parsedPath.name}_${quality}-${label}.webp`);
    FileHelperSync.rename(result[0].destinationPath, outputPath);

    return outputPath;
  } catch (e) {
    console.log(`${capitalize(label)} image NOT converted!`, e);
    throw e;
  } finally {
    fs.rmSync(tempDestination, { recursive: true, force: true });
  }
}

function logExecutionTime(start, message) {
  const end = process.hrtime(start);
  console.info(`${message} execution time: ${end[0]}s ${(end[1] / 1000000).toFixed(2)}ms`);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

