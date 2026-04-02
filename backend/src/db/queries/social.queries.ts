import { eq, and } from 'drizzle-orm';
import { db } from '../index';
import {
  userFollows,
  userBlocks,
  userViews,
  type NewUserFollow,
  type NewUserBlock,
  type NewUserView,
} from '../schema';

export const socialQueries = {
  follow: (data: NewUserFollow) =>
    db.insert(userFollows).values(data).returning().then((r) => r[0]),

  unfollow: (followerId: string, followingId: string) =>
    db
      .delete(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
      .returning()
      .then((r) => r[0] ?? null),

  isFollowing: (followerId: string, followingId: string) =>
    db
      .select()
      .from(userFollows)
      .where(and(eq(userFollows.followerId, followerId), eq(userFollows.followingId, followingId)))
      .then((r) => r.length > 0),

  block: (data: NewUserBlock) =>
    db.insert(userBlocks).values(data).returning().then((r) => r[0]),

  unblock: (blockerId: string, blockedId: string) =>
    db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)))
      .returning()
      .then((r) => r[0] ?? null),

  isBlocked: (blockerId: string, blockedId: string) =>
    db
      .select()
      .from(userBlocks)
      .where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)))
      .then((r) => r.length > 0),

  addProfileView: (data: NewUserView) =>
    db.insert(userViews).values(data).returning().then((r) => r[0]),
};
