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

async function login(username: string, password: string): Promise<{ token: string; refreshToken: string; userId: number }> {
  const response = await fetch(createUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });

  assert.equal(response.status, 200);
  const body = await response.json() as { token: string; refreshToken: string; userId: number };
  assert.equal(typeof body.token, 'string');
  assert.equal(typeof body.refreshToken, 'string');

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
  assert.match(html, /\/login/);
  assert.match(html, /\/uploads/);
});

test('GET / includes home upload drag-drop and preview controls', async () => {
  const response = await fetch(createUrl('/'));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /id="home-upload-dropzone"/);
  assert.match(html, /id="home-upload-preview-section"/);
});

test('GET / includes silent auth refresh hooks', async () => {
  const response = await fetch(createUrl('/'));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scheduleSilentRefresh/);
  assert.match(html, /redirectToSessionExpired/);
  assert.match(html, /showLoginRedirectMessageFromUrl/);
  assert.match(html, /tab-panels/);
});

test('GET /session-expired returns relogin helper screen', async () => {
  const response = await fetch(createUrl('/session-expired'));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Session expired/i);
  assert.match(html, /Go to Sign In/);
});

test('GET /login returns login screen', async () => {
  const response = await fetch(createUrl('/login'));
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Path: \/login/);
  assert.match(html, /Login/);
});

test('GET /images without auth returns 401 JSON', async () => {
  const response = await fetch(createUrl('/images'));
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(body, { error: true, code: 'AUTH_REQUIRED', message: 'Please, login!' });
});

test('GET /images without auth redirects browser document requests to login tab', async () => {
  const response = await fetch(createUrl('/images/1/grouped/html'), {
    redirect: 'manual',
    headers: {
      'sec-fetch-dest': 'document'
    }
  });

  assert.equal(response.status, 302);
  assert.match(response.headers.get('location') || '', /^\/\?tab=login&authMessage=/);
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

test('POST /auth/login rate limits repeated failed attempts', async () => {
  const user = 'rate-limit-user';

  for (let i = 0; i < 5; i += 1) {
    const response = await fetch(createUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: user, password: 'wrong' })
    });

    assert.equal(response.status, 401);
  }

  const blocked = await fetch(createUrl('/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username: user, password: 'wrong' })
  });
  const body = await blocked.json();

  assert.equal(blocked.status, 429);
  assert.deepEqual(body, { error: true, message: 'Too many login attempts. Please try again later.' });
});

test('POST /auth/refresh rotates tokens and keeps access valid', async () => {
  const loginResult = await login('user1', 'password1');

  const response = await fetch(createUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken: loginResult.refreshToken })
  });
  const body = await response.json() as { token: string; refreshToken: string };

  assert.equal(response.status, 200);
  assert.notEqual(body.token, loginResult.token);
  assert.notEqual(body.refreshToken, loginResult.refreshToken);

  const protectedResponse = await fetch(createUrl('/images/1/json'), {
    headers: {
      Authorization: `Bearer ${body.token}`
    }
  });
  assert.notEqual(protectedResponse.status, 401);
});

test('POST /auth/logout revokes refresh token and current access token', async () => {
  const loginResult = await login('user1', 'password1');

  const logoutResponse = await fetch(createUrl('/auth/logout'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginResult.token}`
    },
    body: JSON.stringify({ refreshToken: loginResult.refreshToken })
  });
  const logoutBody = await logoutResponse.json();
  assert.equal(logoutResponse.status, 200);
  assert.deepEqual(logoutBody, { success: true });

  const refreshResponse = await fetch(createUrl('/auth/refresh'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken: loginResult.refreshToken })
  });
  assert.equal(refreshResponse.status, 401);

  const protectedResponse = await fetch(createUrl('/images/1/json'), {
    headers: {
      Authorization: `Bearer ${loginResult.token}`
    }
  });
  assert.equal(protectedResponse.status, 401);
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
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossy_sample.webp'), 'demo');

  const { token } = await login('user13', 'password13');

  const response = await fetch(createUrl('/images/13/json'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    images: ['75-lossy_sample.webp', 'sample.jpeg']
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

test('GET /images/:id/groups/:groupId/html shows audit metadata and download count', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo-content');
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossy_sample.webp'), 'demo-lossy');
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossless_sample.webp'), 'demo-lossless');

  const { token } = await login('user13', 'password13');

  const fileResponse = await fetch(createUrl('/images/13/files/sample.jpeg'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  assert.equal(fileResponse.status, 200);

  const detailResponse = await fetch(createUrl('/images/13/groups/sample/html'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const html = await detailResponse.text();

  assert.equal(detailResponse.status, 200);
  assert.match(html, /Downloads:<\/strong> 1/);
  assert.match(html, /Last viewed:/);
  assert.match(html, /Image Set \(Original \+ Variants\)/);
  assert.match(html, /class="image-set-grid"/);
  assert.match(html, /id="detail-lightbox"/);
  assert.match(html, /compression-lossy/);
  assert.match(html, /compression-lossless/);
});

test('DELETE /images/:id/groups/:groupId removes original and both variants', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo');
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossy_sample.webp'), 'demo');
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossless_sample.webp'), 'demo');

  const { token } = await login('user13', 'password13');

  const response = await fetch(createUrl('/images/13/groups/sample'), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(fs.readdirSync(path.join(uploadsRoot, '13')), []);
});

test('GET /images/:id/groups/:groupId/download returns a zip archive', async () => {
  fs.mkdirSync(path.join(uploadsRoot, '13'), { recursive: true });
  fs.writeFileSync(path.join(uploadsRoot, '13', 'sample.jpeg'), 'demo');
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossy_sample.webp'), 'demo');
  fs.writeFileSync(path.join(uploadsRoot, '13', '75-lossless_sample.webp'), 'demo');

  const { token } = await login('user13', 'password13');
  const response = await fetch(createUrl('/images/13/groups/sample/download'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const bytes = new Uint8Array(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /application\/zip/);
  assert.equal(bytes[0], 80); // P
  assert.equal(bytes[1], 75); // K
});

test('GET /images/:id/grouped/html includes pagination controls when many groups exist', async () => {
  const folderPath = path.join(uploadsRoot, '13');
  fs.mkdirSync(folderPath, { recursive: true });

  for (let i = 0; i < 12; i += 1) {
    fs.writeFileSync(path.join(folderPath, `sample-${i}.jpeg`), `demo-${i}`);
    fs.writeFileSync(path.join(folderPath, `75-lossy_sample-${i}.webp`), `demo-lossy-${i}`);
    fs.writeFileSync(path.join(folderPath, `75-lossless_sample-${i}.webp`), `demo-lossless-${i}`);
  }

  const { token } = await login('user13', 'password13');
  const response = await fetch(createUrl('/images/13/grouped/html'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /id="gallery-pagination"/);
  assert.match(html, /id="gallery-prev-btn"/);
  assert.match(html, /id="gallery-next-btn"/);
  assert.match(html, /Page '\s*\+ currentPage \+ '\s*of/);
});

test('GET /images/:id/html orders images by uploaded time (newest first)', async () => {
  const folderPath = path.join(uploadsRoot, '13');
  fs.mkdirSync(folderPath, { recursive: true });
  const olderFile = path.join(folderPath, 'older.jpeg');
  const newerFile = path.join(folderPath, 'newer.jpeg');
  fs.writeFileSync(olderFile, 'old');
  fs.writeFileSync(newerFile, 'new');

  const now = Date.now();
  fs.utimesSync(olderFile, new Date(now - 20_000), new Date(now - 20_000));
  fs.utimesSync(newerFile, new Date(now), new Date(now));

  const { token } = await login('user13', 'password13');
  const response = await fetch(createUrl('/images/13/html'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.ok(html.indexOf('newer.jpeg') < html.indexOf('older.jpeg'));
});

test('GET /images/:id/grouped/html orders groups by uploaded time (newest first)', async () => {
  const folderPath = path.join(uploadsRoot, '13');
  fs.mkdirSync(folderPath, { recursive: true });
  const olderOriginal = path.join(folderPath, 'older-group.jpeg');
  const newerOriginal = path.join(folderPath, 'newer-group.jpeg');
  fs.writeFileSync(olderOriginal, 'old-group');
  fs.writeFileSync(newerOriginal, 'new-group');

  const now = Date.now();
  fs.utimesSync(olderOriginal, new Date(now - 20_000), new Date(now - 20_000));
  fs.utimesSync(newerOriginal, new Date(now), new Date(now));

  const { token } = await login('user13', 'password13');
  const response = await fetch(createUrl('/images/13/grouped/html'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.ok(html.indexOf('newer-group.jpeg') < html.indexOf('older-group.jpeg'));
});

test('GET /images/:id/grouped/html includes group search controls', async () => {
  const folderPath = path.join(uploadsRoot, '13');
  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(path.join(folderPath, 'cover.jpeg'), 'demo-cover');
  fs.writeFileSync(path.join(folderPath, '75-lossy_cover.webp'), 'demo-lossy-cover');
  fs.writeFileSync(path.join(folderPath, '75-lossless_cover.webp'), 'demo-lossless-cover');

  const { token } = await login('user13', 'password13');
  const response = await fetch(createUrl('/images/13/grouped/html'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /id="gallery-search-input"/);
  assert.match(html, /id="gallery-search-clear"/);
  assert.match(html, /aria-label="Gallery view mode"/);
  assert.match(html, /href="\/images\/13\/html"/);
  assert.match(html, /href="\/images\/13\/grouped\/html"/);
  assert.match(html, /Total group size:/);
  assert.match(html, /Original<\/span><strong>/);
  assert.match(html, /Lossy/);
  assert.match(html, /Lossless/);
  assert.match(html, /compression-lossy/);
  assert.match(html, /compression-lossless/);
  assert.match(html, /View group/);
  assert.match(html, /Copy link/);
  assert.match(html, /zip-btn/);
  assert.match(html, /delete-group-btn/);
  assert.match(html, /ondblclick="openGroupFromCard\(event, this\)"/);
});

test('GET /images/:id/html includes grouped toggle link', async () => {
  const folderPath = path.join(uploadsRoot, '13');
  fs.mkdirSync(folderPath, { recursive: true });
  fs.writeFileSync(path.join(folderPath, 'cover.jpeg'), 'demo-cover');

  const { token } = await login('user13', 'password13');
  const response = await fetch(createUrl('/images/13/html'), {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /aria-label="Gallery view mode"/);
  assert.match(html, /href="\/images\/13\/html"/);
  assert.match(html, /href="\/images\/13\/grouped\/html"/);
  assert.match(html, /id="gallery-search-input"/);
  assert.match(html, /id="gallery-search-clear"/);
  assert.match(html, /id="gallery-pagination"/);
  assert.match(html, /id="gallery-prev-btn"/);
  assert.match(html, /id="gallery-next-btn"/);
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
  assert.match(html, /Open uploaded group/);
  assert.match(html, /\/images\/1\/groups\/pixel-\d+\/html/);
  assert.equal(files.length, 3);
  assert.ok(files.some(file => /pixel-\d+\.png/.test(file)));
  assert.ok(files.some(file => /75-lossless_pixel-\d+\.webp/.test(file)));
  assert.ok(files.some(file => /75-lossy_pixel-\d+\.webp/.test(file)));
});

test('POST /uploads avoids overwrite for repeated uploads and prefixes quality in variant names', async () => {
  const { token } = await login('user1', 'password1');
  const originalNow = Date.now;
  Date.now = () => 1234567890;

  try {
    const firstFormData = new FormData();
    firstFormData.set('myImage', createImageFile());
    firstFormData.set('lossyQuality', '80');
    firstFormData.set('losslessQuality', '90');

    const secondFormData = new FormData();
    secondFormData.set('myImage', createImageFile());
    secondFormData.set('lossyQuality', '80');
    secondFormData.set('losslessQuality', '90');

    const firstResponse = await fetch(createUrl('/uploads'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: firstFormData,
    });

    const secondResponse = await fetch(createUrl('/uploads'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: secondFormData,
    });

    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);

    const userDirectory = path.join(uploadsRoot, '1');
    const files = fs.readdirSync(userDirectory).sort();

    assert.ok(files.includes('pixel-1234567890.png'));
    assert.ok(files.includes('pixel-1234567890-1.png'));
    assert.ok(files.includes('80-lossy_pixel-1234567890.webp'));
    assert.ok(files.includes('90-lossless_pixel-1234567890.webp'));
    assert.ok(files.includes('80-lossy_pixel-1234567890-1.webp'));
    assert.ok(files.includes('90-lossless_pixel-1234567890-1.webp'));
  } finally {
    Date.now = originalNow;
  }
});


