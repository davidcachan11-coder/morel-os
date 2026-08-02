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
import { formatCurrency } from "@/lib/utils";

export interface RevenueTrendPoint {
  bucket: string;
  revenue: number;
  orders: number;
}

function formatBucketLabel(bucket: string, granularity: "hour" | "day"): string {
  if (granularity === "hour") {
    // "yyyy-mm-ddThh" -> "HH:00"
    return `${bucket.slice(11, 13)}:00`;
  }
  // "yyyy-mm-dd" -> "DD/MM"
  const [, month, day] = bucket.split("-");
  return `${day}/${month}`;
}

export function RevenueTrendChart({
  points,
  granularity,
}: {
  points: RevenueTrendPoint[];
  granularity: "hour" | "day";
}) {
  const data = points.map((p) => ({ ...p, label: formatBucketLabel(p.bucket, granularity) }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <YAxis
            yAxisId="revenue"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            width={54}
          />
          <YAxis yAxisId="orders" hide />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              boxShadow: "0 8px 24px -8px rgba(20,24,50,0.18)",
              fontSize: 12,
            }}
            formatter={(value, name) =>
              name === "revenue"
                ? [formatCurrency(Number(value)), "Ingresos"]
                : [String(value), "Pedidos"]
            }
          />
          <Bar
            yAxisId="revenue"
            dataKey="revenue"
            fill="var(--brand-navy)"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
          <Line
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke="var(--brand-green)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--brand-green)", strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
