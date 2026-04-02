import { eq } from 'drizzle-orm';
import { db } from '../index';
import { users, type NewUser, type UpdateUser } from '../schema';

export const userQueries = {
  findAll: () => db.select().from(users),

  findById: (id: string) =>
    db.select().from(users).where(eq(users.id, id)).then((r) => r[0] ?? null),

  findByEmail: (email: string) =>
    db.select().from(users).where(eq(users.email, email)).then((r) => r[0] ?? null),

  findWithRelations: (id: string) =>
    db.query.users.findFirst({
      where: eq(users.id, id),
      with: {
        posts: true,
        comments: true,
        followers: true,
        following: true,
        blockedUsers: true,
        blockedBy: true,
        profileViews: true,
        viewedProfiles: true,
        likes: true,
        dislikes: true,
        postViews: true,
      },
    }),

  create: (data: NewUser) =>
    db.insert(users).values(data).returning().then((r) => r[0]),

  update: (id: string, data: UpdateUser) =>
    db.update(users).set(data).where(eq(users.id, id)).returning().then((r) => r[0] ?? null),

  delete: (id: string) =>
    db.delete(users).where(eq(users.id, id)).returning().then((r) => r[0] ?? null),
};
