"use client";

import { useEffect, useState } from "react";
import { getOrderStatus, type StoredOrderStatusEvent } from "@/services/orders";
import { orderStatusSteps, type OrderStatusId } from "@/data/orders";

const POLL_INTERVAL_MS = 5000;

// No real GPS/location data exists yet (see prisma/schema.prisma's
// Delivery model comment) and no real ETA source exists either — see
// docs/DECISIONS.md's Sprint 4 PR 5 entry. driverProgress is therefore a
// symbolic, poll-tick-driven creep, not a measurement: it nudges forward
// a small fixed amount each successful poll while en route, capped below
// 1 so it never visually "arrives" before the real ENTREGADO event says
// so. This keeps the tracker feeling alive without claiming a precision
// that doesn't exist — replaced by real tracking in a later sprint.
const EN_CAMINO_STEP = 0.08;
const EN_CAMINO_CAP = 0.92;

// Static, not a countdown — no real ETA source exists yet either. A
// fixed approximate label per stage, never recomputed from elapsed time.
const ETA_LABELS: Partial<Record<OrderStatusId, string>> = {
  en_camino: "15–20 min aprox.",
};

export interface OrderProgress {
  stageId: OrderStatusId;
  stageIndex: number;
  driverProgress: number;
  etaLabel: string | null;
  isDelivered: boolean;
}

function latestStage(events: StoredOrderStatusEvent[]): OrderStatusId {
  return events.length > 0 ? events[events.length - 1].status : "confirmado";
}

function initialDriverProgress(stage: OrderStatusId): number {
  if (stage === "entregado") return 1;
  if (stage === "en_camino") return EN_CAMINO_STEP;
  return 0;
}

export function useOrderProgress(
  orderId: string,
  initialStatusEvents: StoredOrderStatusEvent[]
): OrderProgress {
  const [stageId, setStageId] = useState(() => latestStage(initialStatusEvents));
  const [driverProgress, setDriverProgress] = useState(() =>
    initialDriverProgress(latestStage(initialStatusEvents))
  );
  const isDelivered = stageId === "entregado";

  useEffect(() => {
    // Decision F: nothing changes after delivery — stop polling entirely.
    if (isDelivered) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const result = await getOrderStatus(orderId);
        if (!cancelled && result) {
          const newStage = latestStage(result.statusEvents);
          setStageId(newStage);
          if (newStage === "entregado") {
            setDriverProgress(1);
          } else if (newStage === "en_camino") {
            setDriverProgress((p) => Math.min(EN_CAMINO_CAP, p + EN_CAMINO_STEP));
          }
        }
      } catch {
        // Transient failure: keep the last known state and just retry on
        // the next tick — this is a background refresh, not a
        // user-initiated action, so it doesn't need its own error UI.
      }
      // Self-scheduling, not setInterval: the next poll is only queued
      // once this one has fully settled, so a slow response can't cause
      // overlapping in-flight requests or an out-of-order state update.
      // Scheduled unconditionally (not re-checking the new stage here) —
      // if this poll just reached "entregado", isDelivered flips true on
      // the next render, and this effect's own cleanup (below) clears
      // this exact timeout before it ever fires.
      if (!cancelled) {
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }
    timeoutId = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [orderId, isDelivered]);

  return {
    stageId,
    stageIndex: orderStatusSteps.findIndex((s) => s.id === stageId),
    driverProgress,
    etaLabel: ETA_LABELS[stageId] ?? null,
    isDelivered,
  };
}
