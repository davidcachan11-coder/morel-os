import { cn } from "@/lib/utils";

export function Logo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-navy shadow-soft">
        <span className="text-sm font-bold text-white">M</span>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-brand-green ring-2 ring-background" />
      </div>
      <span
        className={cn(
          "text-lg font-semibold tracking-tight",
          dark ? "text-white" : "text-foreground"
        )}
      >
        Morel <span className="font-normal text-muted-foreground">OS</span>
      </span>
    </div>
  );
}
