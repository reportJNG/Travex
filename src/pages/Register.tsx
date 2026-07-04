import { useState } from "react";
import { Link } from "react-router";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, Plane, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";

export default function Register() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Form data
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

  const handleSubmit = () => {
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!fullName || !email || !password || !legalName || !phone) {
      setError("All fields are required");
      return;
    }

    registerMutation.mutate({
      role,
      fullName,
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
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Registration Submitted!</h2>
            <p className="text-slate-500">
              Your account has been created and is pending review. You will receive a notification once your account is approved.
            </p>
            <Link to="/login">
              <Button className="w-full mt-4">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-2">
          <img src="/logo.png" alt="TRAVEX" className="h-10 w-auto mx-auto" />
          <CardTitle className="text-xl">{t("auth.register")}</CardTitle>
          <p className="text-sm text-slate-500">
            {t("auth.step")} {step} {t("auth.of")} 4
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Role */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base">{t("auth.role")}</Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as "agency" | "hotel")}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="agency" id="agency" className="peer sr-only" />
                  <Label
                    htmlFor="agency"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-50 cursor-pointer transition-all"
                  >
                    <Plane className="h-8 w-8 mb-2 text-slate-400 peer-data-[state=checked]:text-teal-600" />
                    <span className="font-medium">{t("auth.role.agency")}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="hotel" id="hotel" className="peer sr-only" />
                  <Label
                    htmlFor="hotel"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-slate-200 p-4 hover:bg-slate-50 peer-data-[state=checked]:border-teal-600 peer-data-[state=checked]:bg-teal-50 cursor-pointer transition-all"
                  >
                    <Building2 className="h-8 w-8 mb-2 text-slate-400 peer-data-[state=checked]:text-teal-600" />
                    <span className="font-medium">{t("auth.role.hotel")}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Credentials */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")} *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regEmail">{t("auth.email")} *</Label>
                <Input
                  id="regEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regPassword">{t("auth.password")} *</Label>
                <Input
                  id="regPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Identity */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="legalName">{t("auth.legalName")} *</Label>
                <Input
                  id="legalName"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Company legal name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")} *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213555123456"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wilaya">{t("auth.wilaya")} *</Label>
                <Input
                  id="wilaya"
                  type="number"
                  min={1}
                  max={58}
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  placeholder="16 (Algiers)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">{t("auth.taxId")}</Label>
                <Input
                  id="taxId"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              {role === "hotel" && (
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">{t("auth.licenseNumber")}</Label>
                  <Input
                    id="licenseNumber"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-medium text-slate-800">Review your information</h3>
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium capitalize">{role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-medium">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Legal Name</span>
                  <span className="font-medium">{legalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-medium">{phone}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                By submitting, you agree to our Terms of Service and confirm that all information provided is accurate.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 me-1" />
                {t("back")}
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button
                onClick={() => {
                  setError("");
                  if (step === 2) {
                    if (!fullName || !email || !password || !confirmPassword) {
                      setError("All fields are required");
                      return;
                    }
                    if (password !== confirmPassword) {
                      setError("Passwords do not match");
                      return;
                    }
                  }
                  if (step === 3) {
                    if (!legalName || !phone || !wilaya) {
                      setError("All required fields must be filled");
                      return;
                    }
                    if (role === "hotel" && !taxId && !licenseNumber) {
                      setError("Hotel accounts must provide Tax ID or License Number");
                      return;
                    }
                  }
                  setStep(step + 1);
                }}
              >
                {t("next")}
                <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={registerMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {registerMutation.isPending ? "..." : t("auth.register")}
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-slate-500 pt-2">
            {t("auth.hasAccount")}{" "}
            <Link to="/login" className="text-teal-600 hover:underline font-medium">
              {t("auth.login")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
