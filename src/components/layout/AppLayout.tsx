import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  Hotel,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
  UserCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

function getNavItems(role: string, t: (k: string) => string): NavItem[] {
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

function NavLinks({
  items,
  currentPath,
  onNavigate,
}: {
  items: NavItem[];
  currentPath: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = currentPath === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
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
  const userName = (user as any)?.name || (user as any)?.email || "User";
  const navItems = getNavItems(role, t);

  return (
    <div className="app-shell" dir={dir}>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="app-container flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {user && navItems.length > 0 ? (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-[19rem] p-0">
                  <SheetHeader className="border-b px-5 py-4 text-left">
                    <SheetTitle className="flex items-center gap-2">
                      <img src="/logo.png" alt="TRAVEX" className="h-8 w-auto" />
                      TRAVEX
                    </SheetTitle>
                    <SheetDescription>{t("app.tagline")}</SheetDescription>
                  </SheetHeader>
                  <div className="p-4">
                    <NavLinks
                      items={navItems}
                      currentPath={location.pathname}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            ) : null}

            <Link to="/" className="flex min-w-0 items-center gap-2">
              <img src="/logo.png" alt="TRAVEX" className="h-9 w-auto shrink-0" />
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-sm font-semibold leading-none text-foreground">
                  {t("app.name")}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                  {t("app.tagline")}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold uppercase sm:inline">{locale}</span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("fr")}>Francais</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ar")}>Arabic</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate("/notifications")}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount ? (
                    <Badge className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px]">
                      {unreadCount}
                    </Badge>
                  ) : null}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="max-w-[11rem] gap-2">
                      <UserCircle className="h-5 w-5 shrink-0" />
                      <span className="hidden truncate text-sm sm:inline">{userName}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <UserCircle className="me-2 h-4 w-4" />
                      {t("nav.profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="me-2 h-4 w-4" />
                      {t("nav.settings")}
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="me-2 h-4 w-4" />
                      {t("auth.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
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

      <div className="app-container flex min-h-[calc(100vh-4rem)] gap-6 px-0 sm:px-6 lg:px-8">
        {user && navItems.length > 0 ? (
          <aside className="sticky top-20 hidden h-[calc(100vh-5.5rem)] w-64 shrink-0 self-start overflow-y-auto rounded-xl border bg-card p-3 shadow-sm lg:block">
            <div className="mb-3 rounded-lg bg-muted/70 p-3">
              <div className="truncate text-sm font-semibold">{userName}</div>
              <div className="mt-1 truncate text-xs capitalize text-muted-foreground">{role.replace("_", " ")}</div>
            </div>
            <NavLinks items={navItems} currentPath={location.pathname} />
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-0 sm:py-8">{children}</main>
      </div>

      <footer className="border-t border-border/80 bg-card">
        <div className="app-container flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TRAVEX" className="h-6 w-auto" />
            <span>{t("app.name")} (c) 2026</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link to="/terms" className="hover:text-foreground">
              {t("footer.terms")}
            </Link>
            <Link to="/privacy" className="hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            <Link to="/contact" className="hover:text-foreground">
              {t("footer.contact")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
