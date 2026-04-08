import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Server } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import app = require('../server');

const uploadsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nodejs-webp-tests-'));
process.env.UPLOADS_FOLDER = uploadsRoot;
const sampleImagePath = path.join(process.cwd(), 'uploads/images/15/image-1775633444155.png');

let server: Server;
let baseUrl: string;

function createUrl(pathname: string): string {
  return new URL(pathname, baseUrl).toString();
}

function createImageFile() {
  const buffer = fs.readFileSync(sampleImagePath);
  return new File([buffer], 'pixel.png', { type: 'image/png' });
}

test.before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine server port for smoke tests.');
  }

  const { port } = address;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }

  fs.rmSync(uploadsRoot, { recursive: true, force: true });
});

test.beforeEach(() => {
  fs.rmSync(uploadsRoot, { recursive: true, force: true });
  fs.mkdirSync(uploadsRoot, { recursive: true });
});

test('GET / returns the home page', async () => {
  const response = await fetch(createUrl('/'));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Path: \/</);
  assert.match(html, /\/uploads/);
});

test('GET /images without auth returns 401 JSON', async () => {
  const response = await fetch(createUrl('/images'));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(body, { error: true, message: 'Please, login!' });
});

test('GET /images/:id/json forbids access to another users folder', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo');

  const response = await fetch(createUrl('/images/13/json?auth=1'));
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.deepEqual(body, { error: true, message: 'Forbidden!' });
});

test('GET /images/:id/json returns files for the authenticated folder', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo');
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample_75-lossy.webp'), 'demo');

  const response = await fetch(createUrl('/images/13/json?auth=13'));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    images: ['sample.jpeg', 'sample_75-lossy.webp']
  });
});

test('POST /uploads rejects unsupported file types before saving', async () => {
  const formData = new FormData();
  formData.set('myImage', new File(['hello'], 'note.txt', { type: 'text/plain' }));

  const response = await fetch(createUrl('/uploads?auth=77'), {
    method: 'POST',
    body: formData,
  });

  const body = await response.text();
  const userDirectory = path.join(uploadsRoot, '77');

  assert.equal(response.status, 400);
  assert.equal(body, 'Invalid image format. Please double check selected image format.');
  assert.equal(fs.existsSync(userDirectory), true);
  assert.deepEqual(fs.readdirSync(userDirectory), []);
});

test('POST /uploads stores the original image and two webp variants', async () => {
  const formData = new FormData();
  formData.set('myImage', createImageFile());

  const response = await fetch(createUrl('/uploads?auth=88'), {
    method: 'POST',
    body: formData,
  });
  const html = await response.text();
  const userDirectory = path.join(uploadsRoot, '88');
  const files = fs.readdirSync(userDirectory).sort();

  assert.equal(response.status, 200);
  assert.match(html, /View images/);
  assert.equal(files.length, 3);
  assert.match(files[0], /pixel-\d+\.png/);
  assert.match(files[1], /pixel-\d+_75-lossless\.webp/);
  assert.match(files[2], /pixel-\d+_75-lossy\.webp/);
});


