import express, { Request, Response } from 'express';

import AuthService = require('./../src/auth/authService');

type LoginAttemptState = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

const loginAttemptWindowMs = 10 * 60 * 1000;
const maxFailedAttempts = 5;
const blockDurationMs = 10 * 60 * 1000;
const loginAttempts = new Map<string, LoginAttemptState>();

const router = express.Router();
const authService = new AuthService();

const AUTH_REQUIRED_ERROR = { error: true, code: 'AUTH_REQUIRED', message: 'Please, login!' };

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: true, message: 'Username and password are required.' });
  }

  try {
    const authResult = await authService.register(String(username), String(password));
    if (!authResult) {
      return res.status(409).json({ error: true, message: 'Username already exists.' });
    }

    applyAuthCookies(res, authResult.token, authResult.refreshToken);
    return res.json({
      token: authResult.token,
      refreshToken: authResult.refreshToken,
      tokenType: 'Bearer',
      userId: authResult.userId,
      expiresIn: 3600,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: true, message: 'Registration failed.' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: true, message: 'Username and password are required.' });
  }

  const usernameValue = String(username);
  const clientKey = buildRateLimitKey(req, usernameValue);
  if (!canAttemptLogin(clientKey)) {
    return res.status(429).json({ error: true, message: 'Too many login attempts. Please try again later.' });
  }

  const authResult = await authService.login(usernameValue, String(password));
  if (!authResult) {
    registerFailedAttempt(clientKey);
    return res.status(401).json({ error: true, message: 'Invalid credentials.' });
  }

  clearFailedAttempts(clientKey);
  applyAuthCookies(res, authResult.token, authResult.refreshToken);

  return res.json({
    token: authResult.token,
    refreshToken: authResult.refreshToken,
    tokenType: 'Bearer',
    userId: authResult.userId,
    expiresIn: 3600,
  });
});

router.post('/refresh', async (req: Request, res: Response) => {
  const providedRefresh = req.body?.refreshToken;
  const cookieRefresh = readCookie(req.headers.cookie, 'refresh_token');
  const refreshToken = String(providedRefresh || cookieRefresh || '');
  if (!refreshToken) {
    return res.status(401).json(AUTH_REQUIRED_ERROR);
  }

  try {
    const authResult = await authService.refresh(refreshToken);
    applyAuthCookies(res, authResult.token, authResult.refreshToken);
    return res.json({
      token: authResult.token,
      refreshToken: authResult.refreshToken,
      tokenType: 'Bearer',
      userId: authResult.userId,
      expiresIn: 3600,
    });
  } catch (error) {
    return res.status(401).json(AUTH_REQUIRED_ERROR);
  }
});

router.post('/logout', (req: Request, res: Response) => {
  const providedRefresh = req.body?.refreshToken;
  const cookieRefresh = readCookie(req.headers.cookie, 'refresh_token');
  const refreshToken = String(providedRefresh || cookieRefresh || '');

  const authHeader = req.headers.authorization;
  const accessToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : undefined;

  authService.logout(refreshToken || undefined, accessToken || undefined);
  clearAuthCookies(res);

  return res.json({ success: true });
});

function applyAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 60 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
}

function buildRateLimitKey(req: Request, username: string): string {
  return `${req.ip}:${username}`;
}

function canAttemptLogin(key: string): boolean {
  pruneRateLimitEntries();
  const current = loginAttempts.get(key);
  if (!current) {
    return true;
  }

  return current.blockedUntil <= Date.now();
}

function registerFailedAttempt(key: string): void {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || now - current.firstAttemptAt > loginAttemptWindowMs) {
    loginAttempts.set(key, {
      count: 1,
      firstAttemptAt: now,
      blockedUntil: 0,
    });
    return;
  }

  const nextCount = current.count + 1;
  const blockedUntil = nextCount >= maxFailedAttempts ? now + blockDurationMs : 0;
  loginAttempts.set(key, {
    count: nextCount,
    firstAttemptAt: current.firstAttemptAt,
    blockedUntil,
  });
}

function clearFailedAttempts(key: string): void {
  loginAttempts.delete(key);
}

function pruneRateLimitEntries(): void {
  const now = Date.now();
  loginAttempts.forEach((value, key) => {
    const expiredWindow = now - value.firstAttemptAt > loginAttemptWindowMs;
    const blockExpired = value.blockedUntil > 0 && value.blockedUntil <= now;
    if (expiredWindow || blockExpired) {
      loginAttempts.delete(key);
    }
  });
}

function readCookie(cookieHeader: string | undefined, key: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const item = cookieHeader.split(';').map(cookie => cookie.trim()).find(cookie => cookie.startsWith(`${key}=`));
  if (!item) {
    return null;
  }

  return decodeURIComponent(item.split('=').slice(1).join('='));
}

export = router;

