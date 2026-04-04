import { Router } from 'express';
import type { Response } from 'express';
import * as userController from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { profileImagesUpload } from '../middlewares/upload.middleware';
import { updateUserSchema } from '../schemas/user.schema';
import type { AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', (req, res: Response, next) =>
  userController.getMe(req as AuthRequest, res, next),
);
router.patch('/me', ...profileImagesUpload, validate(updateUserSchema), (req, res: Response, next) =>
  userController.updateMe(req as AuthRequest, res, next),
);
router.delete('/me', (req, res: Response, next) =>
  userController.deleteMe(req as AuthRequest, res, next),
);
router.get('/', (req, res: Response, next) =>
  userController.getAllUsers(req as AuthRequest, res, next),
);
router.get('/:id', (req, res: Response, next) =>
  userController.getUserProfile(req as AuthRequest, res, next),
);

export default router;
