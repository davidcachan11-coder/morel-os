import Link from "next/link";
import { Inbox } from "lucide-react";
import { cn, formatCurrency, formatRelativeTime } from "@/lib/utils";
import { SEGMENT_BADGE_CLASS, SEGMENT_LABELS, type CustomerSegment } from "@/components/admin/customer-segment-ui";

export interface CustomerRow {
  customerId: string;
  name: string;
  email: string;
  orderCount: number;
  lifetimeSpend: number;
  lastOrderAt: Date | null;
  segment: CustomerSegment;
}

export function CustomersTable({ customers }: { customers: CustomerRow[] }) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-16 text-center">
        <Inbox className="h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium text-foreground">Sin clientes</p>
        <p className="text-xs text-muted-foreground">
          Ningún cliente coincide con la búsqueda actual.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/70 text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Cliente</th>
            <th className="py-2 pr-3 font-medium">Segmento</th>
            <th className="py-2 pr-3 font-medium">Pedidos</th>
            <th className="py-2 pr-3 font-medium">Gasto histórico</th>
            <th className="py-2 pl-3 text-right font-medium">Último pedido</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {customers.map((customer) => (
            <tr key={customer.customerId} className="transition-colors hover:bg-muted/40">
              <td className="py-3 pr-3">
                <Link
                  href={`/admin/clientes/${customer.customerId}`}
                  className="font-medium text-brand-navy hover:underline"
                >
                  {customer.name}
                </Link>
                <p className="text-xs text-muted-foreground">{customer.email}</p>
              </td>
              <td className="py-3 pr-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    SEGMENT_BADGE_CLASS[customer.segment]
                  )}
                >
                  {SEGMENT_LABELS[customer.segment]}
                </span>
              </td>
              <td className="py-3 pr-3 text-foreground">{customer.orderCount}</td>
              <td className="py-3 pr-3 font-medium text-foreground">
                {formatCurrency(customer.lifetimeSpend)}
              </td>
              <td className="py-3 pl-3 text-right text-muted-foreground">
                {customer.lastOrderAt ? formatRelativeTime(customer.lastOrderAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
