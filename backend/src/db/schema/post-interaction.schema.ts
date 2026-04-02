import { relations } from 'drizzle-orm';
import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users } from './user.schema';
import { posts } from './post.schema';

export const postLikes = pgTable('post_likes', {
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postDislikes = pgTable('post_dislikes', {
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postViews = pgTable('post_views', {
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const postDislikesRelations = relations(postDislikes, ({ one }) => ({
  post: one(posts, { fields: [postDislikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postDislikes.userId], references: [users.id] }),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(posts, { fields: [postViews.postId], references: [posts.id] }),
  user: one(users, { fields: [postViews.userId], references: [users.id] }),
}));

// Types
export type PostLike = InferSelectModel<typeof postLikes>;
export type PostDislike = InferSelectModel<typeof postDislikes>;
export type PostView = InferSelectModel<typeof postViews>;
export type NewPostLike = InferInsertModel<typeof postLikes>;
export type NewPostDislike = InferInsertModel<typeof postDislikes>;
export type NewPostView = InferInsertModel<typeof postViews>;
