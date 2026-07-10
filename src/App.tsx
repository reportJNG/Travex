import { Routes, Route, Navigate } from "react-router";
import { lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ShieldAlert, XCircle } from "lucide-react";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const RegisterSubmitted = lazy(() => import("./pages/RegisterSubmitted"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const HotelDetail = lazy(() => import("./pages/HotelDetail"));
const OfflinePayment = lazy(() => import("./pages/OfflinePayment"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Inventory = lazy(() => import("./pages/Inventory"));
const InventoryCalendar = lazy(() => import("./pages/InventoryCalendar"));
const Requests = lazy(() => import("./pages/Requests"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Invoices = lazy(() => import("./pages/Invoices"));
const HotelInvoices = lazy(() => import("./pages/HotelInvoices"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminVerifications = lazy(() => import("./pages/AdminVerifications"));
const AdminPaymentVerifications = lazy(() => import("./pages/AdminPaymentVerifications"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminClaims = lazy(() => import("./pages/AdminClaims"));
const AdminInvoices = lazy(() => import("./pages/AdminInvoices"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const role = (user as any)?.role || "";
  const status = (user as any)?.status || "";

  if (status === "awaiting_review") return <Navigate to="/pending" />;
  if (status === "rejected") return <Navigate to="/rejected" />;
  if (status === "suspended") return <Navigate to="/suspended" />;

  if (!allowedRoles.includes(role)) {
    if (role === "agency") return <Navigate to="/marketplace" />;
    if (role === "hotel") return <Navigate to="/inventory" />;
    if (role === "super_admin") return <Navigate to="/admin" />;
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AppLayout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register/submitted" element={<RegisterSubmitted />} />
          <Route
            path="/marketplace"
            element={
              <RoleGuard allowedRoles={["agency", "hotel", "super_admin"]}>
                <Marketplace />
              </RoleGuard>
            }
          />
          <Route
            path="/hotel/:id"
            element={
              <RoleGuard allowedRoles={["agency", "hotel", "super_admin"]}>
                <HotelDetail />
              </RoleGuard>
            }
          />

          {/* Holding pages */}
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/rejected" element={<RejectedPage />} />
          <Route path="/suspended" element={<SuspendedPage />} />

          {/* Booking flow — agency only */}
          <Route
            path="/booking/:id/offline-payment"
            element={
              <RoleGuard allowedRoles={["agency"]}>
                <OfflinePayment />
              </RoleGuard>
            }
          />
          <Route
            path="/booking/:id/payment-result"
            element={
              <RoleGuard allowedRoles={["agency"]}>
                <PaymentResult />
              </RoleGuard>
            }
          />
          <Route
            path="/booking/:id/confirmation"
            element={
              <RoleGuard allowedRoles={["agency"]}>
                <BookingConfirmation />
              </RoleGuard>
            }
          />

          {/* Agency */}
          <Route
            path="/dashboard"
            element={
              <RoleGuard allowedRoles={["agency"]}>
                <Dashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/invoices"
            element={
              <RoleGuard allowedRoles={["agency"]}>
                <Invoices />
              </RoleGuard>
            }
          />

          {/* Hotel */}
          <Route
            path="/inventory"
            element={
              <RoleGuard allowedRoles={["hotel"]}>
                <Inventory />
              </RoleGuard>
            }
          />
          <Route
            path="/inventory/calendar"
            element={
              <RoleGuard allowedRoles={["hotel"]}>
                <InventoryCalendar />
              </RoleGuard>
            }
          />
          <Route
            path="/requests"
            element={
              <RoleGuard allowedRoles={["hotel"]}>
                <Requests />
              </RoleGuard>
            }
          />
          <Route
            path="/analytics"
            element={
              <RoleGuard allowedRoles={["hotel"]}>
                <Analytics />
              </RoleGuard>
            }
          />
          <Route
            path="/hotel-invoices"
            element={
              <RoleGuard allowedRoles={["hotel"]}>
                <HotelInvoices />
              </RoleGuard>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminVerifications />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/payment-verifications"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminPaymentVerifications />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminUsers />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/claims"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminClaims />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/invoices"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminInvoices />
              </RoleGuard>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleGuard allowedRoles={["super_admin"]}>
                <AdminAuditLogs />
              </RoleGuard>
            }
          />

          {/* Shared */}
          <Route
            path="/profile"
            element={
              <RoleGuard allowedRoles={["agency", "hotel", "super_admin"]}>
                <Profile />
              </RoleGuard>
            }
          />
          <Route
            path="/notifications"
            element={
              <RoleGuard allowedRoles={["agency", "hotel", "super_admin"]}>
                <Notifications />
              </RoleGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleGuard allowedRoles={["agency", "hotel", "super_admin"]}>
                <Settings />
              </RoleGuard>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

function RouteFallback() {
  return (
    <div
      className="flex min-h-[55vh] items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-[#9c72be]" />
      </div>
    </div>
  );
}

function PendingPage() {
  const { user } = useAuth();
  const email = (user as any)?.email || "";
  const legalName = (user as any)?.profile?.legalName || (user as any)?.name || "";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="px-6 py-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Clock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Account under review</h1>
          {legalName ? (
            <p className="mt-1 text-sm font-medium text-muted-foreground">{legalName}</p>
          ) : null}
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Your business registration is being manually reviewed by the Travex
            team. This typically takes 1–2 business days. You will receive a
            notification at <strong>{email}</strong> once a decision is made.
          </p>
          <div className="mt-6 space-y-2 rounded-xl border bg-muted/40 px-4 py-4 text-left text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">1</span>
              Business profile submitted
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">2</span>
              Document review in progress
            </p>
            <p className="flex items-center gap-2 text-muted-foreground/50">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">3</span>
              Account activation
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <a href="/">Back to home</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:contact@nexelite.co">Contact support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RejectedPage() {
  const { user } = useAuth();
  const reason = (user as any)?.profile?.rejectionReason || "";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="px-6 py-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Application not approved</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Your business registration was not approved at this time.
          </p>
          {reason ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-800">
              <p className="font-semibold">Reason provided:</p>
              <p className="mt-1">{reason}</p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <a href="mailto:contact@nexelite.co">Contact support</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Back to home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SuspendedPage() {
  const { user } = useAuth();
  const reason = (user as any)?.profile?.rejectionReason || "";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardContent className="px-6 py-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Account suspended</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Your account has been suspended and marketplace operations are temporarily
            unavailable. You can still access your notifications and contact support.
          </p>
          {reason ? (
            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-left text-sm text-orange-800">
              <p className="font-semibold">Reason:</p>
              <p className="mt-1">{reason}</p>
            </div>
          ) : null}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <a href="mailto:contact@nexelite.co">Contact support</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/">Back to home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
