import type { User } from '../db/schema';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  user: Pick<
    User,
    | 'id'
    | 'firstname'
    | 'lastname'
    | 'username'
    | 'email'
    | 'isActivated'
    | 'role'
  >;
};
