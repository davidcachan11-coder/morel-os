import type { LucideIcon } from "lucide-react";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  plannedItems,
  dataNote,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  plannedItems?: string[];
  dataNote?: string;
}) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Próximamente
        </span>

        {plannedItems && plannedItems.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2 self-stretch text-left text-sm text-muted-foreground">
            {plannedItems.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {dataNote && (
          <Alert className="mt-4 text-left">
            <Info />
            <AlertDescription>{dataNote}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
