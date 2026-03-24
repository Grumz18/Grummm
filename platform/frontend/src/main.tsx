import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  clearCurrentAccessToken,
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
    window.localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_ACCESS_TOKEN_EXPIRES_AT_STORAGE_KEY);
    clearCurrentAccessToken();
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (parsed.isAuthenticated !== true) {
      return fallback;
    }

    if (parsed.role === "Admin" || parsed.role === "User") {
      return {
        isAuthenticated: true,
        role: parsed.role,
        adminEmail: parsed.adminEmail
      };
    }
    return { isAuthenticated: true, adminEmail: parsed.adminEmail };
  } catch {
    return fallback;
  }
}

function finishPreload() {
  const loader = document.getElementById("app-preloader");
  document.body.classList.add("app-ready");

  if (!loader) {
    return;
  }

  window.setTimeout(() => {
    loader.remove();
  }, 420);
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouter session={getInitialSession()} />
  </StrictMode>
);

window.requestAnimationFrame(() => {
  window.requestAnimationFrame(() => {
    finishPreload();
  });
});
