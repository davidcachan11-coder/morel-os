"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_BRANCHES = "all";

export function BranchSelector({ branches }: { branches: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentBranch = searchParams.get("branch") ?? ALL_BRANCHES;

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_BRANCHES) {
      params.delete("branch");
    } else {
      params.set("branch", value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentBranch} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-52">
        <SelectValue placeholder="Todas las sucursales" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_BRANCHES}>Todas las sucursales</SelectItem>
        {branches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
