/**
 * Login URLs used by segment layouts ({@link RequireAuth}).
 * JWT lives in localStorage — Edge `middleware` cannot enforce auth; layouts centralize redirects instead.
 */
export const LOGIN_PATH = {
  customer: '/login/customer',
  seller: '/login/seller',
  rider: '/login/rider',
} as const;
