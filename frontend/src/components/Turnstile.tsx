import { useEffect, useRef, useCallback } from "react";

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

let scriptLoading = false;
let scriptLoaded = false;

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.turnstile) {
      scriptLoaded = true;
      resolve();
      return;
    }

    if (scriptLoaded) {
      resolve();
      return;
    }

    if (scriptLoading) {
      // Wait for existing load
      const check = setInterval(() => {
        if (window.turnstile) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      return;
    }

    scriptLoading = true;
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = false;
    };
    document.head.appendChild(script);
  });
}

export default function Turnstile({ siteKey, onVerify, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onVerify, onError, onExpire });

  // Keep callbacks up to date without causing re-renders
  callbacksRef.current = { onVerify, onError, onExpire };

  const handleVerify = useCallback((token: string) => {
    callbacksRef.current.onVerify(token);
  }, []);

  const handleError = useCallback(() => {
    callbacksRef.current.onError?.();
  }, []);

  const handleExpire = useCallback(() => {
    callbacksRef.current.onExpire?.();
  }, []);

  useEffect(() => {
    let mounted = true;

    const initWidget = async () => {
      await loadTurnstileScript();

      if (!mounted || !containerRef.current || !window.turnstile) return;

      // Don't re-create if widget already exists
      if (widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: handleVerify,
        "error-callback": handleError,
        "expired-callback": handleExpire,
        theme: "auto",
        size: "normal",
      });
    };

    initWidget();

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, handleVerify, handleError, handleExpire]);

  return (
    <div className="my-4 flex justify-center">
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
