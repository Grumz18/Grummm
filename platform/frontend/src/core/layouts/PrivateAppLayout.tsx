import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { logoutAdmin } from "../auth/auth-api";
import { useAuthSession } from "../auth/auth-session";

interface PrivateAppLayoutProps {
  children: ReactNode;
}

export function PrivateAppLayout({ children }: PrivateAppLayoutProps) {
  const auth = useAuthSession();
  const navItems = [
    { to: "/app", label: "Обзор", end: true },
    { to: "/app/projects", label: "Проекты" },
    { to: "/app/posts", label: "Посты" },
    { to: "/app/content", label: "Контент главной" },
    { to: "/app/security", label: "Безопасность" }
  ];

  return (
    <div data-layout="private-app" className="private-layout">
      <header className="private-layout__header">
        <strong>Админ-панель</strong>
        <div className="private-layout__header-actions">
          <NavLink className="private-layout__public-link" to="/projects">
            Публичное портфолио
          </NavLink>
          <button
            type="button"
            className="private-layout__logout-button"
            onClick={() => {
              void logoutAdmin(auth.accessToken).finally(() => auth.signOut());
            }}
          >
            Выйти
          </button>
        </div>
      </header>
      <div className="private-layout__shell">
        <aside className="private-layout__aside">
          <h2>Навигация</h2>
          <nav>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "private-nav-link private-nav-link--active" : "private-nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="private-layout__main">{children}</main>
      </div>
    </div>
  );
}
