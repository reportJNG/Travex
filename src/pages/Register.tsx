import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileCheck,
  Plane,
  UploadCloud,
  X,
} from "lucide-react";
import { z } from "zod";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TravexLogotype } from "@/components/TravexLogo";
import { cn } from "@/lib/utils";

const totalSteps = 5;

const step2Schema = z
  .object({
    fullName: z.string().trim().min(3, "Le nom complet doit comporter au moins 3 caractères"),
    email: z.string().trim().email("Entrez une adresse e-mail valide"),
    password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

const step3Schema = z.object({
  legalName: z.string().trim().min(2, "Le nom légal doit comporter au moins 2 caractères"),
  phone: z.string().trim().min(8, "Entrez un numéro de téléphone valide"),
  country: z.string().min(1, "Veuillez sélectionner un pays"),
  wilaya: z.string().min(1, "Veuillez sélectionner une wilaya"),
});

const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

type FieldErrors = Record<string, string>;

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-1 text-xs text-destructive">{message}</p>
  ) : null;
}

const STEP_LABELS = [
  "Type de compte",
  "Identité",
  "Entreprise",
  "Documents",
  "Vérification",
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<"DZ" | "TN">("DZ");
  const [wilaya, setWilaya] = useState("");
  const [taxId, setTaxId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [commercialRegistry, setCommercialRegistry] = useState<File | null>(null);
  const [tourismLicense, setTourismLicense] = useState<File | null>(null);
  const [taxCard, setTaxCard] = useState<File | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const commercialRegistryRef = useRef<HTMLInputElement>(null);
  const tourismLicenseRef = useRef<HTMLInputElement>(null);
  const taxCardRef = useRef<HTMLInputElement>(null);

  const { data: countries } = trpc.marketplace.listCountries.useQuery();
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery({ country });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => navigate("/register/submitted"),
    onError: err => {
      if (err.message === "EMAIL_EXISTS")
        setError("Cet e-mail est déjà enregistré. Veuillez vous connecter.");
      else if (err.message === "PHONE_INVALID")
        setError(country === "TN" ? "Numéro de téléphone invalide. Format : +216XXXXXXXX" : "Numéro de téléphone invalide. Format : +213XXXXXXXXX");
      else if (err.message === "REGION_INVALID")
        setError("La région sélectionnée ne correspond pas au pays choisi.");
      else if (err.message === "TAX_OR_LICENSE_REQUIRED")
        setError("Les comptes hôtel doivent fournir un NIF ou un numéro d'agrément.");
      else setError(err.message || "Inscription échouée. Réessayez.");
    },
  });

  const clearErrors = () => {
    setError("");
    setFieldErrors({});
  };

  const validateStep = (current: number): boolean => {
    clearErrors();
    if (current === 2) {
      const result = step2Schema.safeParse({ fullName, email, password, confirmPassword });
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
      const result = step3Schema.safeParse({ legalName, phone, country, wilaya });
      if (!result.success) {
        const errors: FieldErrors = {};
        for (const issue of result.error.issues) {
          const field = issue.path[0] as string;
          if (!errors[field]) errors[field] = issue.message;
        }
        setFieldErrors(errors);
        return false;
      }
      if (role === "hotel" && !taxId.trim() && !licenseNumber.trim()) {
        setError("Les comptes hôtel doivent fournir un NIF ou un numéro d'agrément");
        return false;
      }
    }
    if (current === 4) {
      if (!commercialRegistry) {
        setError("Le Registre de Commerce est requis.");
        return false;
      }
      if (!taxCard) {
        setError("La Carte Fiscale (NIF) est requise.");
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
      setError("Vous devez accepter les Conditions d'utilisation et la Politique de confidentialité.");
      return;
    }
    registerMutation.mutate({
      role,
      fullName: fullName.trim(),
      legalName: legalName.trim(),
      email: email.trim(),
      password,
      phone: phone.trim(),
      country,
      wilaya: parseInt(wilaya) || 1,
      taxId: taxId.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
      locale: "fr",
    });
  };

  const selectedCountryName = countries?.find(c => c.code === country)?.nameFr;
  const selectedWilayaName = wilayas?.find(w => String(w.code) === wilaya)?.nameFr;
  const regionLabel = country === "TN" ? "Gouvernorat" : "Wilaya";

  return (
    <div className="grid min-h-[calc(100vh-12rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left panel */}
      <div className="hidden bg-slate-950 lg:block">
        <div className="relative h-full min-h-[680px]">
          <img
            src="/media/travex-auth-lobby.webp"
            alt="Hôtel algérien contemporain"
            width="1024"
            height="1536"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17213e] via-[#17213e]/50 to-transparent" />
          <div className="absolute bottom-0 p-10 text-white">
            <TravexLogotype tone="light" iconClassName="h-12 w-12" className="mb-6" />
            <h2 className="max-w-md text-3xl font-bold tracking-tight">
              Rejoignez un réseau B2B vérifié.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
              Les agences réservent dans les hôtels de confiance. Les hôtels gèrent
              l'inventaire et les demandes. Les admins maintiennent la qualité du marketplace.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: "✓", text: "Vérification manuelle par l'équipe Travex" },
                { icon: "✓", text: "Tarifs B2B exclusifs et négociés" },
                { icon: "✓", text: "Plateforme 100% algérienne" },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/30 text-xs font-bold text-primary">
                    {item.icon}
                  </span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-start justify-center overflow-y-auto p-4 pt-8 sm:p-8 sm:pt-10">
        <div className="w-full max-w-xl">
          <TravexLogotype className="mb-6 lg:hidden" iconClassName="h-10 w-10" />

          {/* Step indicator */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("auth.register")}
              </h1>
              <span className="text-xs font-medium text-muted-foreground">
                {step} / {totalSteps}
              </span>
            </div>

            {/* Step bubbles */}
            <div className="flex items-center gap-0">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const n = i + 1;
                const done = n < step;
                const active = n === step;
                return (
                  <div key={n} className="flex flex-1 items-center">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                        done
                          ? "bg-primary text-primary-foreground"
                          : active
                            ? "bg-primary/15 text-primary ring-2 ring-primary ring-offset-1"
                            : "bg-muted text-muted-foreground/60"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : n}
                    </div>
                    {i < totalSteps - 1 && (
                      <div
                        className={cn(
                          "h-0.5 flex-1 transition-all",
                          n < step ? "bg-primary" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-2">
              <p className="text-sm font-semibold text-foreground">
                {STEP_LABELS[step - 1]}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <X className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1 — Role */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Quel type de compte souhaitez-vous créer ?
              </p>
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
                    desc: "Réservez des hôtels à des tarifs B2B exclusifs",
                    color: "text-primary",
                    bg: "bg-primary/10",
                  },
                  {
                    value: "hotel",
                    label: t("auth.role.hotel"),
                    icon: Building2,
                    desc: "Gérez l'inventaire et les demandes de réservation",
                    color: "text-sky-600",
                    bg: "bg-sky-100",
                  },
                ].map(item => (
                  <Label
                    key={item.value}
                    htmlFor={item.value}
                    className={cn(
                      "relative cursor-pointer overflow-hidden rounded-xl border p-5 transition-all hover:shadow-sm",
                      role === item.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-border/80"
                    )}
                  >
                    <RadioGroupItem
                      value={item.value}
                      id={item.value}
                      className="sr-only"
                    />
                    {role === item.value && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                    <div
                      className={cn(
                        "mb-3 flex h-11 w-11 items-center justify-center rounded-xl",
                        role === item.value ? item.bg : "bg-muted"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          role === item.value ? item.color : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <span className="block font-semibold text-foreground">{item.label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {item.desc}
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Step 2 — Identity */}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="fullName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nom complet *
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={e => { setFullName(e.target.value); clearErrors(); }}
                  placeholder="Ahmed Benali"
                  className={cn("h-10", fieldErrors.fullName && "border-destructive")}
                />
                <FieldError message={fieldErrors.fullName} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  E-mail *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearErrors(); }}
                  placeholder="email@example.com"
                  className={cn("h-10", fieldErrors.email && "border-destructive")}
                />
                <FieldError message={fieldErrors.email} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Mot de passe *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearErrors(); }}
                    placeholder="Min. 8 caractères"
                    className={cn("h-10 pe-10", fieldErrors.password && "border-destructive")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={fieldErrors.password} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confirmation *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); clearErrors(); }}
                    placeholder="Répétez le mot de passe"
                    className={cn("h-10 pe-10", fieldErrors.confirmPassword && "border-destructive")}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(v => !v)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <FieldError message={fieldErrors.confirmPassword} />
              </div>
            </div>
          )}

          {/* Step 3 — Business */}
          {step === 3 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="legalName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Nom légal / Raison sociale *
                </Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={e => { setLegalName(e.target.value); clearErrors(); }}
                  placeholder="Nom de l'entreprise"
                  className={cn("h-10", fieldErrors.legalName && "border-destructive")}
                />
                <FieldError message={fieldErrors.legalName} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Téléphone *
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); clearErrors(); }}
                  placeholder={country === "TN" ? "+216 XX XXX XXX" : "+213 5XX XXX XXX"}
                  className={cn("h-10", fieldErrors.phone && "border-destructive")}
                />
                <FieldError message={fieldErrors.phone} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pays *
                </Label>
                <Select
                  value={country}
                  onValueChange={v => {
                    setCountry(v as "DZ" | "TN");
                    setWilaya("");
                    clearErrors();
                  }}
                >
                  <SelectTrigger className={cn("h-10", fieldErrors.country && "border-destructive")}>
                    <SelectValue placeholder="Sélectionner un pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={fieldErrors.country} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {regionLabel} *
                </Label>
                <Select
                  value={wilaya}
                  onValueChange={v => { setWilaya(v); clearErrors(); }}
                >
                  <SelectTrigger className={cn("h-10", fieldErrors.wilaya && "border-destructive")}>
                    <SelectValue placeholder={`Sélectionner ${country === "TN" ? "un gouvernorat" : "une wilaya"}`} />
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
                <Label htmlFor="taxId" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  NIF / Identifiant fiscal {role === "hotel" ? "*" : ""}
                </Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={e => setTaxId(e.target.value)}
                  placeholder="Numéro fiscal"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Numéro d'agrément {role === "hotel" ? "*" : ""}
                </Label>
                <Input
                  id="licenseNumber"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  placeholder="Numéro d'agrément"
                  className="h-10"
                />
              </div>
              {role === "hotel" && (
                <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  * Les comptes hôtel doivent fournir au moins un NIF ou un numéro d'agrément.
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Documents */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Les documents doivent être lisibles pour la vérification manuelle par l'équipe Travex.
              </p>

              {(
                [
                  {
                    label: "Registre de Commerce",
                    sublabel: "Requis",
                    required: true,
                    file: commercialRegistry,
                    ref: commercialRegistryRef,
                    set: setCommercialRegistry,
                    clearRef: commercialRegistryRef,
                  },
                  {
                    label: "Licence de tourisme et d'exploitation",
                    sublabel: "Optionnel",
                    required: false,
                    file: tourismLicense,
                    ref: tourismLicenseRef,
                    set: setTourismLicense,
                    clearRef: tourismLicenseRef,
                  },
                  {
                    label: "Carte Fiscale / NIF",
                    sublabel: "Requis",
                    required: true,
                    file: taxCard,
                    ref: taxCardRef,
                    set: setTaxCard,
                    clearRef: taxCardRef,
                  },
                ] as const
              ).map(item => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.label}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        item.required
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.sublabel}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-colors",
                      item.file
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                    )}
                    onClick={() => item.ref.current?.click()}
                  >
                    {item.file ? (
                      <>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileCheck className="h-5 w-5" />
                        </div>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                          {item.file.name}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                          onClick={e => {
                            e.stopPropagation();
                            item.set(null);
                            if (item.clearRef.current) item.clearRef.current.value = "";
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <UploadCloud className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Cliquer pour téléverser
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, JPG ou PNG (Max 5 Mo)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <input
                    ref={item.ref}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (!ACCEPTED_DOCUMENT_TYPES.includes(f.type)) {
                        setError("Format de document invalide. Utilisez PDF, JPG, PNG ou WEBP.");
                        e.target.value = "";
                        return;
                      }
                      if (f.size > MAX_DOCUMENT_SIZE) {
                        setError("Le document ne doit pas dépasser 5 Mo.");
                        e.target.value = "";
                        return;
                      }
                      clearErrors();
                      item.set(f);
                    }}
                  />
                </div>
              ))}

              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                <span className="mt-0.5 text-amber-500">⚠</span>
                <p className="text-xs leading-5 text-amber-800">
                  Votre compte entrera en état « En attente de révision » jusqu'à ce que les documents soient vérifiés par l'équipe Travex. Cela prend généralement 1–2 jours ouvrables.
                </p>
              </div>
            </div>
          )}

          {/* Step 5 — Review */}
          {step === 5 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Vérifiez vos informations avant de soumettre votre demande.
              </p>

              <div className="rounded-xl border border-border bg-muted/30">
                <div className="grid gap-0 divide-y divide-border">
                  {(
                    [
                      ["Type de compte", role === "agency" ? "Agence de voyage" : "Hôtel"],
                      ["Nom complet", fullName],
                      ["E-mail", email],
                      ["Nom légal", legalName],
                      ["Téléphone", phone],
                      ["Pays", selectedCountryName || country],
                      [regionLabel, selectedWilayaName ? `${wilaya} – ${selectedWilayaName}` : wilaya || "—"],
                      ...(taxId ? [["NIF fiscal", taxId]] : []),
                      ...(licenseNumber ? [["Agrément", licenseNumber]] : []),
                      ["Registre de Commerce", commercialRegistry ? commercialRegistry.name : "—"],
                      ["Licence de tourisme", tourismLicense ? tourismLicense.name : "Non fourni"],
                      ["Carte Fiscale", taxCard ? taxCard.name : "—"],
                    ] as [string, string][]
                  ).map(([label, value]) => (
                    <div key={label} className="flex items-start gap-4 px-4 py-3">
                      <span className="w-40 shrink-0 text-xs font-medium text-muted-foreground">
                        {label}
                      </span>
                      <span className="min-w-0 break-words text-sm font-medium text-foreground">
                        {value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="agreeToPolicy"
                  type="checkbox"
                  checked={agreedToPolicy}
                  onChange={e => { setAgreedToPolicy(e.target.checked); clearErrors(); }}
                  className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-primary"
                />
                <Label
                  htmlFor="agreeToPolicy"
                  className="cursor-pointer text-sm leading-5 font-normal text-foreground"
                >
                  J'accepte les{" "}
                  <span className="font-medium text-primary underline underline-offset-2">
                    Conditions d'utilisation
                  </span>{" "}
                  et la{" "}
                  <span className="font-medium text-primary underline underline-offset-2">
                    Politique de confidentialité
                  </span>
                </Label>
              </div>
            </div>
          )}

          {/* Navigation */}
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
        </div>
      </div>
    </div>
  );
}
