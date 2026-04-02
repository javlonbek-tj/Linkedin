import { z } from 'zod';

export const registerSchema = z.object({
  firstname: z.string().min(1, 'First name is required.').trim(),
  lastname: z.string().min(1, 'Last name is required.').trim(),
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

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
