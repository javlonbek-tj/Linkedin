import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { posts, postLikes, postDislikes, postViews } from '../db/schema';
import { AppError } from '../utils/appError';

export async function likePost(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [like] = await db
    .insert(postLikes)
    .values({ postId, userId })
    .returning();
  return like;
}

export async function unlikePost(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [like] = await db
    .delete(postLikes)
    .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
    .returning();
  return like;
}

export async function dislikePost(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [dislike] = await db
    .insert(postDislikes)
    .values({ postId, userId })
    .returning();
  return dislike;
}

export async function undislikePost(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [dislike] = await db
    .delete(postDislikes)
    .where(
      and(eq(postDislikes.postId, postId), eq(postDislikes.userId, userId)),
    )
    .returning();
  return dislike;
}

export async function viewPost(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [view] = await db
    .insert(postViews)
    .values({ postId, userId })
    .returning();
  return view;
}
