import { eq } from 'drizzle-orm';
import { db } from '../index';
import { categories, type NewCategory, type UpdateCategory } from '../schema';

export const categoryQueries = {
  findAll: () => db.select().from(categories),

  findById: (id: string) =>
    db.select().from(categories).where(eq(categories.id, id)).then((r) => r[0] ?? null),

  findByName: (name: string) =>
    db.select().from(categories).where(eq(categories.name, name)).then((r) => r[0] ?? null),

  create: (data: NewCategory) =>
    db.insert(categories).values(data).returning().then((r) => r[0]),

  update: (id: string, data: UpdateCategory) =>
    db.update(categories).set(data).where(eq(categories.id, id)).returning().then((r) => r[0] ?? null),

  delete: (id: string) =>
    db.delete(categories).where(eq(categories.id, id)).returning().then((r) => r[0] ?? null),
};
