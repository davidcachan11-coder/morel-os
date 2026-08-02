import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OperationalAlert {
  id: string;
  severity: "warning" | "info";
  title: string;
  description: string;
}

export function AlertsPanel({ alerts }: { alerts: OperationalAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {alerts.map((alert) => {
        const isWarning = alert.severity === "warning";
        const Icon = isWarning ? AlertTriangle : Info;
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5",
              isWarning
                ? "border-brand-orange/30 bg-brand-orange/5"
                : "border-border/70 bg-card"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                isWarning ? "text-brand-orange-dark" : "text-muted-foreground"
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{alert.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
