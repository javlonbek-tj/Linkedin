import { Request, Response, NextFunction } from 'express';
import { validateAccessToken } from '../services/token.service';
import { db } from '../db/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string };
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  // 1) Getting token and check if it exists
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ success: false, message: 'Access token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2) Validating token
    const decoded = validateAccessToken(token);

    // 3) Getting user from database
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));

    if (!currentUser) {
      return res
        .status(401)
        .json({ success: false, message: 'User not found.' });
    }

    // 4) Check if user changed password after token was issued
    if (
      currentUser.passwordChangedAt &&
      decoded.iat < currentUser.passwordChangedAt.getTime() / 1000
    ) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid or expired access token.' });
    }

    req.user = { userId: currentUser.id, email: currentUser.email };
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: 'Invalid or expired access token.' });
  }
}
