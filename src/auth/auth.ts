import { NextFunction, Request, Response } from 'express';
import AuthService = require('./authService');

const authService = new AuthService();

const AUTH_REQUIRED_ERROR = {
  error: true,
  code: 'AUTH_REQUIRED',
  message: 'Please, login!'
};

const Auth = {
  isAuthenticated: (req: Request, res: Response, next: NextFunction): void | Response => {
    const authHeaderToken = extractBearerToken(req.headers.authorization);
    const cookieToken = readCookieToken(req.headers.cookie, 'access_token');
    const token = authHeaderToken || cookieToken;

    if (!token) {
      const fetchDest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
      const isDocumentNavigation = fetchDest === 'document';
      if (isDocumentNavigation && req.method === 'GET') {
        return res.redirect('/?tab=login&authMessage=' + encodeURIComponent('Please sign in to continue.'));
      }
      return res.status(401).json(AUTH_REQUIRED_ERROR);
    }

    try {
      const { userId } = authService.verifyAccessToken(token);
      req.userId = userId;
      return next();
    } catch (error) {
      const fetchDest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
      const isDocumentNavigation = fetchDest === 'document';
      if (isDocumentNavigation && req.method === 'GET') {
        return res.redirect('/?tab=login&authMessage=' + encodeURIComponent('Your session expired. Please sign in again.'));
      }
      return res.status(401).json(AUTH_REQUIRED_ERROR);
    }
  }
};

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  return token || null;
}

function readCookieToken(cookieHeader: string | undefined, key: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const items = cookieHeader.split(';').map(item => item.trim());
  const match = items.find(item => item.startsWith(`${key}=`));
  if (!match) {
    return null;
  }

  return decodeURIComponent(match.split('=').slice(1).join('='));
}

export = Auth;

