"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { weeklySales, formatCurrency } from "@/lib/mock-data";

export function SalesChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={weeklySales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            yAxisId="ventas"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1_000_000).toFixed(1)}M`}
            width={54}
          />
          <YAxis yAxisId="pedidos" hide />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              boxShadow: "0 8px 24px -8px rgba(20,24,50,0.18)",
              fontSize: 12,
            }}
            formatter={(value, name) =>
              name === "ventas"
                ? [formatCurrency(Number(value)), "Ventas"]
                : [String(value), "Pedidos"]
            }
            labelFormatter={(label) => `${label}`}
          />
          <Bar
            yAxisId="ventas"
            dataKey="ventas"
            fill="var(--brand-navy)"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
          <Line
            yAxisId="pedidos"
            type="monotone"
            dataKey="pedidos"
            stroke="var(--brand-green)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--brand-green)", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
