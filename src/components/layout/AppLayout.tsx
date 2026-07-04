import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import {
  Building2,
  ShoppingCart,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  Receipt,
  Settings,
  Shield,
  Users,
  CheckCircle,
  FileText,
  UserCircle,
  Bell,
  LogOut,
  Menu,
  X,
  Globe,
  ChevronDown,
  Hotel,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getNavItems(role: string, t: (k: string) => string) {
  switch (role) {
    case "agency":
      return [
        { label: t("nav.marketplace"), path: "/marketplace", icon: ShoppingCart },
        { label: t("nav.dashboard"), path: "/dashboard", icon: LayoutDashboard },
        { label: t("nav.invoices"), path: "/invoices", icon: Receipt },
      ];
    case "hotel":
      return [
        { label: t("nav.inventory"), path: "/inventory", icon: Hotel },
        { label: t("nav.requests"), path: "/requests", icon: ClipboardList },
        { label: t("nav.analytics"), path: "/analytics", icon: BarChart3 },
        { label: t("nav.invoices"), path: "/hotel-invoices", icon: Receipt },
      ];
    case "super_admin":
      return [
        { label: t("nav.admin"), path: "/admin", icon: Shield },
        { label: t("nav.verifications"), path: "/admin/verifications", icon: CheckCircle },
        { label: t("nav.users"), path: "/admin/users", icon: Users },
        { label: t("nav.claims"), path: "/admin/claims", icon: FileText },
      ];
    default:
      return [];
  }
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, locale, setLocale, dir } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 30000,
  });

  const role = (user as any)?.role || "";
  const navItems = getNavItems(role, t);
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="TRAVEX" className="h-9 w-auto" />
              <span className="text-lg font-bold text-slate-800 hidden sm:inline">{t("app.name")}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase text-xs font-medium">{locale}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("fr")}>Français</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ar")}>العربية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Notifications */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/notifications")}
              >
                <Bell className="h-5 w-5" />
                {unreadCount ? (
                  <Badge className="absolute -top-1 -end-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-red-500">
                    {unreadCount}
                  </Badge>
                ) : null}
              </Button>
            )}

            {/* Profile / Login */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <UserCircle className="h-5 w-5" />
                    <span className="hidden sm:inline text-sm">{(user as any)?.name || "User"}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserCircle className="h-4 w-4 me-2" />
                    {t("nav.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="h-4 w-4 me-2" />
                    {t("nav.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 me-2" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                  {t("auth.login")}
                </Button>
                <Button size="sm" onClick={() => navigate("/register")}>
                  {t("auth.register")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        {user && navItems.length > 0 && (
          <aside className="hidden lg:block w-64 sticky top-16 h-[calc(100vh-4rem)] bg-white border-e border-slate-200 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* Mobile sidebar */}
        {mobileOpen && user && navItems.length > 0 && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
            <aside className="absolute start-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-e border-slate-200 overflow-y-auto">
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="TRAVEX" className="h-6 w-auto" />
              <span className="text-sm text-slate-500">{t("app.name")} © 2026</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <Link to="/terms" className="hover:text-slate-800">{t("footer.terms")}</Link>
              <Link to="/privacy" className="hover:text-slate-800">{t("footer.privacy")}</Link>
              <Link to="/contact" className="hover:text-slate-800">{t("footer.contact")}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
