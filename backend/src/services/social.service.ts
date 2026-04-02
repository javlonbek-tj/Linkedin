import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import { users, userFollows, userBlocks, userViews } from '../db/schema';
import { AppError } from '../utils/appError';

export async function follow(followerId: string, followingId: string) {
  if (followerId === followingId)
    throw new AppError('You cannot follow yourself.', 400);

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, followingId));
  if (!target) throw new AppError('User not found.', 404);

  const [existing] = await db
    .select()
    .from(userFollows)
    .where(
      and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId),
      ),
    );
  if (existing) throw new AppError('You are already following this user.', 409);

  const [follow] = await db
    .insert(userFollows)
    .values({ followerId, followingId })
    .returning();
  return follow;
}

export async function unfollow(followerId: string, followingId: string) {
  if (followerId === followingId)
    throw new AppError('You cannot unfollow yourself.', 400);

  const [existing] = await db
    .select()
    .from(userFollows)
    .where(
      and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId),
      ),
    );
  if (!existing) throw new AppError('You are not following this user.', 409);

  const [deleted] = await db
    .delete(userFollows)
    .where(
      and(
        eq(userFollows.followerId, followerId),
        eq(userFollows.followingId, followingId),
      ),
    )
    .returning();
  return deleted;
}

export async function block(blockerId: string, blockedId: string) {
  if (blockerId === blockedId)
    throw new AppError('You cannot block yourself.', 400);

  const [target] = await db.select().from(users).where(eq(users.id, blockedId));
  if (!target) throw new AppError('User not found.', 404);

  const [existing] = await db
    .select()
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, blockedId),
      ),
    );
  if (existing) throw new AppError('You have already blocked this user.', 409);

  const [blocked] = await db
    .insert(userBlocks)
    .values({ blockerId, blockedId })
    .returning();
  return blocked;
}

export async function unblock(blockerId: string, blockedId: string) {
  if (blockerId === blockedId)
    throw new AppError('You cannot unblock yourself.', 400);

  const [existing] = await db
    .select()
    .from(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, blockedId),
      ),
    );
  if (!existing) throw new AppError('You have not blocked this user.', 409);

  const [deleted] = await db
    .delete(userBlocks)
    .where(
      and(
        eq(userBlocks.blockerId, blockerId),
        eq(userBlocks.blockedId, blockedId),
      ),
    )
    .returning();
  return deleted;
}

export async function viewProfile(profileOwnerId: string, viewerId: string) {
  const [profile] = await db
    .select()
    .from(users)
    .where(eq(users.id, profileOwnerId));
  if (!profile) throw new AppError('User not found.', 404);

  const [view] = await db
    .insert(userViews)
    .values({ profileOwnerId, viewerId })
    .returning();
  return view;
}
