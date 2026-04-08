import { NextFunction, Request, Response } from 'express';
import AuthService = require('./authService');

const authService = new AuthService();

const Auth = {
  isAuthenticated: (req: Request, res: Response, next: NextFunction): void | Response => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message:'Please, login!' });
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      return res.status(401).json({ error: true, message:'Please, login!' });
    }

    try {
      const { userId } = authService.verifyToken(token);
      req.userId = userId;
      return next();
    } catch (error) {
      return res.status(401).json({ error: true, message:'Please, login!' });
    }
  }
};

export = Auth;

