import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface PrivateAppLayoutProps {
  children: ReactNode;
}

export function PrivateAppLayout({ children }: PrivateAppLayoutProps) {
  const navItems = [
    { to: "/app", label: "Overview", end: true },
    { to: "/app/projects", label: "Projects" },
    { to: "/app/tasks", label: "Tasks" },
    { to: "/app/tasks/board", label: "Board" },
    { to: "/app/tasks/create", label: "Create" }
  ];

  return (
    <div data-layout="private-app" className="private-layout">
      <header className="private-layout__header">
        <strong>Admin Workspace</strong>
        <NavLink className="private-layout__public-link" to="/projects">
          Public Portfolio
        </NavLink>
      </header>
      <div className="private-layout__shell">
        <aside className="private-layout__aside">
          <h2>Navigation</h2>
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
