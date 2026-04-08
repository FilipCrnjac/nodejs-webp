# Node.js server for image upload and WebP conversion (TypeScript)

Simple Express app that uploads images and converts each uploaded file to:

- `*_75-lossy.webp`
- `*_75-lossless.webp`

Supported upload formats:

- `image/png`
- `image/jpeg`

## What this project demonstrates

- Express routing and middleware
- file-backed user authentication with bearer token
- browser login screen (`/login`)
- bcrypt password-hash verification from users file
- refresh/logout token flow
- login rate limiting for failed attempts
- protected image/file access per user
- image upload via `multer`
- WebP conversion with lossy and lossless outputs
- basic file/folder management

## Authentication model

This project now uses JWT auth with access + refresh tokens:

1. `POST /auth/login` with username/password
2. receive access token + refresh token
3. call protected endpoints with:
   `Authorization: Bearer <token>`
4. refresh access token with `POST /auth/refresh`
5. end session with `POST /auth/logout`

Demo users are stored in `src/data/users.json`.

## Get started

```bash
npm install
npm start
```

Server runs on `http://localhost:3003` by default.

## Main endpoints

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /login`
- `GET /uploads`
- `POST /uploads` (protected)
- `GET /images` (protected)
- `GET /images/:id/html` (protected, owner only)
- `GET /images/:id/json` (protected, owner only)
- `GET /images/:id/files/:name` (protected, owner only)

## Example usage

### 1) Login and store token

```bash
TOKEN=$(curl -sS -X POST http://localhost:3003/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"user1","password":"password1"}' \
  | python3 -c 'import sys, json; print(json.load(sys.stdin)["token"])')

REFRESH_TOKEN=$(curl -sS -X POST http://localhost:3003/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"user1","password":"password1"}' \
  | python3 -c 'import sys, json; print(json.load(sys.stdin)["refreshToken"])')
```

### 2) List directories for current user session

```bash
curl -sS http://localhost:3003/images \
  -H "Authorization: Bearer $TOKEN"
```

### 3) Upload image

```bash
curl -sS -X POST http://localhost:3003/uploads \
  -H "Authorization: Bearer $TOKEN" \
  -F 'myImage=@/absolute/path/to/image.png;type=image/png'
```

### 4) List images in your folder (replace id with your user id)

```bash
curl -sS http://localhost:3003/images/1/json \
  -H "Authorization: Bearer $TOKEN"
```

### 5) Refresh access token

```bash
curl -sS -X POST http://localhost:3003/auth/refresh \
  -H 'Content-Type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

### 6) Logout

```bash
curl -sS -X POST http://localhost:3003/auth/logout \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```

## Browser workflow

Open `http://localhost:3003/login` and sign in with demo credentials.
The page stores your access token in browser storage and sets auth cookies.

## Build and test

```bash
npm run build
npm test
```

