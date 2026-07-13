import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Globe2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { value: "250+", label: "Hôtels partenaires", icon: Building2 },
  { value: "150+", label: "Agences vérifiées", icon: BadgeCheck },
  { value: "12K+", label: "Réservations / mois", icon: TrendingUp },
  { value: "58", label: "Wilayas couvertes", icon: MapPin },
];

function parseRooms(value: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return 1;
  return Math.min(50, Math.max(1, parsed));
}

const curatedHotels = [
  {
    name: "Algiers Marina Hotel",
    tags: ["5 Étoiles", "Alger"],
    rate: "28 500 DZD",
    desc: "Hôtel de ville contemporain avec des tarifs B2B premium et un accès facile à la baie.",
    img: "/media/travex-hotel-exterior.webp",
    available: 12,
  },
  {
    name: "Club des Pins Retreat",
    tags: ["5 Étoiles", "Alger"],
    rate: "31 000 DZD",
    desc: "Inventaire de loisirs méditerranéen avec piscine sur le toit et hébergement flexible.",
    img: "/media/travex-hotel-pool.webp",
    available: 8,
  },
  {
    name: "Oran Business Suites",
    tags: ["4 Étoiles", "Oran"],
    rate: "18 900 DZD",
    desc: "Séjour orienté affaires avec salles de réunion et services modernes.",
    img: "/media/travex-hotel-conference.webp",
    available: 20,
  },
  {
    name: "Constantine Grand",
    tags: ["4 Étoiles", "Constantine"],
    rate: "16 500 DZD",
    desc: "Confortable inventaire de chambres pour voyages corporate et groupes.",
    img: "/media/travex-hotel-room.webp",
    available: 15,
  },
];

const steps = [
  { step: "01", title: "Inscription", desc: "Créez un compte agence ou hôtel vérifié." },
  { step: "02", title: "Validation", desc: "L'approbation admin garantit la confiance dans la marketplace." },
  { step: "03", title: "Réservation", desc: "Réservez avec tarifs B2B et fenêtres de paiement claires." },
  { step: "04", title: "Opérations", desc: "Suivez requêtes, factures, réclamations et notifications." },
];

const testimonials = [
  {
    name: "Agence Atlas Voyages",
    role: "Agence de voyage · Alger",
    text: "Travex a transformé notre façon de réserver des hôtels. Tarifs B2B, confirmation instantanée, facturation claire — tout en un seul endroit.",
    stars: 5,
  },
  {
    name: "Hotel El Djazair",
    role: "Hôtel partenaire · Oran",
    text: "Gérer les demandes de réservation, la disponibilité et les commissions mensuelles n'a jamais été aussi simple.",
    stars: 5,
  },
  {
    name: "Horizons Travel",
    role: "Agence de voyage · Constantine",
    text: "Le système de vérification nous donne la confiance que chaque hôtel réservé est légitime et professionnel.",
    stars: 5,
  },
];

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [country, setCountry] = useState<"DZ" | "TN">("DZ");
  const [wilaya, setWilaya] = useState("");
  const [rooms, setRooms] = useState("1");
  const { data: countries } = trpc.marketplace.listCountries.useQuery();
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery({ country });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (country) params.set("country", country);
    if (wilaya) params.set("wilaya", wilaya);
    const parsedRooms = parseRooms(rooms);
    if (parsedRooms > 1) params.set("rooms", String(parsedRooms));
    navigate(`/marketplace${params.toString() ? `?${params}` : ""}`);
  }

  const role = (user as any)?.role;
  const status = (user as any)?.status;
  const dashboardLink = !user
    ? "/login"
    : status !== "approved"
      ? "/pending"
      : role === "hotel"
        ? "/inventory"
        : role === "super_admin"
          ? "/admin"
          : "/marketplace";

  return (
    <div className="-mx-4 -my-8 sm:-mx-6 lg:-mx-8 overflow-hidden">
      {/* ───── Hero ───── */}
      <section className="relative min-h-[640px] overflow-hidden">
        <picture>
          <source media="(max-width: 639px)" srcSet="/media/travex-home-hero-mobile.webp" />
          <img
            src="/media/travex-home-hero.webp"
            alt="Algiers bay and waterfront at blue hour"
            width="1824"
            height="864"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1428]/96 via-[#151e38]/70 to-[#151e38]/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(231,112,94,0.15),transparent_30rem)]" />

        <div className="app-container relative flex min-h-[640px] items-center py-20">
          <div className="max-w-3xl">
            <Badge className="mb-6 gap-1.5 bg-white/12 text-white backdrop-blur-sm border-white/20 hover:bg-white/12">
              <Sparkles className="h-3.5 w-3.5" />
              Opérations B2B premium
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("home.hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200/90 sm:text-lg">
              {t("home.hero.subtitle")}
            </p>

            {/* Search form */}
            <form
              onSubmit={handleSearch}
              className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="flex flex-1 min-w-[130px] flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    <CalendarDays className="h-3 w-3" />
                    Arrivée
                  </label>
                  <input
                    type="date"
                    value={checkin}
                    onChange={e => setCheckin(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-1 min-w-[130px] flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    <CalendarDays className="h-3 w-3" />
                    Départ
                  </label>
                  <input
                    type="date"
                    value={checkout}
                    onChange={e => setCheckout(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-1 min-w-[150px] flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    <MapPin className="h-3 w-3" />
                    Pays
                  </label>
                  <select
                    value={country}
                    onChange={e => {
                      setCountry(e.target.value as "DZ" | "TN");
                      setWilaya("");
                    }}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {countries?.map(c => (
                      <option key={c.code} value={c.code}>{c.nameFr}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 min-w-[150px] flex-col gap-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    <MapPin className="h-3 w-3" />
                    {country === "TN" ? "Gouvernorat" : "Wilaya"}
                  </label>
                  <select
                    value={wilaya}
                    onChange={e => setWilaya(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-slate-900/60 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{country === "TN" ? "Tous les gouvernorats" : "Toutes les wilayas"}</option>
                    {wilayas?.map(w => (
                      <option key={w.code} value={String(w.code)}>{w.nameFr}</option>
                    ))}
                  </select>
                </div>
                <div className="flex w-24 flex-col gap-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-300">
                    Chambres
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={rooms}
                    onChange={e => setRooms(e.target.value)}
                    onBlur={e => setRooms(String(parseRooms(e.target.value)))}
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="shrink-0 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
                  Rechercher
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="brand-shine bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30">
                <Link to={dashboardLink}>
                  {user ? t("home.hero.cta") : t("auth.register")}
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-white/8 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/marketplace">{t("home.hero.explore")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Stats bar ───── */}
      <section className="border-y border-border/60 bg-card">
        <div className="app-container grid grid-cols-2 divide-x divide-border/60 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div key={stat.label} className={`flex flex-col items-center gap-2 px-6 py-7 text-center ${i > 0 ? "" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
              <div className="text-xs font-medium text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Curated Hotels ───── */}
      <section className="bg-[#0e1628]">
        <div className="app-container section-y">
          <div className="mb-10">
            <Badge className="mb-3 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
              Opportunités sélectionnées
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Inventaire B2B premium
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Sélections exclusives dans le secteur touristique premium d'Afrique du Nord.
            </p>
          </div>

          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
            {curatedHotels.map(hotel => (
              <div
                key={hotel.name}
                className="group snap-start flex w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={hotel.img}
                    alt={hotel.name}
                    width="1200"
                    height="900"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                    {hotel.tags.map(tag => (
                      <span key={tag} className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary backdrop-blur-sm border border-primary/20">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white leading-snug">{hotel.name}</h3>
                    <span className="shrink-0 rounded-lg bg-primary/12 px-2.5 py-1 text-xs font-bold text-primary border border-primary/20">
                      {hotel.rate}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400 flex-1">{hotel.desc}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-400 font-medium">
                      {hotel.available} chambres dispo.
                    </span>
                    <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-xs h-7 px-3">
                      <Link to="/marketplace">Réserver</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section className="bg-background">
        <div className="app-container section-y">
          <div className="mb-10 max-w-2xl">
            <Badge variant="outline" className="mb-3">Pourquoi Travex</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {t("home.features.title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Une surface opérationnelle pour agences, hôtels et admins — de la recherche à la confirmation.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Building2, title: t("home.features.b2b"), desc: t("home.features.b2b.desc"), color: "bg-primary/10 text-primary" },
              { icon: BadgeCheck, title: t("home.features.rates"), desc: t("home.features.rates.desc"), color: "bg-sky-100 text-sky-600" },
              { icon: Globe2, title: t("home.features.platform"), desc: t("home.features.platform.desc"), color: "bg-violet-100 text-violet-600" },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`fade-up stagger-${i + 1} group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:shadow-md hover:border-border/80`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section className="border-y border-border/60 bg-card">
        <div className="app-container section-y grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <Badge variant="outline" className="mb-3">Processus</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Conçu pour les opérations de réservation
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Statuts clairs, fenêtres de paiement, files d'attente de révision et tableaux de bord
              par rôle gardent chaque équipe alignée.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-background/80 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground">
                L'accès basé sur la vérification protège l'inventaire B2B négocié et les workflows admin.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {steps.map((item, i) => (
              <div
                key={item.step}
                className={`fade-up stagger-${i + 1} rounded-xl border border-border bg-background p-5 transition-all duration-200 hover:shadow-md`}
              >
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {item.step}
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section className="bg-background">
        <div className="app-container section-y">
          <div className="mb-10">
            <Badge variant="outline" className="mb-3">Témoignages</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Ce que disent nos partenaires
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <div
                key={item.name}
                className={`fade-up stagger-${i + 1} rounded-xl border border-border bg-card p-6`}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: item.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">"{item.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="relative overflow-hidden bg-[#0e1628]">
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-[48rem] bg-[url('/brand/travex-pattern.svg')] bg-[length:30rem_auto] opacity-[0.06]"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_110%,rgba(231,112,94,0.25),transparent_32rem),radial-gradient(ellipse_at_92%_-20%,rgba(63,168,152,0.28),transparent_32rem)]" />

        <div className="app-container section-y relative flex flex-col items-center gap-6 text-center text-white">
          <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">
            <Sparkles className="me-1.5 h-3.5 w-3.5" />
            Rejoindre le réseau
          </Badge>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Prêt à moderniser vos opérations de voyage B2B ?
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-slate-300/80">
            Que vous gériez une agence de voyage ou un hôtel, Travex vous donne les outils
            pour opérer avec clarté et confiance à travers l'Algérie.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="brand-shine bg-white text-[#1c2440] hover:bg-white/92 font-semibold shadow-xl shadow-black/20">
              <Link to="/register">
                Créer un compte gratuit
                <ArrowRight className="ms-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/30 bg-white/8 text-white hover:bg-white/15 hover:text-white"
            >
              <Link to="/marketplace">Explorer les hôtels</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
