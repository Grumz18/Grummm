import { useLayoutEffect, type RefObject } from "react";

export function useGsapEnhancements(rootRef: RefObject<HTMLElement>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    // Redesign baseline disables JS-driven motion and parallax.
    const selectors = [
      "[data-gsap='reveal']",
      "[data-gsap='stagger'] > *",
      "[data-gsap-post-block]",
      "[data-gsap-button]",
      "[data-gsap-hero-parallax]"
    ];

    for (const selector of selectors) {
      const nodes = root.querySelectorAll<HTMLElement>(selector);
      for (const node of nodes) {
        node.style.willChange = "auto";
        node.style.removeProperty("transform");
        node.style.removeProperty("opacity");
        node.style.removeProperty("filter");
      }
    }
  }, deps);
}
