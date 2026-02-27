import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./core/routing";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element '#root' was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AppRouter session={{ isAuthenticated: false }} />
  </StrictMode>
);
