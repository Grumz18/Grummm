import type { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div data-layout="public">
      <header>
        <strong>Public Area</strong>
      </header>
      <main>{children}</main>
      <footer>
        <small>Public Footer</small>
      </footer>
    </div>
  );
}
