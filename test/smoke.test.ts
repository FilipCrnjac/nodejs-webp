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

async function login(username: string, password: string): Promise<{ token: string; userId: number }> {
  const response = await fetch(createUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  assert.equal(response.status, 200);
  const body = await response.json() as { token: string; userId: number };
  assert.equal(typeof body.token, 'string');

  return body;
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

test('POST /auth/login rejects invalid credentials', async () => {
  const response = await fetch(createUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: 'user1', password: 'wrong' })
  });
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(body, { error: true, message: 'Invalid credentials.' });
});

test('GET /images/:id/json forbids access to another users folder', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo');

  const { token } = await login('user1', 'password1');

  const response = await fetch(createUrl('/images/13/json'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 403);
  assert.deepEqual(body, { error: true, message: 'Forbidden!' });
});

test('GET /images/:id/json returns files for the authenticated folder', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo');
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample_75-lossy.webp'), 'demo');

  const { token } = await login('user13', 'password13');

  const response = await fetch(createUrl('/images/13/json'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    images: ['sample.jpeg', 'sample_75-lossy.webp']
  });
});

test('GET /images/:id/files/:name blocks cross-user access and serves owner file', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  const filePath = path.join(uploadsRoot, '13', 'sample.jpeg');
  fs.writeFileSync(filePath, 'demo-content');

  const { token: tokenUser1 } = await login('user1', 'password1');
  const { token: tokenUser13 } = await login('user13', 'password13');

  const forbiddenResponse = await fetch(createUrl('/images/13/files/sample.jpeg'), {
    headers: {
      Authorization: `Bearer ${tokenUser1}`
    }
  });
  const forbiddenBody = await forbiddenResponse.json();
  assert.equal(forbiddenResponse.status, 403);
  assert.deepEqual(forbiddenBody, { error: true, message: 'Forbidden!' });

  const okResponse = await fetch(createUrl('/images/13/files/sample.jpeg'), {
    headers: {
      Authorization: `Bearer ${tokenUser13}`
    }
  });
  const text = await okResponse.text();
  assert.equal(okResponse.status, 200);
  assert.equal(text, 'demo-content');
});

test('POST /uploads rejects unsupported file types before saving', async () => {
  const { token } = await login('user1', 'password1');
  const formData = new FormData();
  formData.set('myImage', new File(['hello'], 'note.txt', { type: 'text/plain' }));

  const response = await fetch(createUrl('/uploads'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData,
  });

  const body = await response.text();
  const userDirectory = path.join(uploadsRoot, '1');

  assert.equal(response.status, 400);
  assert.equal(body, 'Invalid image format. Please double check selected image format.');
  assert.equal(fs.existsSync(userDirectory), true);
  assert.deepEqual(fs.readdirSync(userDirectory), []);
});

test('POST /uploads stores the original image and two webp variants', async () => {
  const { token } = await login('user1', 'password1');
  const formData = new FormData();
  formData.set('myImage', createImageFile());

  const response = await fetch(createUrl('/uploads'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData,
  });
  const html = await response.text();
  const userDirectory = path.join(uploadsRoot, '1');
  const files = fs.readdirSync(userDirectory).sort();

  assert.equal(response.status, 200);
  assert.match(html, /View images/);
  assert.equal(files.length, 3);
  assert.match(files[0], /pixel-\d+\.png/);
  assert.match(files[1], /pixel-\d+_75-lossless\.webp/);
  assert.match(files[2], /pixel-\d+_75-lossy\.webp/);
});


