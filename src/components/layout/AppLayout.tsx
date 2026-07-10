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

const roleColors: Record<string, string> = {
  agency: "bg-sky-100 text-sky-700",
  hotel: "bg-primary/10 text-primary",
  super_admin: "bg-violet-100 text-violet-700",
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
        { label: t("admin.invoices"), path: "/admin/invoices", icon: Receipt },
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
    <nav className="space-y-0.5">
      {items.map((item) => {
        const active = currentPath === item.path || (item.path !== "/" && currentPath.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0 transition-transform", active ? "" : "group-hover:scale-110")} />
            <span className="truncate">{item.label}</span>
            {active ? <span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/70" /> : null}
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
  const roleBadge = role.replace("_", " ");

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
                    <div className="mb-4 rounded-xl bg-muted/60 px-3 py-2.5">
                      <div className="truncate text-sm font-semibold">{userName}</div>
                      <span className={cn("mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize", roleColors[role] ?? "bg-muted text-muted-foreground")}>
                        {roleBadge}
                      </span>
                    </div>
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
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  ) : null}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="max-w-[11rem] gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden truncate text-sm sm:inline">{userName}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-2 py-1.5">
                      <p className="truncate text-sm font-medium">{userName}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">{roleBadge}</p>
                    </div>
                    <Separator className="my-1" />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <UserCircle className="me-2 h-4 w-4" />
                      {t("nav.profile")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <Settings className="me-2 h-4 w-4" />
                      {t("nav.settings")}
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
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
            <div className="mb-4 rounded-xl bg-muted/50 px-3 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{userName}</div>
                  <span className={cn("inline-block rounded-md px-1.5 py-0.5 text-xs font-medium capitalize", roleColors[role] ?? "bg-muted text-muted-foreground")}>
                    {roleBadge}
                  </span>
                </div>
              </div>
            </div>
            <NavLinks items={navItems} currentPath={location.pathname} />
            <Separator className="my-3" />
            <nav className="space-y-0.5">
              {[
                { label: t("nav.profile"), path: "/profile", icon: UserCircle },
                { label: t("nav.notifications"), path: "/notifications", icon: Bell },
                { label: t("nav.settings"), path: "/settings", icon: Settings },
              ].map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent/80 hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {item.path === "/notifications" && unreadCount ? (
                      <Badge className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px]">
                        {unreadCount}
                      </Badge>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </aside>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-0 sm:py-8">{children}</main>
      </div>

      <footer className="border-t border-border/80 bg-card">
        <div className="app-container flex flex-col gap-3 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="TRAVEX" className="h-6 w-auto" />
            <span className="font-medium text-foreground">{t("app.name")}</span>
            <span>© 2026</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-muted-foreground">B2B hotel booking platform for Algeria</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
