import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Plane,
  UploadCloud,
  X,
} from "lucide-react";
import { z } from "zod";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TravexLogotype } from "@/components/TravexLogo";

const totalSteps = 5;

const step2Schema = z
  .object({
    fullName: z.string().min(3, "Full name must be at least 3 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const step3Schema = z.object({
  legalName: z.string().min(2, "Legal name must be at least 2 characters"),
  phone: z.string().min(8, "Enter a valid phone number"),
  wilaya: z.string().min(1, "Please select a wilaya"),
});

type FieldErrors = Record<string, string>;

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-destructive">{message}</p>
  ) : null;
}

export default function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
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
  const [commercialRegistry, setCommercialRegistry] = useState<File | null>(
    null
  );
  const [tourismLicense, setTourismLicense] = useState<File | null>(null);
  const [taxCard, setTaxCard] = useState<File | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const commercialRegistryRef = useRef<HTMLInputElement>(null);
  const tourismLicenseRef = useRef<HTMLInputElement>(null);
  const taxCardRef = useRef<HTMLInputElement>(null);

  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => navigate("/register/submitted"),
    onError: err => {
      if (err.message === "EMAIL_EXISTS")
        setError("This email is already registered. Please log in.");
      else if (err.message === "PHONE_INVALID")
        setError("Phone number is invalid. Use +213XXXXXXXXX format.");
      else if (err.message === "TAX_OR_LICENSE_REQUIRED")
        setError("Hotel accounts must provide Tax ID or License Number.");
      else setError(err.message || "Registration failed. Please try again.");
    },
  });

  const clearErrors = () => {
    setError("");
    setFieldErrors({});
  };

  const validateStep = (current: number): boolean => {
    clearErrors();
    if (current === 2) {
      const result = step2Schema.safeParse({
        fullName,
        email,
        password,
        confirmPassword,
      });
      if (!result.success) {
        const errors: FieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!errors[field]) errors[field] = issue.message;
        }
        setFieldErrors(errors);
        return false;
      }
    }
    if (current === 3) {
      const result = step3Schema.safeParse({ legalName, phone, wilaya });
      if (!result.success) {
        const errors: FieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!errors[field]) errors[field] = issue.message;
        }
        setFieldErrors(errors);
        return false;
      }
      if (role === "hotel" && !taxId && !licenseNumber) {
        setError("Hotel accounts must provide Tax ID or License Number");
        return false;
      }
    }
    if (current === 4) {
      if (!commercialRegistry) {
        setError("Commercial Registry document is required.");
        return false;
      }
      if (!taxCard) {
        setError("Tax Card (Carte Fiscale / NIF) document is required.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(step)) return;
    setStep(v => Math.min(totalSteps, v + 1));
  };

  const handleSubmit = () => {
    if (!validateStep(2) || !validateStep(3) || !validateStep(4)) return;
    if (!agreedToPolicy) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }
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

  const selectedWilayaName = wilayas?.find(
    w => String(w.code) === wilaya
  )?.nameFr;

  return (
    <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden bg-slate-950 lg:block">
        <div className="relative h-full min-h-[680px]">
          <img
            src="/media/travex-auth-lobby.webp"
            alt="Contemporary Algerian hotel lobby"
            width="1024"
            height="1536"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17213e] via-[#17213e]/45 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <TravexLogotype
              tone="light"
              iconClassName="h-12 w-12"
              className="mb-6"
            />
            <h2 className="max-w-md text-3xl font-semibold tracking-tight">
              Join a verified B2B network.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
              Agencies book trusted hotels. Hotels manage inventory and
              requests. Admins keep the marketplace clean.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-xl border-0 shadow-none">
          <CardHeader className="px-0">
            <TravexLogotype
              className="mb-4 lg:hidden"
              iconClassName="h-11 w-11"
            />
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
                <RadioGroup
                  value={role}
                  onValueChange={value => setRole(value as "agency" | "hotel")}
                  className="grid gap-3 sm:grid-cols-2"
                >
                  {[
                    {
                      value: "agency",
                      label: t("auth.role.agency"),
                      icon: Plane,
                      desc: "Book hotels at B2B rates",
                    },
                    {
                      value: "hotel",
                      label: t("auth.role.hotel"),
                      icon: Building2,
                      desc: "Manage inventory & requests",
                    },
                  ].map(item => (
                    <Label
                      key={item.value}
                      htmlFor={item.value}
                      className="cursor-pointer rounded-xl border p-4 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
                    >
                      <RadioGroupItem
                        value={item.value}
                        id={item.value}
                        className="sr-only"
                      />
                      <item.icon className="mb-3 h-8 w-8 text-primary" />
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {item.desc}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="fullName">{t("auth.fullName")} *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      clearErrors();
                    }}
                    placeholder="Ahmed Benali"
                    className={fieldErrors.fullName ? "border-destructive" : ""}
                  />
                  <FieldError message={fieldErrors.fullName} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">{t("auth.email")} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      clearErrors();
                    }}
                    placeholder="email@example.com"
                    className={fieldErrors.email ? "border-destructive" : ""}
                  />
                  <FieldError message={fieldErrors.email} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">{t("auth.password")} *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      clearErrors();
                    }}
                    placeholder="Min. 8 characters"
                    className={fieldErrors.password ? "border-destructive" : ""}
                  />
                  <FieldError message={fieldErrors.password} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      clearErrors();
                    }}
                    placeholder="Repeat password"
                    className={
                      fieldErrors.confirmPassword ? "border-destructive" : ""
                    }
                  />
                  <FieldError message={fieldErrors.confirmPassword} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="legalName">{t("auth.legalName")} *</Label>
                  <Input
                    id="legalName"
                    value={legalName}
                    onChange={e => {
                      setLegalName(e.target.value);
                      clearErrors();
                    }}
                    placeholder="Company or business name"
                    className={
                      fieldErrors.legalName ? "border-destructive" : ""
                    }
                  />
                  <FieldError message={fieldErrors.legalName} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">{t("auth.phone")} *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      clearErrors();
                    }}
                    placeholder="+213 5XX XXX XXX"
                    className={fieldErrors.phone ? "border-destructive" : ""}
                  />
                  <FieldError message={fieldErrors.phone} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("auth.wilaya")} *</Label>
                  <Select
                    value={wilaya}
                    onValueChange={v => {
                      setWilaya(v);
                      clearErrors();
                    }}
                  >
                    <SelectTrigger
                      className={fieldErrors.wilaya ? "border-destructive" : ""}
                    >
                      <SelectValue placeholder="Select wilaya" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {wilayas?.map(w => (
                        <SelectItem key={w.code} value={String(w.code)}>
                          {w.code} – {w.nameFr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.wilaya} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxId">
                    {t("auth.taxId")} {role === "hotel" ? "*" : ""}
                  </Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    placeholder="NIF / Numéro fiscal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="licenseNumber">
                    {t("auth.licenseNumber")} {role === "hotel" ? "*" : ""}
                  </Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="Numéro d'agrément"
                  />
                </div>
                {role === "hotel" ? (
                  <p className="sm:col-span-2 text-xs text-muted-foreground">
                    * Hotel accounts must provide at least Tax ID or License
                    Number.
                  </p>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-5">
                <div>
                  <h3 className="font-semibold text-lg">
                    Document Upload Center
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Required documents for account verification
                  </p>
                </div>

                {/* Commercial Registry — REQUIRED */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label>Commercial Registry (Registre du Commerce)</Label>
                    <span className="text-xs font-medium text-destructive uppercase tracking-wide">
                      Required
                    </span>
                  </div>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                    onClick={() => commercialRegistryRef.current?.click()}
                  >
                    {commercialRegistry ? (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="truncate max-w-[240px] font-medium">
                          {commercialRegistry.name}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setCommercialRegistry(null);
                            if (commercialRegistryRef.current)
                              commercialRegistryRef.current.value = "";
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-sm">Click to upload</span>
                        <span className="text-xs">
                          PDF, JPG or PNG (Max 5MB)
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={commercialRegistryRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setCommercialRegistry(f);
                    }}
                  />
                </div>

                {/* Tourism & Operating License — Optional */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label>Tourism &amp; Operating License</Label>
                    <span className="text-xs text-muted-foreground">
                      Optional
                    </span>
                  </div>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                    onClick={() => tourismLicenseRef.current?.click()}
                  >
                    {tourismLicense ? (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="truncate max-w-[240px] font-medium">
                          {tourismLicense.name}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setTourismLicense(null);
                            if (tourismLicenseRef.current)
                              tourismLicenseRef.current.value = "";
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-sm">Click to upload</span>
                        <span className="text-xs">
                          PDF, JPG or PNG (Max 5MB)
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={tourismLicenseRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setTourismLicense(f);
                    }}
                  />
                </div>

                {/* Tax Card — REQUIRED */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label>Tax Card (Carte Fiscale / NIF)</Label>
                    <span className="text-xs font-medium text-destructive uppercase tracking-wide">
                      Required
                    </span>
                  </div>
                  <div
                    className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                    onClick={() => taxCardRef.current?.click()}
                  >
                    {taxCard ? (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="truncate max-w-[240px] font-medium">
                          {taxCard.name}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            setTaxCard(null);
                            if (taxCardRef.current)
                              taxCardRef.current.value = "";
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-8 w-8" />
                        <span className="text-sm">Click to upload</span>
                        <span className="text-xs">
                          PDF, JPG or PNG (Max 5MB)
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={taxCardRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) setTaxCard(f);
                    }}
                  />
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4">
                  <span className="text-amber-500 text-lg leading-none">
                    ⚠️
                  </span>
                  <p className="text-xs leading-5 text-amber-800 dark:text-amber-300">
                    Files must be clear and readable for admin manual approval.
                    Your account will enter a locked &apos;Awaiting Review&apos;
                    state until the files are verified.
                  </p>
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Review your information</h3>
                <div className="grid gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                  {[
                    [
                      "Account type",
                      role === "agency" ? "Travel Agency" : "Hotel",
                    ],
                    ["Full name", fullName],
                    ["Email", email],
                    ["Legal name", legalName],
                    ["Phone", phone],
                    [
                      "Wilaya",
                      selectedWilayaName
                        ? `${wilaya} – ${selectedWilayaName}`
                        : wilaya || "-",
                    ],
                    ...(taxId ? [["Tax ID", taxId]] : []),
                    ...(licenseNumber ? [["License", licenseNumber]] : []),
                    [
                      "Commercial Registry",
                      commercialRegistry ? commercialRegistry.name : "—",
                    ],
                    [
                      "Tourism License",
                      tourismLicense ? tourismLicense.name : "Not provided",
                    ],
                    ["Tax Card", taxCard ? taxCard.name : "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        {label}
                      </div>
                      <div className="mt-1 break-words font-medium">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-3 pt-1">
                  <input
                    id="agreeToPolicy"
                    type="checkbox"
                    checked={agreedToPolicy}
                    onChange={e => {
                      setAgreedToPolicy(e.target.checked);
                      clearErrors();
                    }}
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
                  />
                  <Label
                    htmlFor="agreeToPolicy"
                    className="text-sm leading-5 cursor-pointer font-normal"
                  >
                    I agree to the{" "}
                    <span className="font-medium text-primary underline underline-offset-2">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="font-medium text-primary underline underline-offset-2">
                      Privacy Policy
                    </span>
                  </Label>
                </div>

                <p className="text-xs leading-5 text-muted-foreground">
                  By submitting, you confirm the information is accurate and
                  ready for admin review.
                </p>
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-3">
              {step > 1 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    clearErrors();
                    setStep(v => Math.max(1, v - 1));
                  }}
                >
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
                <Button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending || !agreedToPolicy}
                >
                  {registerMutation.isPending
                    ? t("loading")
                    : t("auth.register")}
                </Button>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Link
                to="/login"
                className="font-medium text-primary hover:underline"
              >
                {t("auth.login")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
