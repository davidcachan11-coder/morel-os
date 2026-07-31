"use client";

import { useEffect, useState } from "react";
import { type OrderStatusId } from "@/lib/mock-data";

interface Stage {
  id: OrderStatusId;
  start: number; // seconds from order creation
}

// Total demo cycle ~2m55s — paced for a live sales walkthrough.
export const STAGES: Stage[] = [
  { id: "confirmado", start: 0 },
  { id: "preparando", start: 6 },
  { id: "control_calidad", start: 35 },
  { id: "en_camino", start: 55 },
  { id: "entregado", start: 175 },
];

const TOTAL_DURATION = STAGES[STAGES.length - 1].start;
const EN_CAMINO_START = STAGES.find((s) => s.id === "en_camino")!.start;
const EN_CAMINO_END = TOTAL_DURATION;

export interface OrderProgress {
  elapsedSeconds: number;
  stageId: OrderStatusId;
  stageIndex: number;
  stageProgress: number;
  etaMinutes: number;
  driverProgress: number;
  isDelivered: boolean;
}

function computeProgress(elapsed: number): OrderProgress {
  const clamped = Math.min(elapsed, TOTAL_DURATION);
  let stageIndex = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (clamped >= STAGES[i].start) stageIndex = i;
  }
  const stage = STAGES[stageIndex];
  const nextStage = STAGES[stageIndex + 1];
  const stageProgress = nextStage
    ? Math.min(1, (clamped - stage.start) / (nextStage.start - stage.start))
    : 1;

  const remaining = Math.max(0, EN_CAMINO_END - clamped);
  const etaMinutes = Math.max(0, Math.ceil(remaining / 8));

  const driverProgress = Math.min(
    1,
    Math.max(0, (clamped - EN_CAMINO_START) / (EN_CAMINO_END - EN_CAMINO_START))
  );

  return {
    elapsedSeconds: clamped,
    stageId: stage.id,
    stageIndex,
    stageProgress,
    etaMinutes,
    driverProgress,
    isDelivered: stage.id === "entregado",
  };
}

export function useOrderProgress(createdAt: string): OrderProgress {
  const createdAtMs = new Date(createdAt).getTime();
  const [progress, setProgress] = useState<OrderProgress>(() =>
    computeProgress((Date.now() - createdAtMs) / 1000)
  );

  useEffect(() => {
    const tick = () => setProgress(computeProgress((Date.now() - createdAtMs) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [createdAtMs]);

  return progress;
}
