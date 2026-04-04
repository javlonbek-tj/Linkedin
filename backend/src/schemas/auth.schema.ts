import { z } from 'zod';

export const registerSchema = z.object({
  firstname: z.string().min(1, 'First name is required.').trim(),
  lastname: z.string().min(1, 'Last name is required.').trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters.')
    .max(30, 'Username must be at most 30 characters.')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'),
  email: z.email('Invalid email address.').trim().toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const verifyOtpSchema = z.object({
  email: z.email('Invalid email address.').trim().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits.').trim(),
});

export const resendOtpSchema = z.object({
  email: z.email('Invalid email address.').trim().toLowerCase(),
});

export const loginSchema = z.object({
  email: z.email('Invalid email address.').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required.'),
});

export const refreshSchema = z.object({});

export const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address.').trim().toLowerCase(),
});

export const verifyResetOtpSchema = z.object({
  email: z.email('Invalid email address.').trim().toLowerCase(),
  otp: z.string().length(6, 'OTP must be 6 digits.').trim(),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
