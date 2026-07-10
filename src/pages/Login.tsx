import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TravexLogotype } from "@/components/TravexLogo";

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/");
    },
    onError: () => setError("Email ou mot de passe invalide"),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="grid min-h-[calc(100vh-14rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
      {/* Left: branded panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="/media/travex-auth-lobby.webp"
          alt="Contemporary Algerian hotel lobby"
          width="1024"
          height="1536"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1628] via-[#151e38]/60 to-transparent" />

        {/* Floating content */}
        <div className="absolute inset-0 flex flex-col justify-end p-10">
          <TravexLogotype tone="light" iconClassName="h-11 w-11" className="mb-8" />

          <blockquote className="mb-8">
            <p className="max-w-sm text-2xl font-bold tracking-tight text-white leading-snug">
              Bienvenue dans vos opérations Travex.
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300/80">
              Gérez réservations, inventaire hôtelier, demandes, factures et révisions de comptes
              depuis une seule plateforme B2B de confiance.
            </p>
          </blockquote>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-2">
            {["Vérifié", "Sécurisé", "B2B Algeria"].map(label => (
              <span
                key={label}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* Logo for mobile */}
          <div className="mb-8 lg:hidden">
            <TravexLogotype iconClassName="h-10 w-10" />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("auth.login")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez-vous pour accéder à votre espace de travail.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("auth.email")}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("auth.password")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-10 pe-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-10 w-full font-medium shadow-sm"
              disabled={loginMutation.isPending}
            >
              <LogIn className="me-2 h-4 w-4" />
              {loginMutation.isPending ? "Connexion en cours..." : t("auth.signIn")}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">Ou continuer avec</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            onClick={() => toast.info("Connexion Google bientôt disponible")}
          >
            <svg className="me-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuer avec Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              {t("auth.register")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
