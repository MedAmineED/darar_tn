/**
 * The access token is kept in memory only (never localStorage) to limit XSS
 * exposure. The refresh token lives in an httpOnly cookie managed by the API.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: (): string | null => accessToken,
  set: (token: string | null): void => {
    accessToken = token;
  },
};
