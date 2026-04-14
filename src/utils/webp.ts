const imagemin = require('imagemin');
const webp = require('imagemin-webp');

import fs from 'fs';
import os from 'os';
import path from 'path';
import sharp from 'sharp';

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

/**
 * Auto-orient an image using EXIF orientation metadata so that the WebP
 * output is always upright regardless of camera rotation.
 * Returns the path to use for conversion (original if already upright,
 * or a temporary corrected copy otherwise).
 */
async function autoOrient(inputImage: string, tempDir: string): Promise<{ path: string; isTemp: boolean }> {
  try {
    const metadata = await sharp(inputImage).metadata();
    // orientation 1 (or absent) means already upright – skip costly re-encode
    if (!metadata.orientation || metadata.orientation === 1) {
      return { path: inputImage, isTemp: false };
    }

    const parsedPath = path.parse(inputImage);
    const orientedPath = path.join(tempDir, `oriented_${parsedPath.base}`);
    // .rotate() with no argument applies EXIF rotation and strips the tag
    await sharp(inputImage).rotate().toFile(orientedPath);
    return { path: orientedPath, isTemp: true };
  } catch {
    // If EXIF read fails, proceed with the original
    return { path: inputImage, isTemp: false };
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

    // Normalize EXIF rotation before WebP conversion so the output is upright
    const oriented = await autoOrient(inputImage, tempDestination);

    const result = await imagemin([oriented.path], {
      destination: tempDestination,
      plugins: [
        webp(pluginOptions)
      ]
    }) as ImageminResult[];
    logExecutionTime(startTime, `${capitalize(label)} (${inputImage})`);

    if (!result[0] || !result[0].destinationPath) {
      throw new Error(`Converted ${label} image is missing output path.`);
    }

    // Always base the output filename on the *original* input, not the temp oriented copy
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

