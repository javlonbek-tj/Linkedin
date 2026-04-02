import type { User } from '../db/schema';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: Pick<
    User,
    'id' | 'firstname' | 'lastname' | 'email' | 'isActivated' | 'role'
  >;
};
