import { eq, and } from 'drizzle-orm';
import { db } from '../index';
import {
  postLikes,
  postDislikes,
  postViews,
  type NewPostLike,
  type NewPostDislike,
  type NewPostView,
} from '../schema';

export const postInteractionQueries = {
  addLike: (data: NewPostLike) =>
    db.insert(postLikes).values(data).returning().then((r) => r[0]),

  removeLike: (postId: string, userId: string) =>
    db
      .delete(postLikes)
      .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null),

  addDislike: (data: NewPostDislike) =>
    db.insert(postDislikes).values(data).returning().then((r) => r[0]),

  removeDislike: (postId: string, userId: string) =>
    db
      .delete(postDislikes)
      .where(and(eq(postDislikes.postId, postId), eq(postDislikes.userId, userId)))
      .returning()
      .then((r) => r[0] ?? null),

  addView: (data: NewPostView) =>
    db.insert(postViews).values(data).returning().then((r) => r[0]),
};
