import { relations } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { posts } from './post.schema';
import { comments } from './comment.schema';
import { postReactions, postViews } from './post-interaction.schema';
import {
  connectionRequests,
  userFollows,
  userBlocks,
  userViews,
} from './social.schema';
import { refreshTokens, otps } from './auth.schema';
import { experiences } from './experience.schema';
import { educations } from './education.schema';
import { notifications } from './notification.schema';
import { conversationParticipants } from './message.schema';

export const userRole = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  username: text('username').notNull().unique(),
  profilePhoto: text('profile_photo'),
  headline: text('headline').default('LinkedIn User'),
  location: text('location'),
  about: text('about'),
  skills: text('skills').array().default([]),
  bannerImage: text('banner_image'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isBlocked: boolean('is_blocked').notNull().default(false),
  role: userRole('role').default('user').notNull(),
  isActivated: boolean('is_activated').notNull().default(false),
  passwordChangedAt: timestamp('password_changed_at'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  posts: many(posts),
  comments: many(comments),
  refreshTokens: many(refreshTokens),
  otp: one(otps, { fields: [users.id], references: [otps.userId] }),
  reactions: many(postReactions),
  postViews: many(postViews),
  sentConnectionRequests: many(connectionRequests, { relationName: 'sender' }),
  receivedConnectionRequests: many(connectionRequests, {
    relationName: 'receiver',
  }),
  following: many(userFollows, { relationName: 'follower' }),
  followers: many(userFollows, { relationName: 'following' }),
  blockedUsers: many(userBlocks, { relationName: 'blocker' }),
  blockedBy: many(userBlocks, { relationName: 'blocked' }),
  profileViews: many(userViews, { relationName: 'profileOwner' }),
  viewedProfiles: many(userViews, { relationName: 'viewer' }),
  experiences: many(experiences),
  educations: many(educations),
  notifications: many(notifications, { relationName: 'recipient' }),
  sentNotifications: many(notifications, { relationName: 'sender' }),
  conversations: many(conversationParticipants),
}));

// Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'createdAt'>>;
