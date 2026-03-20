import { Outlet, useLocation } from "react-router-dom";
import { CookieNotice } from "../../public/components/CookieNotice";
import { PublicHeader } from "../../public/components/PublicHeader";
import { useGsapEnhancements } from "../../shared/ui/useGsapEnhancements";
import { useRef } from "react";

export function PublicLayout() {
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useGsapEnhancements(rootRef, [location.pathname]);

  return (
    <div ref={rootRef} data-layout="public" className="public-layout">
      <div className="public-layout__shell">
        <PublicHeader />
        <main className="public-layout__content">
          <div className="public-layout__main">
            <Outlet />
          </div>
        </main>
        <CookieNotice />
      </div>
    </div>
  );
}
