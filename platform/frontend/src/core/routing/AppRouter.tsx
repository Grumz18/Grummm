import { AnimatePresence } from "framer-motion";
import { createElement, useMemo, useState, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { LandingPage } from "../../public/pages/LandingPage";
import { ProjectDetailPage } from "../../public/pages/ProjectDetailPage";
import { ProjectsPage } from "../../public/pages/ProjectsPage";
import { PreferencesProvider } from "../../public/preferences";
import {
  AUTH_ACCESS_TOKEN_STORAGE_KEY,
  AUTH_SESSION_STORAGE_KEY,
  AuthSessionProvider,
  type AuthSession,
  type AuthSessionContextValue,
  type SignInPayload
} from "../auth/auth-session";
import { AdminProjectsWorkspace } from "../pages/AdminProjectsWorkspace";
import { AdminLandingContentPage } from "../pages/AdminLandingContentPage";
import { AdminLoginPage } from "../pages/AdminLoginPage";
import { AdminSecurityPage } from "../pages/AdminSecurityPage";
import { DynamicProjectViewer } from "../pages/DynamicProjectViewer";
import { PrivateAppLayout, PublicLayout } from "../layouts";
import { moduleRegistry } from "../plugin-registry";
import { ProtectedRoute } from "./ProtectedRoute";

function PrivateAppHome(): ReactNode {
  return (
    <section className="admin-home">
      <header className="admin-home__header">
        <h1>Центр администрирования</h1>
        <p>Приватная зона для управления модулями и административных действий.</p>
      </header>
      <div className="admin-home__grid">
        <article>
          <h3>Посты</h3>
          <p>Управление постами портфолио без runtime-загрузки шаблонов.</p>
        </article>
        <article>
          <h3>Безопасность</h3>
          <p>AdminOnly-доступ, разделение API-зон, аудит и correlation-id.</p>
        </article>
      </div>
    </section>
  );
}

function NotFound(): ReactNode {
  return <div>Страница не найдена</div>;
}

const publicModuleRoutes = moduleRegistry
  .filter((m) => m.publicPage)
  .map((m) => ({ path: m.publicPage!.path, component: m.publicPage!.component, id: `${m.id}-public` }));

const privateModuleRoutes = moduleRegistry
  .filter((m) => m.privateApp)
  .map((m) => ({ path: m.privateApp!.path, component: m.privateApp!.component, id: `${m.id}-private` }));

const extraModuleRoutes = moduleRegistry.flatMap((m) =>
  (m.routes ?? []).map((r, idx) => ({ path: r.path, component: r.component, id: `${m.id}-route-${idx}` }))
);

export interface AppRouterProps {
  session?: AuthSession;
}

function withPublicLayout(node: ReactNode): ReactNode {
  return <PublicLayout>{node}</PublicLayout>;
}

function withPrivateLayout(node: ReactNode): ReactNode {
  return <PrivateAppLayout>{node}</PrivateAppLayout>;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={withPublicLayout(<LandingPage />)} />
        <Route path="/login" element={withPublicLayout(<AdminLoginPage />)} />
        <Route path="/projects" element={withPublicLayout(<ProjectsPage />)} />

        {publicModuleRoutes.map((route) => (
          <Route
            key={route.id}
            path={route.path}
            element={withPublicLayout(createElement(route.component))}
          />
        ))}

        <Route path="/projects/:id" element={withPublicLayout(<ProjectDetailPage />)} />

        <Route
          path="/app"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<PrivateAppHome />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/projects"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<AdminProjectsWorkspace />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/posts"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<AdminProjectsWorkspace mode="posts" />)}
            </ProtectedRoute>
          }
        />
        <Route
          path="/app/content"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<AdminLandingContentPage />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/security"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<AdminSecurityPage />)}
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/:slug"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<DynamicProjectViewer />)}
            </ProtectedRoute>
          }
        />

        {privateModuleRoutes.map((route) => (
          <Route
            key={route.id}
            path={route.path}
            element={
              <ProtectedRoute adminOnly>
                {withPrivateLayout(createElement(route.component))}
              </ProtectedRoute>
            }
          />
        ))}

        {extraModuleRoutes.map((route) => (
          <Route
            key={route.id}
            path={route.path}
            element={
              route.path.startsWith("/app") ? (
                <ProtectedRoute adminOnly>
                  {withPrivateLayout(createElement(route.component))}
                </ProtectedRoute>
              ) : (
                withPublicLayout(createElement(route.component))
              )
            }
          />
        ))}

        <Route
          path="/app/*"
          element={
            <ProtectedRoute adminOnly>
              {withPrivateLayout(<Navigate to="/app" replace />)}
            </ProtectedRoute>
          }
        />
        <Route path="*" element={withPublicLayout(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
}

export function AppRouter({ session = { isAuthenticated: false } }: AppRouterProps) {
  const [authSession, setAuthSession] = useState<AuthSession>(session);

  const sessionValue = useMemo<AuthSessionContextValue>(() => ({
    ...authSession,
    signIn: (payload: SignInPayload) => {
      const next: AuthSession = { isAuthenticated: true, role: payload.role, accessToken: payload.accessToken };
      setAuthSession(next);
      try {
        window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, role: payload.role }));
        window.localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, payload.accessToken);
      } catch {
        // ignore storage errors
      }
    },
    signOut: () => {
      setAuthSession({ isAuthenticated: false });
      try {
        window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
        window.localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
  }), [authSession]);
  return (
    <AuthSessionProvider value={sessionValue}>
      <PreferencesProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </PreferencesProvider>
    </AuthSessionProvider>
  );
}
