"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function CustomerSearchBar({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) params.set("search", trimmed);
    else params.delete("search");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 sm:max-w-sm">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar por nombre o email…"
        className="pl-9"
        aria-label="Buscar clientes"
      />
    </form>
  );
}
