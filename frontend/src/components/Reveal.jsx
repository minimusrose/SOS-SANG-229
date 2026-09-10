import useReveal from "../hooks/useReveal.js";

/**
 * Reveals a single block: rises 20px + fades in once it enters the viewport.
 * Falls back to visible immediately when motion is reduced or unsupported.
 */
export function Reveal({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, shown] = useReveal();
  return (
    <Tag
      ref={ref}
      className={`${shown ? "reveal-in" : "reveal-init"} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * Reveals its direct children in sequence, 80ms apart, once the group enters
 * the viewport. Keep layout classes (grid, flex…) on this element.
 */
export function RevealGroup({ as: Tag = "div", className = "", children, ...rest }) {
  const [ref, shown] = useReveal();
  return (
    <Tag
      ref={ref}
      data-shown={shown}
      className={`reveal-group ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
