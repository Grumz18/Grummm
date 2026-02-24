import type { ReactNode } from "react";

interface PrivateAppLayoutProps {
  children: ReactNode;
}

export function PrivateAppLayout({ children }: PrivateAppLayoutProps) {
  return (
    <div data-layout="private-app">
      <header>
        <strong>Private App</strong>
      </header>
      <div>
        <aside>App Navigation</aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
