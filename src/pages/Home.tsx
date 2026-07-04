import { Link } from "react-router";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeCheck, Globe, Zap, Building2 } from "lucide-react";

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();

  const userRole = (user as any)?.role;
  const isApproved = (user as any)?.status === "approved";

  const getDashboardLink = () => {
    if (!user) return "/login";
    if (!isApproved) return "#";
    if (userRole === "agency") return "/marketplace";
    if (userRole === "hotel") return "/inventory";
    if (userRole === "super_admin") return "/admin";
    return "/login";
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[500px] flex items-center overflow-hidden">
        <img
          src="/hero-algiers.jpg"
          alt="Algiers"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 to-slate-900/40" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("home.hero.title")}
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8">
              {t("home.hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              {user ? (
                <Link to={getDashboardLink()}>
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8">
                    {t("home.hero.cta")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white px-8">
                      {t("home.hero.cta")}
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white text-white hover:bg-white/10 px-8"
                    >
                      {t("home.hero.explore")}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "250+", label: "Hôtels partenaires" },
              { value: "150+", label: "Agences affiliées" },
              { value: "12K+", label: "Réservations/mois" },
              { value: "58", label: "Wilayas couvertes" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-teal-700">{stat.value}</div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-12">
            {t("home.features.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {t("home.features.b2b")}
                </h3>
                <p className="text-slate-500 text-sm">{t("home.features.b2b.desc")}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {t("home.features.rates")}
                </h3>
                <p className="text-slate-500 text-sm">{t("home.features.rates.desc")}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-7 w-7 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {t("home.features.platform")}
                </h3>
                <p className="text-slate-500 text-sm">{t("home.features.platform.desc")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-12">
            Comment ça marche
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Inscription", desc: "Créez votre compte B2B et soumettez vos documents" },
              { step: "2", title: "Vérification", desc: "Notre équipe vérifie votre profil sous 24h" },
              { step: "3", title: "Réservation", desc: "Accédez au marketplace et réservez en ligne" },
              { step: "4", title: "Confirmation", desc: "Recevez votre voucher instantanément" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-teal-600 text-white flex items-center justify-center text-lg font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-700">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Rejoignez TRAVEX dès aujourd'hui
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Inscrivez-vous gratuitement et commencez à réserver les meilleurs hôtels aux tarifs B2B
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary" className="px-8">
              Créer un compte gratuit
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
