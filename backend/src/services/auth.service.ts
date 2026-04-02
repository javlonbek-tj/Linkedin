import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/db';
import { users, otps, refreshTokens } from '../db/schema';
import { AppError } from '../utils/appError';
import { sendOtpEmail } from './mail.service';
import { generateOtp, hashOtp } from '../utils/auth.utils';
import { generateTokens, validateRefreshToken } from './token.service';
import type { RegisterInput, VerifyOtpInput, LoginInput } from '../schemas/auth.schema';
import type { AuthTokens } from '../types/auth.types';

const SALT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function createAndSendOtp(
  userId: string,
  email: string,
  firstname: string,
): Promise<void> {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.delete(otps).where(eq(otps.userId, userId));
  await db.insert(otps).values({ userId, otpHash, expiresAt });

  await sendOtpEmail(email, firstname, otp);
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<void> {
  const { firstname, lastname, email, password } = input;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existing) throw new AppError('An account with this email already exists.', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({ firstname, lastname, email, passwordHash })
    .returning({ id: users.id, email: users.email, firstname: users.firstname });

  await createAndSendOtp(user.id, user.email, user.firstname);
}

// ─────────────────────────────────────────────────────────────────────────────

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthTokens> {
  const { email, otp } = input;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new AppError('Account not found.', 404);
  if (user.isActivated) throw new AppError('Email is already verified.', 409);

  const now = new Date();
  const [record] = await db
    .select()
    .from(otps)
    .where(and(eq(otps.userId, user.id), gt(otps.expiresAt, now)));

  if (!record)
    throw new AppError('OTP has expired or does not exist. Please request a new one.', 400);

  const incoming = hashOtp(otp);
  if (!crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(record.otpHash))) {
    throw new AppError('Invalid OTP.', 400);
  }

  await db.delete(otps).where(eq(otps.userId, user.id));
  await db
    .update(users)
    .set({ isActivated: true, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  const { accessToken, refreshToken } = await generateTokens({
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      isActivated: true,
      role: user.role,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function resendOtp(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, email: users.email, firstname: users.firstname, isActivated: users.isActivated })
    .from(users)
    .where(eq(users.email, email));

  if (!user) throw new AppError('Account not found.', 404);
  if (user.isActivated) throw new AppError('Email is already verified.', 409);

  await createAndSendOtp(user.id, user.email, user.firstname);
}

// ─────────────────────────────────────────────────────────────────────────────

export async function login(input: LoginInput): Promise<AuthTokens> {
  const { email, password } = input;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) throw new AppError('Invalid email or password.', 401);

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) throw new AppError('Invalid email or password.', 401);

  if (!user.isActivated)
    throw new AppError('Please verify your email before logging in.', 403);

  const { accessToken, refreshToken } = await generateTokens({
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function refresh(incomingToken: string): Promise<AuthTokens> {
  const payload = validateRefreshToken(incomingToken);

  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, incomingToken));

  if (!storedToken || storedToken.userId !== payload.userId)
    throw new AppError('Refresh token has been revoked.', 401);

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId));
  if (!user) throw new AppError('User not found.', 404);

  await db.delete(refreshTokens).where(eq(refreshTokens.token, incomingToken));
  const { accessToken, refreshToken: newRefreshToken } = await generateTokens({
    userId: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000),
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      isActivated: user.isActivated,
      role: user.role,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function logout(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
