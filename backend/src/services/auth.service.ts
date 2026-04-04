import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/db';
import { users, otps, refreshTokens } from '../db/schema';
import { AppError } from '../utils/appError';
import { sendOTPEmail } from '../utils/mail/mailer';
import { generateOtp, hashOtp } from '../utils/auth.utils';
import { generateTokens, validateRefreshToken } from './token.service';
import type {
  RegisterInput,
  VerifyOtpInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
} from '../schemas/auth.schema';
import type { AuthTokens } from '../types/auth.types';

const SALT_ROUNDS = 12;
const OTP_TTL_MS = 1 * 60 * 1000; // 1 minutes

async function createAndSendOtp(userId: string, email: string): Promise<void> {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db
    .insert(otps)
    .values({ userId, otpHash, expiresAt })
    .onConflictDoUpdate({
      target: otps.userId,
      set: {
        otpHash,
        expiresAt,
        updatedAt: new Date(),
      },
    });

  try {
    await sendOTPEmail(email, otp, 'registration');
  } catch {
    await db.delete(otps).where(eq(otps.userId, userId));
    throw new AppError('Failed to send OTP email. Please try again.', 500);
  }
}

// ── Service methods ───────────────────────────────────────────────────────────

export async function register(input: RegisterInput): Promise<void> {
  const { firstname, lastname, username, email, password } = input;

  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email));
  if (existingEmail)
    throw new AppError('An account with this email already exists.', 409);

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username));
  if (existingUsername)
    throw new AppError('This username is already taken.', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({ firstname, lastname, username, email, passwordHash })
    .returning({
      id: users.id,
      email: users.email,
      firstname: users.firstname,
    });

  await createAndSendOtp(user.id, user.email);
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
    throw new AppError(
      'OTP has expired or does not exist. Please request a new one.',
      400,
    );

  const incoming = hashOtp(otp);
  if (
    !crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(record.otpHash))
  ) {
    throw new AppError('Invalid OTP.', 400);
  }

  await db.delete(otps).where(eq(otps.userId, user.id));
  await db
    .update(users)
    .set({ isActivated: true })
    .where(eq(users.id, user.id));

  const { accessToken, refreshToken } = await generateTokens({
    userId: user.id,
    email: user.email,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      isActivated: true,
      role: user.role,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────

export async function resendOtp(email: string): Promise<void> {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      isActivated: users.isActivated,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!user) throw new AppError('Account not found.', 404);
  if (user.isActivated) throw new AppError('Email is already verified.', 409);

  await createAndSendOtp(user.id, user.email);
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
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
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
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: {
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
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

// ─────────────────────────────────────────────────────────────────────────────

const RESET_OTP_TTL_MS = 1 * 60 * 1000; // 1 minutes

export async function forgotPassword({
  email,
}: ForgotPasswordInput): Promise<void> {
  const [user] = await db
    .select({ id: users.id, email: users.email, firstname: users.firstname })
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + RESET_OTP_TTL_MS);

  await db
    .update(users)
    .set({ passwordResetToken: otpHash, passwordResetExpires: expiresAt })
    .where(eq(users.id, user.id));

  try {
    await sendOTPEmail(user.email, otp, 'password_reset');
  } catch {
    await db
      .update(users)
      .set({ passwordResetToken: null, passwordResetExpires: null })
      .where(eq(users.id, user.id));
    throw new AppError('Failed to send OTP email. Please try again.', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function verifyResetOtp({
  email,
  otp,
}: VerifyResetOtpInput): Promise<{ resetToken: string }> {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
    throw new AppError('Invalid or expired OTP.', 400);
  }
  if (user.passwordResetExpires < new Date()) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  const incoming = hashOtp(otp);
  if (
    !crypto.timingSafeEqual(
      Buffer.from(incoming),
      Buffer.from(user.passwordResetToken),
    )
  ) {
    throw new AppError('Invalid OTP.', 400);
  }

  const plainToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(plainToken)
    .digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  await db
    .update(users)
    .set({ passwordResetToken: tokenHash, passwordResetExpires: expiresAt })
    .where(eq(users.id, user.id));

  return { resetToken: plainToken };
}

export async function resetPassword({
  resetToken,
  password,
}: ResetPasswordInput): Promise<void> {
  const tokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, tokenHash));

  if (!user || !user.passwordResetExpires) {
    throw new AppError('Invalid or expired reset token.', 400);
  }
  if (user.passwordResetExpires < new Date()) {
    throw new AppError('Reset token has expired. Please start over.', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordChangedAt: new Date(),
      passwordResetToken: null,
      passwordResetExpires: null,
    })
    .where(eq(users.id, user.id));

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
}
