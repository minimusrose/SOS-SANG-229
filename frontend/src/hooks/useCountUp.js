import { useEffect, useRef, useState } from "react";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Counts from 0 up to `target` once, on mount. Skips the animation when the
 *  OS asks to reduce motion. */
export default function useCountUp(target, { durationMs = 900 } = {}) {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      setValue(target);
      return undefined;
    }
    started.current = true;
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(target * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}
