import { createContext, useContext } from "react";

export type UserRole = "Admin" | "User";

export interface AuthSession {
  isAuthenticated: boolean;
  role?: UserRole;
}

const defaultSession: AuthSession = {
  isAuthenticated: false
};

const AuthSessionContext = createContext<AuthSession>(defaultSession);

export const AuthSessionProvider = AuthSessionContext.Provider;

export function useAuthSession(): AuthSession {
  return useContext(AuthSessionContext);
}
