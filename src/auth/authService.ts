import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

type UserRecord = {
  id: number;
  username: string;
  passwordHash: string;
  quotaBytes?: number;
};

type TokenPayload = {
  sub: number;
  username: string;
  tokenType: 'access' | 'refresh';
  jti: string;
};

const jwtSecret = process.env.JWT_SECRET || 'development-secret-change-me';
const accessTokenTtlSeconds = 60 * 60;
const refreshTokenTtlSeconds = 60 * 60 * 24 * 7;
const defaultQuotaBytes = 100 * 1024 * 1024;
const activeRefreshTokens = new Map<string, number>();
const revokedAccessTokenIds = new Set<string>();

type LoginResult = {
  token: string;
  refreshToken: string;
  userId: number;
};

class AuthService {
  private users: UserRecord[];

  constructor() {
    this.users = this.loadUsers();
  }

  async login(username: string, password: string): Promise<LoginResult | null> {
    const matchedUser = this.users.find(user => user.username === username);
    if (!matchedUser) {
      return null;
    }

    const passwordMatches = await bcrypt.compare(password, matchedUser.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    return this.issueTokens(matchedUser.id, matchedUser.username);
  }

  async register(username: string, password: string): Promise<LoginResult | null> {
    if (this.users.some(u => u.username === username)) {
      return null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = Math.max(...this.users.map(u => u.id), 0) + 1;
    const newUser: UserRecord = { id: newUserId, username, passwordHash, quotaBytes: defaultQuotaBytes };
    this.users.push(newUser);

    try {
      this.saveUsers();
    } catch (error) {
      this.users.pop();
      throw error;
    }

    return this.issueTokens(newUserId, username);
  }

  private saveUsers(): void {
    const usersFilePath = resolveUsersFilePath();
    fsSync.writeFileSync(usersFilePath, JSON.stringify(this.users, null, 2), 'utf8');
  }

  async refresh(refreshToken: string): Promise<LoginResult> {
    const decoded = this.verifyTypedToken(refreshToken, 'refresh');
    const userId = Number(decoded.sub);
    if (!userId || Number.isNaN(userId)) {
      throw new Error('Invalid token subject.');
    }

    if (!activeRefreshTokens.has(decoded.jti)) {
      throw new Error('Refresh token revoked.');
    }

    activeRefreshTokens.delete(decoded.jti);
    return this.issueTokens(userId, String(decoded.username));
  }

  logout(refreshToken?: string, accessToken?: string): void {
    if (refreshToken) {
      try {
        const decoded = this.verifyTypedToken(refreshToken, 'refresh');
        activeRefreshTokens.delete(decoded.jti);
      } catch (error) {
        // ignore invalid refresh token on logout
      }
    }

    if (accessToken) {
      try {
        const decoded = this.verifyTypedToken(accessToken, 'access');
        revokedAccessTokenIds.add(decoded.jti);
      } catch (error) {
        // ignore invalid access token on logout
      }
    }
  }

  verifyAccessToken(token: string): { userId: number } {
    const decoded = this.verifyTypedToken(token, 'access');
    if (revokedAccessTokenIds.has(decoded.jti)) {
      throw new Error('Access token revoked.');
    }

    const userId = Number(decoded.sub);
    if (!userId || Number.isNaN(userId)) {
      throw new Error('Invalid token subject.');
    }

    return { userId };
  }

  getUserQuotaBytes(userId: number): number {
    const user = this.users.find(candidate => candidate.id === userId);
    return user?.quotaBytes || defaultQuotaBytes;
  }

  getDefaultQuotaBytes(): number {
    return defaultQuotaBytes;
  }

  private issueTokens(userId: number, username: string): LoginResult {
    const accessTokenId = randomUUID();
    const refreshTokenId = randomUUID();

    const token = jwt.sign({
      sub: userId,
      username,
      tokenType: 'access',
      jti: accessTokenId,
    } satisfies TokenPayload, jwtSecret, {
      algorithm: 'HS256',
      expiresIn: accessTokenTtlSeconds,
    });

    const refreshToken = jwt.sign({
      sub: userId,
      username,
      tokenType: 'refresh',
      jti: refreshTokenId,
    } satisfies TokenPayload, jwtSecret, {
      algorithm: 'HS256',
      expiresIn: refreshTokenTtlSeconds,
    });

    activeRefreshTokens.set(refreshTokenId, userId);

    return {
      token,
      refreshToken,
      userId,
    };
  }

  private verifyTypedToken(token: string, tokenType: 'access' | 'refresh'): TokenPayload {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & Partial<TokenPayload>;

    if (decoded.tokenType !== tokenType || !decoded.jti || !decoded.username) {
      throw new Error(`Invalid ${tokenType} token.`);
    }

    return {
      sub: Number(decoded.sub),
      username: String(decoded.username),
      tokenType,
      jti: String(decoded.jti),
    };
  }

  private loadUsers(): UserRecord[] {
    const usersFilePath = resolveUsersFilePath();
    const raw = fsSync.readFileSync(usersFilePath, 'utf8');
    const parsed = JSON.parse(raw) as UserRecord[];
    return parsed.map(user => ({
      ...user,
      quotaBytes: user.quotaBytes || defaultQuotaBytes,
    }));
  }
}

function resolveUsersFilePath(): string {
  const candidates = [
    path.join(process.cwd(), 'src/data/users.json'),
    path.join(__dirname, '../data/users.json'),
  ];

  const found = candidates.find(candidate => fsSync.existsSync(candidate));
  if (!found) {
    throw new Error('Users file not found.');
  }

  return found;
}

export = AuthService;

