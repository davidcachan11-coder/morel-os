"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Truck, Search } from "lucide-react";
import { products } from "@/lib/mock-data";

const previewProducts = products.slice(0, 4);

export function ProductMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative z-20 rounded-2xl border border-border/60 bg-card p-4 shadow-soft-lg"
      >
        <div className="mb-3 flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Buscar tomate, leche, yerba…</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {previewProducts.map((p) => (
            <div
              key={p.id}
              className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-background p-2"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br text-lg ${p.gradient}`}
              >
                {p.emoji}
              </div>
              <span className="w-full truncate text-center text-[9px] font-medium text-foreground">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        className="absolute -bottom-8 -left-6 z-30 w-56 rounded-2xl border border-border/60 bg-card p-3.5 shadow-soft-lg sm:-left-10"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-green/15">
            <Truck className="h-3.5 w-3.5 text-brand-green-dark" />
          </div>
          <div>
            <p className="text-[11px] font-semibold leading-none text-foreground">En camino</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Llega en 8 min</p>
          </div>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-brand-green"
            animate={{ width: ["20%", "78%", "20%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -right-4 -top-7 z-30 flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-soft-lg sm:-right-8"
      >
        <CheckCircle2 className="h-4 w-4 text-brand-green-dark" />
        <div>
          <p className="text-[11px] font-semibold leading-none text-foreground">Pedido confirmado</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">#MO-73142</p>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 9, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        className="absolute -right-2 bottom-10 z-10 flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-[10px] font-medium text-muted-foreground shadow-soft sm:-right-6"
      >
        <MapPin className="h-3 w-3 text-brand-orange" />
        Av. Belgrano 1248
      </motion.div>

      <div className="absolute inset-x-8 -bottom-6 top-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-navy/10 via-brand-green/10 to-brand-orange/10 blur-2xl" />
    </div>
  );
}
