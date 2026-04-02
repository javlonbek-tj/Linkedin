import { relations } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { posts } from './post.schema';
import { comments } from './comment.schema';
import { postLikes, postDislikes, postViews } from './post-interaction.schema';
import { userFollows, userBlocks, userViews } from './social.schema';
import { refreshTokens, otps } from './auth.schema';

export const roleEnum = pgEnum('role', ['Admin', 'User', 'Editor']);
export const awardEnum = pgEnum('user_award', ['Bronze', 'Silver', 'Gold']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  profilePhoto: text('profile_photo'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isBlocked: boolean('is_blocked').notNull().default(false),
  role: roleEnum('role').notNull().default('Admin'),
  userAward: awardEnum('user_award').notNull().default('Bronze'),
  isActivated: boolean('is_activated').notNull().default(false),
  passwordChangedAt: timestamp('password_changed_at'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  comments: many(comments),
  refreshTokens: many(refreshTokens),
  otp: one(otps, { fields: [users.id], references: [otps.userId] }),
  likes: many(postLikes),
  dislikes: many(postDislikes),
  postViews: many(postViews),
  followers: many(userFollows, { relationName: 'following' }),
  following: many(userFollows, { relationName: 'follower' }),
  blockedUsers: many(userBlocks, { relationName: 'blocker' }),
  blockedBy: many(userBlocks, { relationName: 'blocked' }),
  profileViews: many(userViews, { relationName: 'profileOwner' }),
  viewedProfiles: many(userViews, { relationName: 'viewer' }),
}));

// Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'createdAt'>>;

export type UserWithRelations = User & {
  posts: InferSelectModel<typeof posts>[];
  comments: InferSelectModel<typeof comments>[];
  followers: (InferSelectModel<typeof userFollows> & { follower: User })[];
  following: (InferSelectModel<typeof userFollows> & { following: User })[];
};
