import { useEffect, useState } from "react";

/**
 * Returns true if the current viewport is phone-sized. Reacts to live
 * resize/orientation changes (so rotating the phone or shrinking the
 * desktop window flips the shell).
 *
 * Default breakpoint: 768px (anything narrower = mobile). Matches
 * Tailwind's `md` breakpoint convention.
 */
export function useIsMobile(maxWidthPx = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${maxWidthPx}px)`).matches;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [maxWidthPx]);

  return isMobile;
}
