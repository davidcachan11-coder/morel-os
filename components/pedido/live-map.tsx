"use client";

import { motion } from "framer-motion";
import { Store, Home } from "lucide-react";

// Stylized route path — not a real map, an abstract illustrated one (no external tiles).
const waypoints = [
  { x: 14, y: 22 },
  { x: 14, y: 42 },
  { x: 46, y: 42 },
  { x: 46, y: 66 },
  { x: 80, y: 66 },
  { x: 80, y: 84 },
];

function pointAt(progress: number) {
  const segments = waypoints.length - 1;
  const scaled = progress * segments;
  const i = Math.min(segments - 1, Math.floor(scaled));
  const t = scaled - i;
  const a = waypoints[i];
  const b = waypoints[i + 1];
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

const pathD = waypoints
  .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
  .join(" ");

const blocks = [
  { x: 22, y: 8, w: 14, h: 10 },
  { x: 4, y: 30, w: 6, h: 8 },
  { x: 24, y: 30, w: 16, h: 8 },
  { x: 54, y: 8, w: 18, h: 28 },
  { x: 54, y: 50, w: 12, h: 10 },
  { x: 70, y: 50, w: 12, h: 10 },
  { x: 4, y: 50, w: 36, h: 10 },
  { x: 88, y: 30, w: 8, h: 30 },
  { x: 60, y: 72, w: 14, h: 10 },
  { x: 4, y: 72, w: 28, h: 20 },
];

export function LiveMap({ progress, active }: { progress: number; active: boolean }) {
  const driver = pointAt(active ? progress : 0);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/70 bg-[#eef1ea] shadow-soft">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {blocks.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={1.5}
            className="fill-[#dfe4d8]"
          />
        ))}

        <path d={pathD} className="stroke-white" strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d={pathD}
          className="stroke-brand-navy/70"
          strokeWidth={1}
          strokeDasharray="2 2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {active && (
          <path
            d={pathD}
            pathLength={1}
            className="stroke-brand-green"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1"
            strokeDashoffset={1 - progress}
          />
        )}
      </svg>

      {/* Store pin */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${waypoints[0].x}%`, top: `${waypoints[0].y}%` }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-white shadow-soft">
          <Store className="h-3.5 w-3.5" />
        </div>
        <span className="mt-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-foreground shadow-soft">
          Sucursal Centro
        </span>
      </div>

      {/* Home pin */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${waypoints[waypoints.length - 1].x}%`, top: `${waypoints[waypoints.length - 1].y}%` }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange text-white shadow-soft">
          <Home className="h-3.5 w-3.5" />
        </div>
        <span className="mt-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-foreground shadow-soft">
          Tu casa
        </span>
      </div>

      {/* Driver */}
      {active && (
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          initial={{ left: `${driver.x}%`, top: `${driver.y}%` }}
          animate={{ left: `${driver.x}%`, top: `${driver.y}%` }}
          transition={{ duration: 0.9, ease: "linear" }}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-soft-lg ring-2 ring-brand-green"
          >
            🚚
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
