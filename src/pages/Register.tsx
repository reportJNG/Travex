import { useState } from "react";
import { Link } from "react-router";
import { Building2, CheckCircle, ChevronLeft, ChevronRight, Plane } from "lucide-react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const totalSteps = 4;

export default function Register() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState<"agency" | "hotel">("agency");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [taxId, setTaxId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => setSuccess(true),
    onError: (err) => setError(err.message),
  });

  const validateStep = (current: number) => {
    if (current === 2) {
      if (!fullName || !email || !password || !confirmPassword) return "All fields are required";
      if (password !== confirmPassword) return "Passwords do not match";
      if (password.length < 8) return "Password must be at least 8 characters";
    }
    if (current === 3) {
      if (!legalName || !phone || !wilaya) return "All required fields must be filled";
      if (role === "hotel" && !taxId && !licenseNumber) {
        return "Hotel accounts must provide Tax ID or License Number";
      }
    }
    return "";
  };

  const nextStep = () => {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((value) => Math.min(totalSteps, value + 1));
  };

  const handleSubmit = () => {
    const validationError = validateStep(2) || validateStep(3);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    registerMutation.mutate({
      role,
      fullName,
      legalName,
      email,
      password,
      phone,
      wilaya: parseInt(wilaya) || 1,
      taxId: taxId || undefined,
      licenseNumber: licenseNumber || undefined,
      locale: "fr",
    });
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="px-6 py-10">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-semibold">Registration submitted</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Your account is pending review. You will receive a notification when your account is approved.
            </p>
            <Button asChild className="mt-6 w-full sm:w-auto">
              <Link to="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden bg-slate-950 lg:block">
        <div className="relative h-full min-h-[680px]">
          <img src="/hero-oran.jpg" alt="Oran coastline" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <img src="/logo.png" alt="TRAVEX" className="mb-6 h-12 w-auto" />
            <h2 className="max-w-md text-3xl font-semibold tracking-tight">Join a verified B2B network.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
              Agencies book trusted hotels. Hotels manage inventory and requests. Admins keep the marketplace clean.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-xl border-0 shadow-none">
          <CardHeader className="px-0">
            <img src="/logo.png" alt="TRAVEX" className="mb-4 h-10 w-auto lg:hidden" />
            <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("auth.step")} {step} {t("auth.of")} {totalSteps}
            </p>
            <Progress value={(step / totalSteps) * 100} className="mt-3" />
          </CardHeader>
          <CardContent className="px-0">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {step === 1 ? (
              <div className="space-y-4">
                <Label>{t("auth.role")}</Label>
                <RadioGroup value={role} onValueChange={(value) => setRole(value as "agency" | "hotel")} className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: "agency", label: t("auth.role.agency"), icon: Plane },
                    { value: "hotel", label: t("auth.role.hotel"), icon: Building2 },
                  ].map((item) => (
                    <Label
                      key={item.value}
                      htmlFor={item.value}
                      className="cursor-pointer rounded-xl border p-4 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                    >
                      <RadioGroupItem value={item.value} id={item.value} className="sr-only" />
                      <item.icon className="mb-3 h-8 w-8 text-primary" />
                      <span className="font-medium">{item.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">{t("auth.fullName")} *</Label>
                  <Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">{t("auth.email")} *</Label>
                  <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")} *</Label>
                  <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password *</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="legalName">{t("auth.legalName")} *</Label>
                  <Input id="legalName" value={legalName} onChange={(event) => setLegalName(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("auth.phone")} *</Label>
                  <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+213555123456" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wilaya">{t("auth.wilaya")} *</Label>
                  <Input id="wilaya" type="number" min={1} max={58} value={wilaya} onChange={(event) => setWilaya(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">{t("auth.taxId")}</Label>
                  <Input id="taxId" value={taxId} onChange={(event) => setTaxId(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">{t("auth.licenseNumber")}</Label>
                  <Input id="licenseNumber" value={licenseNumber} onChange={(event) => setLicenseNumber(event.target.value)} />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Review your information</h3>
                <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                  {[
                    ["Role", role],
                    ["Full name", fullName],
                    ["Email", email],
                    ["Legal name", legalName],
                    ["Phone", phone],
                    ["Wilaya", wilaya || "-"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
                      <div className="mt-1 break-words font-medium">{value}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">
                  By submitting, you confirm the information is accurate and ready for admin review.
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))}>
                  <ChevronLeft className="me-1 h-4 w-4" />
                  {t("back")}
                </Button>
              ) : (
                <span />
              )}
              {step < totalSteps ? (
                <Button onClick={nextStep}>
                  {t("next")}
                  <ChevronRight className="ms-1 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? t("loading") : t("auth.register")}
                </Button>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                {t("auth.login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
