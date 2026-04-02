import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './user.schema';
import { categories } from './category.schema';
import { comments } from './comment.schema';
import { postLikes, postDislikes, postViews } from './post-interaction.schema';

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  photo: text('photo').notNull(),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  comments: many(comments),
  likes: many(postLikes),
  dislikes: many(postDislikes),
  views: many(postViews),
}));

// Types
export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;
export type UpdatePost = Partial<Omit<NewPost, 'id' | 'createdAt'>>;

export type PostWithRelations = Post & {
  user: InferSelectModel<typeof users>;
  category: InferSelectModel<typeof categories>;
  comments: (InferSelectModel<typeof comments> & { user: InferSelectModel<typeof users> })[];
  likes: InferSelectModel<typeof postLikes>[];
  dislikes: InferSelectModel<typeof postDislikes>[];
  views: InferSelectModel<typeof postViews>[];
};
