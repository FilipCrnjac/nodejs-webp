const imagemin = require('imagemin');
const webp = require('imagemin-webp');

import fs from 'fs';
import os from 'os';
import path from 'path';

import FileHelperSync = require('./../utils/fileHelperSync');

type WebpPluginOptions = {
  quality: number;
  lossless?: boolean;
};

type ImageminResult = {
  destinationPath?: string;
};

class Webp {
  static async convertLossy(inputImage: string, destination: string, quality = 75): Promise<string> {
    return convert(inputImage, destination, quality, 'lossy', {
      quality,
    });
  }

  static async convertLossless(inputImage: string, destination: string, quality = 75): Promise<string> {
    return convert(inputImage, destination, quality, 'lossless', {
      quality,
      lossless: true
    });
  }

  static buildVariantFileName(sourceFileName: string, quality: number, label: 'lossy' | 'lossless'): string {
    const parsedPath = path.parse(sourceFileName);
    return `${quality}-${label}_${parsedPath.name}.webp`;
  }
}

async function convert(
  inputImage: string,
  destination: string,
  quality: number,
  label: string,
  pluginOptions: WebpPluginOptions
): Promise<string> {
  const tempDestination = fs.mkdtempSync(path.join(os.tmpdir(), `nodejs-webp-${label}-`));

  try {
    console.log(`convert${capitalize(label)} started (${inputImage})`);
    const startTime = process.hrtime();
    const result = await imagemin([inputImage], {
      destination: tempDestination,
      plugins: [
        webp(pluginOptions)
      ]
    }) as ImageminResult[];
    logExecutionTime(startTime, `${capitalize(label)} (${inputImage})`);

    if (!result[0] || !result[0].destinationPath) {
      throw new Error(`Converted ${label} image is missing output path.`);
    }

    const parsedPath = path.parse(inputImage);
    const outputPath = path.join(destination, Webp.buildVariantFileName(`${parsedPath.name}${parsedPath.ext}`, quality, label as 'lossy' | 'lossless'));
    FileHelperSync.rename(result[0].destinationPath, outputPath);

    return outputPath;
  } catch (e) {
    console.log(`${capitalize(label)} image NOT converted!`, e);
    throw e;
  } finally {
    fs.rmSync(tempDestination, { recursive: true, force: true });
  }
}

function logExecutionTime(start: [number, number], message: string): void {
  const end = process.hrtime(start);
  console.info(`${message} execution time: ${end[0]}s ${(end[1] / 1000000).toFixed(2)}ms`);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export = Webp;

