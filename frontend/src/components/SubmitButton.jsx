import { useEffect, useState } from "react";
import Spinner from "./Spinner.jsx";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold text-white shadow-soft transition duration-micro ease-soft-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        style={{
          strokeDasharray: 1,
          strokeDashoffset: 1,
          animation: "draw-check 420ms cubic-bezier(.22,1,.36,1) forwards",
        }}
      />
    </svg>
  );
}

/**
 * Primary submit button with three states (plan lot 2, #5 & #6):
 *   - pending : locked + spinner + "Envoi en cours…", blocks a second submit
 *   - success : turns green with a drawn check, reverts on its own after 2.4s
 *   - idle    : behaves like `.btn-primary`
 *
 * `success` is a level prop: raise it once the request resolves; the button
 * clears the celebration itself.
 */
export default function SubmitButton({
  pending = false,
  success = false,
  disabled = false,
  pendingLabel = "Envoi en cours…",
  className = "",
  children,
  ...rest
}) {
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!success) return undefined;
    setCelebrate(true);
    const timer = window.setTimeout(() => setCelebrate(false), 2400);
    return () => window.clearTimeout(timer);
  }, [success]);

  if (pending) {
    return (
      <button
        type="submit"
        className={`${BASE} cursor-wait bg-primary-dark/80 ${className}`}
        disabled
        aria-busy="true"
        {...rest}
      >
        <Spinner />
        {pendingLabel}
      </button>
    );
  }

  if (celebrate) {
    return (
      <button
        type="submit"
        className={`${BASE} animate-pop cursor-default bg-success ${className}`}
        disabled
        {...rest}
      >
        <CheckIcon />
        {children}
      </button>
    );
  }

  return (
    <button
      type="submit"
      className={`${BASE} bg-primary-dark hover:bg-primary-strong disabled:cursor-not-allowed disabled:bg-accent disabled:shadow-none ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
