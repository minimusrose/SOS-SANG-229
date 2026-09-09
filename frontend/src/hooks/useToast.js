import { useCallback, useEffect, useRef, useState } from "react";

export default function useToast(durationMs = 4200) {
  const [message, setMessage] = useState("");
  const timerRef = useRef(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setMessage("");
  }, []);

  const show = useCallback(
    (nextMessage) => {
      setMessage(nextMessage);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setMessage("");
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  return { message, show, dismiss };
}
