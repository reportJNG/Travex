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
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

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
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/hotel/:id" element={<HotelDetail />} />

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
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Under Review</h1>
      <p className="text-slate-500 max-w-md">
        Your account is currently being reviewed by our team. This usually takes 24 hours. You will receive a notification once your account is approved.
      </p>
    </div>
  );
}

function RejectedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Rejected</h1>
      <p className="text-slate-500 max-w-md">
        Unfortunately, your account verification was rejected. Please contact our support team for more information.
      </p>
    </div>
  );
}

function SuspendedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Account Suspended</h1>
      <p className="text-slate-500 max-w-md">
        Your account has been suspended. Please contact our support team to resolve this issue.
      </p>
    </div>
  );
}
