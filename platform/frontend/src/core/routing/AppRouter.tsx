import { createElement, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthSessionProvider, type AuthSession } from "../auth/auth-session";
import { PrivateAppLayout, PublicLayout } from "../layouts";
import { moduleRegistry } from "../plugin-registry";
import { ProtectedRoute } from "./ProtectedRoute";

function PublicHome(): ReactNode {
  return <div>Public Home</div>;
}

function PublicProjects(): ReactNode {
  return <div>Public Projects</div>;
}

function PublicProjectDetails(): ReactNode {
  return <div>Public Project Details</div>;
}

function PrivateAppHome(): ReactNode {
  return <div>Private App Home</div>;
}

function NotFound(): ReactNode {
  return <div>Not Found</div>;
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

export function AppRouter({ session = { isAuthenticated: false } }: AppRouterProps) {
  return (
    <AuthSessionProvider value={session}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={withPublicLayout(<PublicHome />)} />
          <Route path="/projects" element={withPublicLayout(<PublicProjects />)} />
          <Route path="/projects/:id" element={withPublicLayout(<PublicProjectDetails />)} />

          {publicModuleRoutes.map((route) => (
            <Route
              key={route.id}
              path={route.path}
              element={withPublicLayout(createElement(route.component))}
            />
          ))}

          <Route
            path="/app"
            element={
              <ProtectedRoute adminOnly>
                {withPrivateLayout(<PrivateAppHome />)}
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
      </BrowserRouter>
    </AuthSessionProvider>
  );
}
