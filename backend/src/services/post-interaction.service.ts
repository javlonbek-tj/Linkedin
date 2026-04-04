import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { posts, postReactions, postViews } from '../db/schema';
import { AppError } from '../utils/appError';
import type { NewPostReaction } from '../db/schema';
import { createNotification } from './notification.service';

export async function reactToPost(postId: string, userId: string, type: NewPostReaction['type']) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [reaction] = await db
    .insert(postReactions)
    .values({ postId, userId, type })
    .onConflictDoUpdate({
      target: [postReactions.postId, postReactions.userId],
      set: { type },
    })
    .returning();

  if (post.userId !== userId) {
    await createNotification({
      recipientId: post.userId,
      senderId: userId,
      type: 'post_reaction',
      entityId: postId,
    });
  }

  return reaction;
}

export async function removeReaction(postId: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [reaction] = await db
    .delete(postReactions)
    .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)))
    .returning();
  return reaction;
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
