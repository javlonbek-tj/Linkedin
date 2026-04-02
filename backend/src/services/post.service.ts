import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { posts, categories } from '../db/schema';
import { AppError } from '../utils/appError';
import type { NewPost, UpdatePost } from '../db/schema';

export async function getAllPosts() {
  return db.select().from(posts);
}

export async function getPostById(id: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) throw new AppError('Post not found.', 404);
  return post;
}

export async function getPostWithRelations(id: string) {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, id),
    with: {
      user: true,
      category: true,
      comments: { with: { user: true } },
      likes: true,
      dislikes: true,
      views: true,
    },
  });
  if (!post) throw new AppError('Post not found.', 404);
  return post;
}

export async function getPostsByUser(userId: string) {
  return db.select().from(posts).where(eq(posts.userId, userId));
}

export async function getPostsByCategory(categoryId: string) {
  return db.select().from(posts).where(eq(posts.categoryId, categoryId));
}

export async function createPost(data: NewPost) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, data.categoryId));
  if (!category) throw new AppError('Category not found.', 404);

  const [post] = await db.insert(posts).values(data).returning();
  return post;
}

export async function updatePost(id: string, userId: string, data: UpdatePost) {
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) throw new AppError('Post not found.', 404);
  if (post.userId !== userId)
    throw new AppError('You are not allowed to update this post.', 403);

  const [updated] = await db
    .update(posts)
    .set(data)
    .where(eq(posts.id, id))
    .returning();
  return updated;
}

export async function removePost(id: string, userId: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) throw new AppError('Post not found.', 404);
  if (post.userId !== userId)
    throw new AppError('You are not allowed to delete this post.', 403);

  const [deleted] = await db.delete(posts).where(eq(posts.id, id)).returning();
  return deleted;
}
