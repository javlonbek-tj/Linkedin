import { eq } from 'drizzle-orm';
import { db } from '../index';
import { refreshTokens, otps, type NewRefreshToken, type NewOtp } from '../schema';

export const refreshTokenQueries = {
  findByUserId: (userId: string) =>
    db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId)),

  findByToken: (token: string) =>
    db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).then((r) => r[0] ?? null),

  create: (data: NewRefreshToken) =>
    db.insert(refreshTokens).values(data).returning().then((r) => r[0]),

  deleteByUserId: (userId: string) =>
    db.delete(refreshTokens).where(eq(refreshTokens.userId, userId)).returning(),

  deleteByToken: (token: string) =>
    db.delete(refreshTokens).where(eq(refreshTokens.token, token)).returning().then((r) => r[0] ?? null),
};

export const otpQueries = {
  findByUserId: (userId: string) =>
    db.select().from(otps).where(eq(otps.userId, userId)).then((r) => r[0] ?? null),

  upsert: (data: NewOtp) =>
    db
      .insert(otps)
      .values(data)
      .onConflictDoUpdate({
        target: otps.userId,
        set: { otpHash: data.otpHash, expiresAt: data.expiresAt, updatedAt: new Date() },
      })
      .returning()
      .then((r) => r[0]),

  deleteByUserId: (userId: string) =>
    db.delete(otps).where(eq(otps.userId, userId)).returning().then((r) => r[0] ?? null),
};
