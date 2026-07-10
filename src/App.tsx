import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Marketplace from "./pages/Marketplace";
import HotelDetail from "./pages/HotelDetail";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Requests from "./pages/Requests";
import Analytics from "./pages/Analytics";
import Invoices from "./pages/Invoices";
import HotelInvoices from "./pages/HotelInvoices";
import AdminDashboard from "./pages/AdminDashboard";
import AdminVerifications from "./pages/AdminVerifications";
import AdminUsers from "./pages/AdminUsers";
import AdminClaims from "./pages/AdminClaims";
import AdminInvoices from "./pages/AdminInvoices";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ShieldAlert, XCircle } from "lucide-react";

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
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
    </AppLayout>
  );
}

function PendingPage() {
  return <AccountState icon={<Clock className="h-8 w-8" />} tone="amber" title="Account under review" description="Your account is currently being reviewed by our team. This usually takes 24 hours. You will receive a notification once your account is approved." />;
}

function RejectedPage() {
  return <AccountState icon={<XCircle className="h-8 w-8" />} tone="rose" title="Account rejected" description="Your account verification was rejected. Please contact support for more information and next steps." />;
}

function SuspendedPage() {
  return <AccountState icon={<ShieldAlert className="h-8 w-8" />} tone="orange" title="Account suspended" description="Your account has been suspended. Please contact support to resolve this issue." />;
}

function AccountState({
  icon,
  title,
  description,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: "amber" | "rose" | "orange";
}) {
  const toneClass = {
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    orange: "bg-orange-100 text-orange-700",
  }[tone];

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="px-6 py-10">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${toneClass}`}>
            {icon}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
          <Button className="mt-6" asChild>
            <a href="/">Back to home</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
