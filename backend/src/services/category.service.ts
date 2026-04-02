import { eq } from 'drizzle-orm';
import { db } from '../db/db';
import { categories } from '../db/schema';
import { AppError } from '../utils/appError';
import type { NewCategory, UpdateCategory } from '../db/schema';

export async function getAllCategories() {
  return db.select().from(categories);
}

export async function getCategoryById(id: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  if (!category) throw new AppError('Category not found.', 404);
  return category;
}

export async function createCategory(data: NewCategory) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, data.name));
  if (existing) throw new AppError('A category with this name already exists.', 409);

  const [category] = await db.insert(categories).values(data).returning();
  return category;
}

export async function updateCategory(id: string, data: UpdateCategory) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  if (!existing) throw new AppError('Category not found.', 404);

  if (data.name) {
    const [nameConflict] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, data.name));
    if (nameConflict && nameConflict.id !== id)
      throw new AppError('A category with this name already exists.', 409);
  }

  const [category] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();
  return category;
}

export async function removeCategory(id: string) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));
  if (!existing) throw new AppError('Category not found.', 404);

  const [category] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning();
  return category;
}
