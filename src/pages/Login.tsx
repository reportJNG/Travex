import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn } from "lucide-react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      navigate("/");
    },
    onError: () => setError("Invalid email or password"),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
      <div className="hidden bg-slate-950 lg:block">
        <div className="relative h-full min-h-[560px]">
          <img src="/hotel-lobby.jpg" alt="Hotel lobby" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <img src="/logo.png" alt="TRAVEX" className="mb-6 h-12 w-auto" />
            <h2 className="max-w-md text-3xl font-semibold tracking-tight">Welcome back to Travex operations.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
              Manage bookings, hotel inventory, requests, invoices, and account reviews from one trusted B2B platform.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="px-0 text-center sm:text-left">
            <img src="/logo.png" alt="TRAVEX" className="mx-auto h-12 w-auto sm:mx-0 lg:hidden" />
            <CardTitle className="mt-4 text-2xl">{t("auth.login")}</CardTitle>
            <p className="text-sm text-muted-foreground">Sign in to continue to your workspace.</p>
          </CardHeader>
          <CardContent className="px-0">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                <LogIn className="me-2 h-4 w-4" />
                {loginMutation.isPending ? t("loading") : t("auth.signIn")}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                {t("auth.register")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
