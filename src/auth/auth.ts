import { NextFunction, Request, Response } from 'express';

function isNumeric(value: number): boolean {
  return !Number.isNaN(value) && Number.isFinite(value);
}

const Auth = {
  // we are checking only for dummy auth data in query param
  // you would probably check for Authentication header and verify token and extract userId from it
  isAuthenticated: (req: Request, res: Response, next: NextFunction): void | Response => {
    if (!req.query.auth) {
      return res.status(401).json({ error: true, message:'Please, login!' });
    }
    const userId = parseInt(String(req.query.auth), 10);

    if (!isNumeric(userId) || userId < 1) {
      return res.status(400).json({ error: true, message:'Please provide valid userId!' });
    }

    req.userId = userId;
    return next();
  }
};

export = Auth;

