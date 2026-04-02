import { eq } from 'drizzle-orm';
import { db } from '../index';
import { comments, type NewComment, type UpdateComment } from '../schema';

export const commentQueries = {
  findById: (id: string) =>
    db.select().from(comments).where(eq(comments.id, id)).then((r) => r[0] ?? null),

  findByPost: (postId: string) =>
    db.select().from(comments).where(eq(comments.postId, postId)),

  findByUser: (userId: string) =>
    db.select().from(comments).where(eq(comments.userId, userId)),

  create: (data: NewComment) =>
    db.insert(comments).values(data).returning().then((r) => r[0]),

  update: (id: string, data: UpdateComment) =>
    db.update(comments).set(data).where(eq(comments.id, id)).returning().then((r) => r[0] ?? null),

  delete: (id: string) =>
    db.delete(comments).where(eq(comments.id, id)).returning().then((r) => r[0] ?? null),
};
