import fs from 'fs';
import path from 'path';

import jwt from 'jsonwebtoken';

type UserRecord = {
  id: number;
  username: string;
  password: string;
};

type TokenPayload = {
  sub: number;
  username: string;
};

const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me';

class AuthService {
  private users: UserRecord[];

  constructor() {
    this.users = this.loadUsers();
  }

  login(username: string, password: string): { token: string; userId: number } | null {
    const matchedUser = this.users.find(user => user.username === username && user.password === password);
    if (!matchedUser) {
      return null;
    }

    const payload: TokenPayload = {
      sub: matchedUser.id,
      username: matchedUser.username,
    };

    const token = jwt.sign(payload, jwtSecret, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    return {
      token,
      userId: matchedUser.id,
    };
  }

  verifyToken(token: string): { userId: number } {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload;

    const userId = Number(decoded.sub);
    if (!userId || Number.isNaN(userId)) {
      throw new Error('Invalid token subject.');
    }

    return { userId };
  }

  private loadUsers(): UserRecord[] {
    const usersFilePath = resolveUsersFilePath();
    const raw = fs.readFileSync(usersFilePath, 'utf8');
    const parsed = JSON.parse(raw) as UserRecord[];
    return parsed;
  }
}

function resolveUsersFilePath(): string {
  const candidates = [
    path.join(process.cwd(), 'src/data/users.json'),
    path.join(__dirname, '../data/users.json'),
  ];

  const found = candidates.find(candidate => fs.existsSync(candidate));
  if (!found) {
    throw new Error('Users file not found.');
  }

  return found;
}

export = AuthService;

