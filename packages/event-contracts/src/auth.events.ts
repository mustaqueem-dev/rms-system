// packages/event-contracts/src/auth.events.ts

export const AUTH_EVENTS = {
  USER_REGISTERED:    'auth.user.registered.v1',
  USER_LOGGED_IN:     'auth.user.logged_in.v1',
  PASSWORD_CHANGED:   'auth.password.changed.v1',
  TOKEN_REFRESHED:    'auth.token.refreshed.v1',
} as const;

export interface UserRegisteredPayload {
  userId:      string;
  email:       string;
  role:        string;
  franchiseId: string;
  branchId?:   string;
  occurredAt:  string;
}

export interface UserLoggedInPayload {
  userId:      string;
  email:       string;
  role:        string;
  franchiseId: string;
  branchId?:   string;
  ipAddress?:  string;
  userAgent?:  string;
  occurredAt:  string;
}

export interface PasswordChangedPayload {
  userId:     string;
  occurredAt: string;
}
