import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  type AuthSession
} from "./core/auth/auth-session";
import { AppRouter } from "./core/routing";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' was not found.");
}

function getInitialSession(): AuthSession {
  const fallback: AuthSession = { isAuthenticated: false };

  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    const accessToken = window.localStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY) ?? undefined;
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (parsed.isAuthenticated !== true) {
      return fallback;
    }

    if (parsed.role === "Admin" || parsed.role === "User") {
      return { isAuthenticated: true, role: parsed.role, accessToken };
    }
    return { isAuthenticated: true, accessToken };
    return { isAuthenticated: true };
  } catch {
    return fallback;
  }
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouter session={getInitialSession()} />
  </StrictMode>
);
