import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import type { AuthRequest } from '../middlewares/auth.middleware';

function handleError(res: Response, error: unknown): void {
  if (error instanceof Error) {
    res.status(400).json({ success: false, message: error.message });
  } else {
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}

// POST /auth/register
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { firstname, lastname, email, password } = req.body as {
      firstname?: string;
      lastname?: string;
      email?: string;
      password?: string;
    };

    if (!firstname?.trim() || !lastname?.trim() || !email?.trim() || !password) {
      res.status(400).json({ success: false, message: 'firstname, lastname, email, and password are required.' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }

    await authService.register({
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. A 6-digit verification code has been sent to your email.',
    });
  } catch (error) {
    handleError(res, error);
  }
}

// POST /auth/verify-otp
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body as { email?: string; otp?: string };

    if (!email?.trim() || !otp?.trim()) {
      res.status(400).json({ success: false, message: 'email and otp are required.' });
      return;
    }

    await authService.verifyOtp({ email: email.trim().toLowerCase(), otp: otp.trim() });

    res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    handleError(res, error);
  }
}

// POST /auth/resend-otp
export async function resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email?: string };

    if (!email?.trim()) {
      res.status(400).json({ success: false, message: 'email is required.' });
      return;
    }

    await authService.resendOtp(email.trim().toLowerCase());

    res.status(200).json({ success: true, message: 'A new verification code has been sent to your email.' });
  } catch (error) {
    handleError(res, error);
  }
}

// POST /auth/login
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email?.trim() || !password) {
      res.status(400).json({ success: false, message: 'email and password are required.' });
      return;
    }

    const result = await authService.login({ email: email.trim().toLowerCase(), password });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({ success: false, message: 'refreshToken is required.' });
      return;
    }

    const result = await authService.refresh(refreshToken);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

// POST /auth/logout  (protected — requires valid access token)
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    await authService.logout(userId);

    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    handleError(res, error);
  }
}
