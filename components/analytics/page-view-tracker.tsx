"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView, trackSectionDwell } from "@/lib/analytics-client";

/**
 * Customer Intelligence & Growth Analytics — storefront-only page-view and
 * dwell-time tracking. Mounted once in app/layout.tsx (the root layout
 * wraps every route, including /admin), so it deliberately excludes
 * /admin and /api itself: this tracks customer/visitor behavior, not
 * staff dashboard usage.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const enteredAt = useRef(0);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    trackPageView(pathname);
    enteredAt.current = Date.now();

    return () => {
      trackSectionDwell(enteredAt.current, { path: pathname });
    };
  }, [pathname]);

  return null;
}
