import { formatCurrency } from "@/lib/utils";

export interface CustomerStats {
  newCustomers: number;
  activeCustomers: number;
  returningCustomers: number;
  averageSpend: number | null;
  purchaseFrequency: number | null;
  orderCountDistribution: { one: number; two: number; three: number; fourPlus: number };
  topCustomers: {
    customerId: string;
    name: string;
    totalSpend: number;
    orderCount: number;
  }[];
}

export function CustomerStatsPanel({ stats }: { stats: CustomerStats }) {
  const distributionEntries: { label: string; count: number }[] = [
    { label: "1 pedido", count: stats.orderCountDistribution.one },
    { label: "2 pedidos", count: stats.orderCountDistribution.two },
    { label: "3 pedidos", count: stats.orderCountDistribution.three },
    { label: "4+ pedidos", count: stats.orderCountDistribution.fourPlus },
  ];
  const maxDistribution = Math.max(...distributionEntries.map((d) => d.count), 1);
  const hasAnyCustomers = distributionEntries.some((d) => d.count > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-muted-foreground">Clientes nuevos</dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">{stats.newCustomers}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Clientes activos</dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">{stats.activeCustomers}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Clientes recurrentes</dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {stats.returningCustomers}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Gasto promedio</dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {stats.averageSpend !== null ? formatCurrency(stats.averageSpend) : "—"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">
              Frecuencia de compra (histórico, todas las sucursales)
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {stats.purchaseFrequency !== null
                ? `${stats.purchaseFrequency.toFixed(1)} pedidos/cliente`
                : "—"}
            </dd>
          </div>
        </dl>

        <h3 className="mt-6 mb-2 text-xs font-semibold text-muted-foreground">
          Distribución por cantidad de pedidos (histórico)
        </h3>
        {hasAnyCustomers ? (
          <div className="flex flex-col gap-2">
            {distributionEntries.map((entry) => (
              <div key={entry.label} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs text-muted-foreground">{entry.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-brand-indigo"
                    style={{
                      width: `${Math.max((entry.count / maxDistribution) * 100, entry.count > 0 ? 4 : 0)}%`,
                    }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium text-foreground">
                  {entry.count}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Todavía no hay clientes con pedidos.</p>
        )}
      </div>

      <div className="lg:col-span-2">
        <h3 className="mb-3 text-xs font-semibold text-muted-foreground">
          Clientes más valiosos (histórico)
        </h3>
        {stats.topCustomers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay suficientes pedidos.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {stats.topCustomers.map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 p-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.orderCount} {customer.orderCount === 1 ? "pedido" : "pedidos"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(customer.totalSpend)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
