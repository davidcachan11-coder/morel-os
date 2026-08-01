import Link from "next/link";
import {
  ArrowRight,
  ShoppingBasket,
  ShieldCheck,
  Radar,
  BarChart3,
  Sparkles,
  CircleCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/site-footer";
import { ProductMockup } from "@/components/landing/product-mockup";
import { FadeIn } from "@/components/motion/fade-in";

const features = [
  {
    icon: ShoppingBasket,
    title: "Tienda online completa",
    description:
      "Catálogo con miles de productos, búsqueda instantánea y categorías claras, pensado para que comprar el mandado sea tan rápido como en el local.",
    accent: "bg-brand-navy/10 text-brand-navy",
  },
  {
    icon: ShieldCheck,
    title: "Sustituciones a tu manera",
    description:
      "Cada cliente decide, producto por producto, qué nunca se puede reemplazar. Menos devoluciones, más confianza en cada entrega.",
    accent: "bg-brand-orange/10 text-brand-orange-dark",
  },
  {
    icon: Radar,
    title: "Seguimiento en vivo",
    description:
      "Línea de tiempo animada y mapa en tiempo real desde que se confirma el pedido hasta que el repartidor toca timbre.",
    accent: "bg-brand-green/15 text-brand-green-dark",
  },
  {
    icon: BarChart3,
    title: "Operación bajo control",
    description:
      "Panel con KPIs, tablero kanban por sucursal y métricas de entrega para que el equipo de operaciones nunca vuele a ciegas.",
    accent: "bg-brand-indigo/10 text-brand-indigo",
  },
];

const steps = [
  {
    number: "01",
    title: "El cliente arma su pedido",
    description: "Elige productos, indica preferencias de sustitución y su horario de entrega ideal.",
  },
  {
    number: "02",
    title: "Tu equipo prepara en tienda",
    description: "El pedido aparece en el panel de operaciones, listo para picking y control de calidad.",
  },
  {
    number: "03",
    title: "El cliente sigue todo en vivo",
    description: "Timeline animada, mapa con el repartidor en tiempo real y notificaciones automáticas.",
  },
];

const stats = [
  { value: "35 min", label: "Tiempo promedio de entrega" },
  { value: "98%", label: "Pedidos entregados sin cambios" },
  { value: "+40", label: "Categorías de productos" },
  { value: "24/7", label: "Seguimiento disponible" },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy">
        <div className="bg-noise absolute inset-0 opacity-40" />
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand-green/20 blur-3xl" />
        <div className="absolute -bottom-24 left-0 h-80 w-80 rounded-full bg-brand-orange/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-28 lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-brand-green" />
              Propuesta digital para Supermercados Morel
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              El supermercado, ahora en la palma de la mano de tus clientes.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              Morel OS conecta la tienda online, la entrega en vivo y la operación en
              sucursal en una sola plataforma — lista para encender hoy mismo.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/tienda">
                <Button
                  size="lg"
                  className="w-full rounded-full bg-white text-brand-navy hover:bg-white/90 sm:w-auto"
                >
                  Probar la demo
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pedido/MO-73142">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white sm:w-auto"
                >
                  Ver seguimiento en vivo
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4 text-brand-green" /> Sin apps que instalar
              </span>
              <span className="flex items-center gap-1.5">
                <CircleCheck className="h-4 w-4 text-brand-green" /> Listo para producción
              </span>
            </div>
          </div>
          <div className="relative">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center lg:text-left">
              <p className="text-3xl font-semibold text-brand-navy">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-green-dark">
              Todo en una plataforma
            </span>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Todo lo que necesita Supermercados Morel para vender online
            </h2>
            <p className="mt-4 text-muted-foreground">
              Desde la primera búsqueda hasta el timbre en la puerta, cada paso está
              diseñado para generar confianza.
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeIn key={feature.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-soft-lg">
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.accent}`}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-orange-dark">
              Cómo funciona
            </span>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              De la góndola a la puerta de tu casa, sin sorpresas
            </h2>
          </FadeIn>

          <div className="relative mt-16 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
            <div className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block" />
            {steps.map((step, i) => (
              <FadeIn key={step.number} delay={i * 0.1} className="relative">
                <div className="flex flex-col items-start">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-brand-navy shadow-soft">
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-3xl bg-brand-navy px-6 py-16 text-center shadow-soft-lg sm:px-16">
              <div className="absolute -top-20 right-10 h-64 w-64 rounded-full bg-brand-green/20 blur-3xl" />
              <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-brand-orange/10 blur-3xl" />
              <div className="relative">
                <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Recorre la experiencia completa en minutos
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-white/70">
                  Arma un pedido real, elige un horario de entrega y mira el
                  seguimiento en vivo tal como lo vería un cliente de Morel.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/tienda">
                    <Button
                      size="lg"
                      className="w-full rounded-full bg-white text-brand-navy hover:bg-white/90 sm:w-auto"
                    >
                      Empezar la demo
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
