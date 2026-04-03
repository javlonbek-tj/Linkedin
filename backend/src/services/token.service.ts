import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { db } from '../db/db';
import { refreshTokens } from '../db/schema';

interface Payload {
  userId: string;
  email: string;
  iat: number;
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function generateTokens(
  payload: Payload,
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });

  await db.insert(refreshTokens).values({
    userId: payload.userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return { accessToken, refreshToken };
}

export function validateAccessToken(token: string): Payload {
  try {
    return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as Payload;
  } catch {
    throw new Error('Invalid or expired access token.');
  }
}

export function validateRefreshToken(token: string): Payload {
  try {
    return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as Payload;
  } catch {
    throw new Error('Invalid or expired refresh token.');
  }
}
