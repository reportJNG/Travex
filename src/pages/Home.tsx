import { Link } from "react-router";
import { ArrowRight, BadgeCheck, Building2, Globe2, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { value: "250+", label: "Hotels partenaires" },
  { value: "150+", label: "Agences verifiees" },
  { value: "12K+", label: "Reservations / mois" },
  { value: "58", label: "Wilayas couvertes" },
];

const steps = [
  { step: "01", title: "Register", desc: "Create a verified B2B agency or hotel account." },
  { step: "02", title: "Review", desc: "Admin approval keeps the marketplace trusted." },
  { step: "03", title: "Book", desc: "Reserve rooms with B2B rates and clear payment windows." },
  { step: "04", title: "Operate", desc: "Track requests, invoices, claims, and notifications." },
];

const testimonials = [
  {
    name: "Agence Atlas Voyages",
    role: "Travel Agency · Alger",
    text: "Travex transformed how we book hotels. B2B rates, instant confirmation, clean invoicing — all in one place.",
    stars: 5,
  },
  {
    name: "Hotel El Djazair",
    role: "Hotel Partner · Oran",
    text: "Managing booking requests, availability, and monthly commissions has never been this straightforward.",
    stars: 5,
  },
  {
    name: "Horizons Travel",
    role: "Travel Agency · Constantine",
    text: "The verification system gives us confidence that every hotel we book is legitimate and professional.",
    stars: 5,
  },
];

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();

  const role = (user as any)?.role;
  const status = (user as any)?.status;
  const dashboardLink =
    !user ? "/login" :
    status !== "approved" ? "/pending" :
    role === "hotel" ? "/inventory" :
    role === "super_admin" ? "/admin" :
    "/marketplace";

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8 lg:-mx-8">
      {/* Hero */}
      <section className="relative min-h-[620px] overflow-hidden">
        <img
          src="/hero-algiers.jpg"
          alt="Algiers skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/65 to-slate-950/20" />
        <div className="app-container relative flex min-h-[620px] items-center py-16">
          <div className="max-w-3xl text-white">
            <Badge className="mb-5 bg-white/15 text-white backdrop-blur hover:bg-white/15">
              <Sparkles className="me-1 h-3.5 w-3.5" />
              Premium B2B travel operations
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-xl">
              {t("home.hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-lg">
                <Link to={dashboardLink}>
                  {user ? t("home.hero.cta") : t("auth.register")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <Link to="/marketplace">{t("home.hero.explore")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y bg-card">
        <div className="app-container grid grid-cols-2 gap-4 py-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-background/70 p-4 text-center">
              <div className="text-3xl font-semibold text-primary">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="app-container section-y">
        <div className="mb-8 max-w-2xl">
          <Badge variant="outline" className="mb-3">Why Travex</Badge>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {t("home.features.title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            One operational surface for agencies, hotels, and admins to move bookings from search to confirmation.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Building2, title: t("home.features.b2b"), desc: t("home.features.b2b.desc") },
            { icon: BadgeCheck, title: t("home.features.rates"), desc: t("home.features.rates.desc") },
            { icon: Globe2, title: t("home.features.platform"), desc: t("home.features.platform.desc") },
          ].map((feature) => (
            <Card key={feature.title} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card">
        <div className="app-container section-y grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <Badge variant="outline" className="mb-3">Workflow</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Built for booking operations</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Clear statuses, payment windows, review queues, and role-aware dashboards keep every team aligned.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-xl border bg-background p-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Verification-first access protects negotiated B2B inventory and admin workflows.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((item) => (
              <Card key={item.step} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {item.step}
                  </div>
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="app-container section-y">
        <div className="mb-8">
          <Badge variant="outline" className="mb-3">Trusted by</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">What our partners say</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">"{t.text}"</p>
                <div className="mt-4">
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="app-container section-y flex flex-col items-center gap-6 text-center text-white">
          <Badge className="bg-white/20 text-white hover:bg-white/20">
            <Sparkles className="me-1 h-3.5 w-3.5" />
            Join the network
          </Badge>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to modernize your B2B travel operations?
          </h2>
          <p className="max-w-xl text-base leading-7 text-primary-foreground/80">
            Whether you manage a travel agency or a hotel, Travex gives you the tools to operate with clarity and confidence across Algeria.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90">
              <Link to="/register">
                Create free account
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link to="/marketplace">Browse hotels</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
