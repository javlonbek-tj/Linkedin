import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { comments, posts } from '../db/schema';
import { AppError } from '../utils/appError';
import type { NewComment, UpdateComment } from '../db/schema';
import { createNotification } from './notification.service';

export async function getCommentsByPost(postId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId));
  if (!post) throw new AppError('Post not found.', 404);

  return db.select().from(comments).where(eq(comments.postId, postId));
}

export async function createComment(data: NewComment) {
  const [post] = await db.select().from(posts).where(eq(posts.id, data.postId));
  if (!post) throw new AppError('Post not found.', 404);

  const [comment] = await db.insert(comments).values(data).returning();

  // Notify parent comment author on a reply, otherwise notify the post author
  if (data.parentCommentId) {
    const [parentComment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, data.parentCommentId));

    if (parentComment && parentComment.userId !== data.userId) {
      await createNotification({
        recipientId: parentComment.userId,
        senderId: data.userId,
        type: 'comment_reply',
        entityId: comment.id,
      });
    }
  } else if (post.userId !== data.userId) {
    await createNotification({
      recipientId: post.userId,
      senderId: data.userId,
      type: 'post_comment',
      entityId: comment.id,
    });
  }

  return comment;
}

export async function updateComment(
  id: string,
  userId: string,
  data: UpdateComment,
) {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id));
  if (!comment) throw new AppError('Comment not found.', 404);
  if (comment.userId !== userId)
    throw new AppError('You are not allowed to update this comment.', 403);

  const [updated] = await db
    .update(comments)
    .set(data)
    .where(eq(comments.id, id))
    .returning();
  return updated;
}

export async function removeComment(id: string, userId: string) {
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id));
  if (!comment) throw new AppError('Comment not found.', 404);
  if (comment.userId !== userId)
    throw new AppError('You are not allowed to delete this comment.', 403);

  const [deleted] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning();
  return deleted;
}
