import { ClipboardList, Clock, DollarSign, Smile } from "lucide-react";
import { KpiCard } from "@/components/admin/kpi-card";
import { KanbanBoard } from "@/components/admin/kanban-board";
import { SalesChart } from "@/components/admin/sales-chart";

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Panel de operaciones
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vista en tiempo real de pedidos, entregas y desempeño de la operación.
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={ClipboardList}
            label="Pedidos hoy"
            value="19"
            deltaPct={12}
            accent="bg-brand-navy/10 text-brand-navy"
          />
          <KpiCard
            icon={DollarSign}
            label="Ticket promedio"
            value="$28.450"
            deltaPct={4}
            accent="bg-brand-green/15 text-brand-green-dark"
          />
          <KpiCard
            icon={Clock}
            label="Tiempo promedio de entrega"
            value="34 min"
            deltaPct={-6}
            accent="bg-brand-orange/10 text-brand-orange-dark"
          />
          <KpiCard
            icon={Smile}
            label="Satisfacción del cliente"
            value="98%"
            deltaPct={2}
            accent="bg-brand-indigo/10 text-brand-indigo"
          />
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-soft">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Ventas y pedidos de la semana</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Barras: ventas totales · Línea: cantidad de pedidos
          </p>
          <SalesChart />
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold text-foreground">Tablero de pedidos por estado</h2>
          <KanbanBoard />
        </div>
      </div>
    </div>
  );
}
