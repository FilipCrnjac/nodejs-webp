import express, { Request, Response } from 'express';

import AuthService = require('./../src/auth/authService');

const router = express.Router();
const authService = new AuthService();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: true, message: 'Username and password are required.' });
  }

  const authResult = authService.login(String(username), String(password));
  if (!authResult) {
    return res.status(401).json({ error: true, message: 'Invalid credentials.' });
  }

  return res.json({
    token: authResult.token,
    tokenType: 'Bearer',
    userId: authResult.userId,
    expiresIn: 3600,
  });
});

export = router;

