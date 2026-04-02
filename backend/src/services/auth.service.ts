import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema/user.schema';
import { otps, refreshTokens } from '../db/schema/auth.schema';
import { ENV } from '../config/env';
import { sendOtpEmail } from './mail.service';
import type { User } from '../models/user.model';

const SALT_ROUNDS = 12;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): string {
  // Cryptographically random 6-digit code
  const bytes = crypto.randomBytes(4);
  const num = bytes.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, '0');
}

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, ENV.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, ENV.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

function refreshTokenExpiresAt(): Date {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

async function createAndSendOtp(userId: string, email: string, firstname: string): Promise<void> {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // The unique constraint on otps.userId means upsert is clean via delete + insert
  await db.delete(otps).where(eq(otps.userId, userId));
  await db.insert(otps).values({ userId, otpHash, expiresAt });

  await sendOtpEmail(email, firstname, otp);
}

// ── Service methods ───────────────────────────────────────────────────────────

export interface RegisterInput {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<void> {
  const { firstname, lastname, email, password } = input;

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) throw new Error('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({ firstname, lastname, email, passwordHash })
    .returning({ id: users.id, email: users.email, firstname: users.firstname });

  await createAndSendOtp(user.id, user.email, user.firstname);
}

// ─────────────────────────────────────────────────────────────────────────────

export interface VerifyOtpInput {
  email: string;
  otp: string;
}

export async function verifyOtp(input: VerifyOtpInput): Promise<void> {
  const { email, otp } = input;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error('Account not found.');
  if (user.isActivated) throw new Error('Email is already verified.');

  const now = new Date();
  const [record] = await db
    .select()
    .from(otps)
    .where(and(eq(otps.userId, user.id), gt(otps.expiresAt, now)))
    .limit(1);

  if (!record) throw new Error('OTP has expired or does not exist. Please request a new one.');

  const incoming = hashOtp(otp);
  if (!crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(record.otpHash))) {
    throw new Error('Invalid OTP.');
  }

  await db.delete(otps).where(eq(otps.userId, user.id));
  await db.update(users).set({ isActivated: true, updatedAt: new Date() }).where(eq(users.id, user.id));
}

// ─────────────────────────────────────────────────────────────────────────────

export async function resendOtp(email: string): Promise<void> {
  const [user] = await db
    .select({ id: users.id, email: users.email, firstname: users.firstname, isActivated: users.isActivated })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) throw new Error('Account not found.');
  if (user.isActivated) throw new Error('Email is already verified.');

  await createAndSendOtp(user.id, user.email, user.firstname);
}

// ─────────────────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: Pick<User, 'id' | 'firstname' | 'lastname' | 'email' | 'isActivated' | 'role'>;
}

export async function login(input: LoginInput): Promise<AuthTokens> {
  const { email, password } = input;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) throw new Error('Invalid email or password.');

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) throw new Error('Invalid email or password.');

  if (!user.isActivated) throw new Error('Please verify your email before logging in.');

  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id);

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: refreshTokenExpiresAt(),
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
  let payload: { userId: string };
  try {
    payload = jwt.verify(incomingToken, ENV.JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    throw new Error('Invalid or expired refresh token.');
  }

  const [storedToken] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, incomingToken))
    .limit(1);

  if (!storedToken || storedToken.userId !== payload.userId) {
    throw new Error('Refresh token has been revoked.');
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) throw new Error('User not found.');

  const accessToken = generateAccessToken(user.id, user.email);
  const newRefreshToken = generateRefreshToken(user.id);

  // Rotate: delete old, insert new
  await db.delete(refreshTokens).where(eq(refreshTokens.token, incomingToken));
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: newRefreshToken,
    expiresAt: refreshTokenExpiresAt(),
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
  // Invalidate all refresh tokens for this user (covers multi-device logout)
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
