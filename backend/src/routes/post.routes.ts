import { Router } from 'express';
import type { Response } from 'express';
import * as postController from '../controllers/post.controller';
import * as commentController from '../controllers/comment.controller';
import * as interactionController from '../controllers/post-interaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { postMediaUpload } from '../middlewares/upload.middleware';
import { createPostSchema, updatePostSchema } from '../schemas/post.schema';
import { createCommentSchema } from '../schemas/comment.schema';
import { reactSchema } from '../schemas/post-interaction.schema';
import type { AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Posts
router.get('/', (req, res: Response, next) =>
  postController.getAllPosts(req as AuthRequest, res, next),
);
router.get('/mine', (req, res: Response, next) =>
  postController.getMyPosts(req as AuthRequest, res, next),
);
router.get('/user/:userId', (req, res: Response, next) =>
  postController.getUserPosts(req as AuthRequest, res, next),
);
router.get('/:id', (req, res: Response, next) =>
  postController.getPost(req as AuthRequest, res, next),
);
router.post('/', ...postMediaUpload, validate(createPostSchema), (req, res: Response, next) =>
  postController.createPost(req as AuthRequest, res, next),
);
router.patch('/:id', ...postMediaUpload, validate(updatePostSchema), (req, res: Response, next) =>
  postController.updatePost(req as AuthRequest, res, next),
);
router.delete('/:id', (req, res: Response, next) =>
  postController.deletePost(req as AuthRequest, res, next),
);

// Comments (nested under posts)
router.get('/:postId/comments', (req, res: Response, next) =>
  commentController.getComments(req as AuthRequest, res, next),
);
router.post(
  '/:postId/comments',
  validate(createCommentSchema),
  (req, res: Response, next) =>
    commentController.createComment(req as AuthRequest, res, next),
);

// Reactions (nested under posts)
router.put(
  '/:postId/reactions',
  validate(reactSchema),
  (req, res: Response, next) =>
    interactionController.reactToPost(req as AuthRequest, res, next),
);
router.delete('/:postId/reactions', (req, res: Response, next) =>
  interactionController.removeReaction(req as AuthRequest, res, next),
);
router.post('/:postId/views', (req, res: Response, next) =>
  interactionController.viewPost(req as AuthRequest, res, next),
);

export default router;
