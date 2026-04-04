import { eq, and } from 'drizzle-orm';
import { db } from '../db/db';
import {
  users,
  userFollows,
  userBlocks,
  userViews,
  connectionRequests,
} from '../db/schema';
import { AppError } from '../utils/appError';
import { createNotification } from './notification.service';

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

  if (profileOwnerId !== viewerId) {
    await createNotification({
      recipientId: profileOwnerId,
      senderId: viewerId,
      type: 'profile_view',
    });
  }

  return view;
}

// ── Connection requests ───────────────────────────────────────────────────────

export async function sendConnectionRequest(
  senderId: string,
  receiverId: string,
  message?: string,
) {
  if (senderId === receiverId)
    throw new AppError('You cannot connect with yourself.', 400);

  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, receiverId));
  if (!target) throw new AppError('User not found.', 404);

  const [existing] = await db
    .select()
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.senderId, senderId),
        eq(connectionRequests.receiverId, receiverId),
      ),
    );
  if (existing)
    throw new AppError('Connection request already sent.', 409);

  const [request] = await db
    .insert(connectionRequests)
    .values({ senderId, receiverId, message })
    .returning();

  await createNotification({
    recipientId: receiverId,
    senderId,
    type: 'connection_request',
    entityId: request.id,
  });

  return request;
}

export async function respondToConnectionRequest(
  id: string,
  userId: string,
  status: 'accepted' | 'rejected',
) {
  const [request] = await db
    .select()
    .from(connectionRequests)
    .where(eq(connectionRequests.id, id));
  if (!request) throw new AppError('Connection request not found.', 404);
  if (request.receiverId !== userId)
    throw new AppError('Not authorized.', 403);
  if (request.status !== 'pending')
    throw new AppError('This request has already been responded to.', 409);

  const [updated] = await db
    .update(connectionRequests)
    .set({ status })
    .where(eq(connectionRequests.id, id))
    .returning();

  if (status === 'accepted') {
    await createNotification({
      recipientId: request.senderId,
      senderId: userId,
      type: 'connection_accepted',
      entityId: id,
    });
  }

  return updated;
}

export async function withdrawConnectionRequest(id: string, userId: string) {
  const [request] = await db
    .select()
    .from(connectionRequests)
    .where(eq(connectionRequests.id, id));
  if (!request) throw new AppError('Connection request not found.', 404);
  if (request.senderId !== userId)
    throw new AppError('Not authorized.', 403);
  if (request.status !== 'pending')
    throw new AppError('Only pending requests can be withdrawn.', 409);

  const [deleted] = await db
    .delete(connectionRequests)
    .where(eq(connectionRequests.id, id))
    .returning();
  return deleted;
}

export async function getReceivedRequests(userId: string) {
  return db
    .select()
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.receiverId, userId),
        eq(connectionRequests.status, 'pending'),
      ),
    );
}

export async function getSentRequests(userId: string) {
  return db
    .select()
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.senderId, userId),
        eq(connectionRequests.status, 'pending'),
      ),
    );
}
