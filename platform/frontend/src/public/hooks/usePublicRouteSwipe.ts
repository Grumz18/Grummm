import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SWIPEABLE_PUBLIC_ROUTES = ["/", "/projects", "/posts"] as const;
const HORIZONTAL_THRESHOLD_PX = 72;
const VERTICAL_TOLERANCE_PX = 84;
const HORIZONTAL_DOMINANCE_RATIO = 1.25;
const MAX_GESTURE_DURATION_MS = 900;
const MOBILE_MEDIA_QUERY = "(max-width: 959.98px) and (pointer: coarse)";

interface TouchPoint {
  x: number;
  y: number;
  at: number;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      [
        "button",
        "input",
        "textarea",
        "select",
        "summary",
        "label",
        "iframe",
        "video",
        "audio",
        "[role='button']",
        "[contenteditable='true']",
        "[data-no-route-swipe]"
      ].join(",")
    )
  );
}

function getSwipeTarget(pathname: string, direction: "prev" | "next"): string | null {
  const currentIndex = SWIPEABLE_PUBLIC_ROUTES.indexOf(pathname as (typeof SWIPEABLE_PUBLIC_ROUTES)[number]);
  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  return SWIPEABLE_PUBLIC_ROUTES[nextIndex] ?? null;
}

export function usePublicRouteSwipe(rootRef: RefObject<HTMLElement>) {
  const location = useLocation();
  const navigate = useNavigate();
  const touchStartRef = useRef<TouchPoint | null>(null);
  const pendingScrollResetRef = useRef(false);
  const enabled = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return (
      window.matchMedia?.(MOBILE_MEDIA_QUERY).matches
      && SWIPEABLE_PUBLIC_ROUTES.includes(location.pathname as (typeof SWIPEABLE_PUBLIC_ROUTES)[number])
    );
  }, [location.pathname]);

  useEffect(() => {
    if (!pendingScrollResetRef.current) {
      return;
    }

    pendingScrollResetRef.current = false;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) {
      return;
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1 || isInteractiveTarget(event.target)) {
        touchStartRef.current = null;
        return;
      }

      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        at: Date.now()
      };
    }

    function handleTouchEnd(event: TouchEvent) {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (!start || event.changedTouches.length === 0) {
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const durationMs = Date.now() - start.at;

      if (
        durationMs > MAX_GESTURE_DURATION_MS
        || absDeltaX < HORIZONTAL_THRESHOLD_PX
        || absDeltaY > VERTICAL_TOLERANCE_PX
        || absDeltaX < absDeltaY * HORIZONTAL_DOMINANCE_RATIO
      ) {
        return;
      }

      const nextPath = getSwipeTarget(location.pathname, deltaX < 0 ? "next" : "prev");
      if (!nextPath || nextPath === location.pathname) {
        return;
      }

      pendingScrollResetRef.current = true;
      navigate(nextPath);
    }

    root.addEventListener("touchstart", handleTouchStart, { passive: true });
    root.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      root.removeEventListener("touchstart", handleTouchStart);
      root.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, location.pathname, navigate, rootRef]);
}
