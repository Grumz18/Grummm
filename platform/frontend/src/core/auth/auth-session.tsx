import { createContext, useContext } from "react";

export type UserRole = "Admin" | "User";
export const AUTH_SESSION_STORAGE_KEY = "platform.auth.session";
export const AUTH_ACCESS_TOKEN_STORAGE_KEY = "platform.auth.accessToken";
export const AUTH_ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY = "platform.auth.accessTokenExpiresAtUtc";
let currentAccessToken: string | undefined;
let currentAccessTokenExpiresAtUtc: string | undefined;

export interface AuthSession {
  isAuthenticated: boolean;
  role?: UserRole;
  accessToken?: string;
  accessTokenExpiresAtUtc?: string;
  adminEmail?: string;
}

export interface SignInPayload {
  role: UserRole;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  adminEmail?: string;
}

export interface AuthSessionContextValue extends AuthSession {
  bootstrapping: boolean;
  signIn: (payload: SignInPayload) => void;
  signOut: () => void;
}

const defaultSession: AuthSessionContextValue = {
  isAuthenticated: false,
  bootstrapping: false,
  accessToken: undefined,
  signIn: () => undefined,
  signOut: () => undefined
};

const AuthSessionContext = createContext<AuthSessionContextValue>(defaultSession);

export const AuthSessionProvider = AuthSessionContext.Provider;
export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext);
}

export function setCurrentAccessToken(accessToken?: string, accessTokenExpiresAtUtc?: string): void {
  currentAccessToken = accessToken;
  currentAccessTokenExpiresAtUtc = accessTokenExpiresAtUtc;
}

export function clearCurrentAccessToken(): void {
  currentAccessToken = undefined;
  currentAccessTokenExpiresAtUtc = undefined;
}

export function getCurrentAccessToken(): string | undefined {
  return currentAccessToken;
}

export function getCurrentAccessTokenExpiresAtUtc(): string | undefined {
  return currentAccessTokenExpiresAtUtc;
}
