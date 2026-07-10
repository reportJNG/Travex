import { Link } from "react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Globe2,
  Mail,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const howItWorks = [
  {
    step: "01",
    title: "Register",
    desc: "Travel agencies and hotels create accounts providing official business documentation for verification.",
  },
  {
    step: "02",
    title: "Get Verified",
    desc: "Our admin team reviews every application to ensure all partners are legitimate registered businesses.",
  },
  {
    step: "03",
    title: "Access B2B Rates",
    desc: "Approved agencies gain access to exclusive negotiated rates not available to the general public.",
  },
  {
    step: "04",
    title: "Operate",
    desc: "Book rooms, manage invoices, track requests, and handle claims — all in one streamlined platform.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Trust First",
    desc: "Every agency and hotel on Travex is verified. No anonymous actors, no fake inventory.",
  },
  {
    icon: BadgeCheck,
    title: "B2B Exclusive",
    desc: "Our rates and tools are purpose-built for professional travel operators, not retail consumers.",
  },
  {
    icon: Globe2,
    title: "Algeria-Focused",
    desc: "Built specifically for the Algerian and North African market with regional nuance baked in.",
  },
  {
    icon: Users,
    title: "Partner Ecosystem",
    desc: "We grow when our partners grow. Travex aligns incentives across hotels, agencies, and admins.",
  },
];

export default function About() {
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8 lg:-mx-8">
      {/* Hero */}
      <section className="relative min-h-[480px] overflow-hidden">
        <picture>
          <source
            media="(max-width: 639px)"
            srcSet="/media/travex-about-hero-mobile.webp"
          />
          <img
            src="/media/travex-about-hero.webp"
            alt="Oran coastline in warm morning light"
            width="1776"
            height="888"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-[#111a33]/94 via-[#17213e]/68 to-[#17213e]/18" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(245,192,126,0.18),transparent_26rem)]" />
        <div className="app-container relative flex min-h-[480px] items-center py-16">
          <div className="max-w-2xl text-white">
            <Badge className="mb-5 bg-white/15 text-white backdrop-blur hover:bg-white/15">
              About Travex
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Modernizing B2B Travel in Algeria
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-200 sm:text-lg">
              Travex is the dedicated B2B marketplace connecting verified travel
              agencies with hotels across Algeria. We replace fragmented, manual
              booking processes with a transparent, digital-first platform built
              for professionals.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                asChild
                className="bg-primary hover:bg-primary/90 shadow-lg"
              >
                <Link to="/register">
                  Join the platform
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/50 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/marketplace">Explore Hotels</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="app-container section-y">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="outline" className="mb-3">
              Our Mission
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              Connect verified travel professionals with premium hotel inventory
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Algeria's travel industry has long relied on phone calls,
              spreadsheets, and informal agreements. Travex brings it into the
              digital era — with structured booking flows, clear payment
              windows, verified identities, and an audit trail that protects
              every party.
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Our platform serves travel agencies that need reliable hotel
              access, hotels that want qualified B2B partners, and
              administrators who need visibility across the entire booking
              ecosystem.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-xl border bg-card p-4">
              <Building2 className="h-8 w-8 shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                From Algiers to Tamanrasset — Travex covers all 58 wilayas with
                a growing network of 250+ partner hotels.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map(v => (
              <div key={v.title} className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-card">
        <div className="app-container section-y">
          <div className="mb-10 text-center">
            <Badge variant="outline" className="mb-3">
              How It Works
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              The B2B Verification Flow
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              We built Travex with verification at the center. Every step is
              designed to keep the marketplace trusted, professional, and
              fraud-free.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map(item => (
              <div
                key={item.step}
                className="relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {item.step}
                </div>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / Team */}
      <section className="app-container section-y">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-3">
              Contact Us
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              Get in touch
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Have a question about onboarding your agency or hotel? Want to
              learn more about B2B rates or partnership opportunities? Reach out
              to the Travex team.
            </p>
            <div className="mt-6 space-y-4">
              <a
                href="mailto:contact@nexelite.co"
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Mail className="h-4 w-4" />
                </div>
                contact@nexelite.co
              </a>
              <a
                href="tel:+213560000000"
                className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </div>
                +213 560 000 000
              </a>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-8">
            <h3 className="text-lg font-semibold">Ready to join?</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Whether you run a travel agency or manage a hotel, Travex is
              built for you. Create your account today and get verified within
              24 hours.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to="/register">
                  Create account
                  <ArrowRight className="ms-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link to="/marketplace">Browse hotels</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
