import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal: returns `[ref, shown]`. Attach `ref` to a container and swap
 * its class between `.reveal-init` (hidden) and `.reveal-in` (animated) based on
 * `shown`.
 *
 * `shown` is guaranteed to become true even when the animation layer cannot run,
 * so content is never left invisible:
 *   - no IntersectionObserver support -> shown immediately
 *   - prefers-reduced-motion -> shown immediately
 *   - 2s safety timeout -> shown regardless
 */
export default function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (
      typeof IntersectionObserver === "undefined" ||
      (typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    ) {
      setShown(true);
      return undefined;
    }

    const safety = window.setTimeout(() => setShown(true), 2000);

    if (!node) {
      return () => window.clearTimeout(safety);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
          window.clearTimeout(safety);
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return [ref, shown];
}
