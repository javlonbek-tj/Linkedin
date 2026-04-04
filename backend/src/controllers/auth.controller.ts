import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { REFRESH_TOKEN_TTL_MS } from '../services/token.service';
import { ENV } from '../config';
import type { AuthRequest } from '../middlewares/auth.middleware';
import type {
  RegisterInput,
  VerifyOtpInput,
  LoginInput,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
} from '../schemas/auth.schema';

const REFRESH_TOKEN_COOKIE_TTL_MS = REFRESH_TOKEN_TTL_MS;

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_COOKIE_TTL_MS,
  });
}

// POST /auth/register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.register(req.body as RegisterInput);
    res.status(201).json({
      status: 'success',
      message:
        'Registration successful. A 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/verify-otp
export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken, ...data } = await authService.verifyOtp(
      req.body as VerifyOtpInput,
    );
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

// POST /auth/resend-otp
export async function resendOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resendOtp(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'A 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/login
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken, ...data } = await authService.login(
      req.body as LoginInput,
    );
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

// POST /auth/refresh
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies.refreshToken as string | undefined;
    if (!token) {
      res
        .status(401)
        .json({ status: 'fail', message: 'Refresh token required.' });
      return;
    }
    const { refreshToken, ...data } = await authService.refresh(token);
    setRefreshTokenCookie(res, refreshToken);
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

// POST /auth/forgot-password
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.forgotPassword(req.body as ForgotPasswordInput);
    res.status(200).json({
      status: 'success',
      message: 'A 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/verify-reset-otp
export async function verifyResetOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await authService.verifyResetOtp(
      req.body as VerifyResetOtpInput,
    );
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
}

// POST /auth/reset-password
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resetPassword(req.body as ResetPasswordInput);
    res.status(200).json({
      status: 'success',
      message: 'Password has been reset successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// POST /auth/logout  (protected)
export async function logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.logout(req.user!.userId);
    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict' });
    res
      .status(200)
      .json({ status: 'success', message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
}
