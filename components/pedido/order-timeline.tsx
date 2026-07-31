"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { orderStatusSteps } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function OrderTimeline({ stageIndex }: { stageIndex: number }) {
  return (
    <div className="relative flex flex-col">
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 overflow-hidden rounded-full bg-border">
        <motion.div
          className="w-full bg-brand-green"
          initial={{ height: "0%" }}
          animate={{
            height: `${(Math.min(stageIndex, orderStatusSteps.length - 1) / (orderStatusSteps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>

      <div className="flex flex-col gap-7">
        {orderStatusSteps.map((step, i) => {
          const isLastStep = i === orderStatusSteps.length - 1;
          const done = i < stageIndex || (isLastStep && i === stageIndex);
          const active = i === stageIndex && !isLastStep;
          return (
            <div key={step.id} className="relative flex gap-4 pl-0">
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500",
                  done && "border-brand-green bg-brand-green text-white",
                  active && "border-brand-navy bg-brand-navy text-white",
                  !done && !active && "border-border bg-background text-muted-foreground"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
                {active && (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-brand-navy/40"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                  />
                )}
              </div>
              <div className={cn("pt-0.5 transition-opacity", !done && !active && "opacity-60")}>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    done || active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
