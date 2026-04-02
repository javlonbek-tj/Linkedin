import { eq } from 'drizzle-orm';
import { db } from '../index';
import { posts, type NewPost, type UpdatePost } from '../schema';

export const postQueries = {
  findAll: () => db.select().from(posts),

  findById: (id: string) =>
    db.select().from(posts).where(eq(posts.id, id)).then((r) => r[0] ?? null),

  findByUser: (userId: string) =>
    db.select().from(posts).where(eq(posts.userId, userId)),

  findByCategory: (categoryId: string) =>
    db.select().from(posts).where(eq(posts.categoryId, categoryId)),

  findWithRelations: (id: string) =>
    db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: {
        user: true,
        category: true,
        comments: { with: { user: true } },
        likes: true,
        dislikes: true,
        views: true,
      },
    }),

  create: (data: NewPost) =>
    db.insert(posts).values(data).returning().then((r) => r[0]),

  update: (id: string, data: UpdatePost) =>
    db.update(posts).set(data).where(eq(posts.id, id)).returning().then((r) => r[0] ?? null),

  delete: (id: string) =>
    db.delete(posts).where(eq(posts.id, id)).returning().then((r) => r[0] ?? null),
};
