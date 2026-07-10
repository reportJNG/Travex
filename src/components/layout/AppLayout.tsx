import { Link, useLocation, useNavigate } from "react-router";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  FileText,
  Globe,
  Hotel,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Phone,
  Receipt,
  ScrollText,
  Send,
  Settings,
  Shield,
  ShoppingCart,
  Upload,
  UserCircle,
  Users,
  Youtube,
  Linkedin,
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
import { TravexLogotype } from "@/components/TravexLogo";

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
        {
          label: t("nav.marketplace"),
          path: "/marketplace",
          icon: ShoppingCart,
        },
        {
          label: t("nav.dashboard"),
          path: "/dashboard",
          icon: LayoutDashboard,
        },
        { label: t("nav.invoices"), path: "/invoices", icon: Receipt },
      ];
    case "hotel":
      return [
        { label: t("nav.inventory"), path: "/inventory", icon: Hotel },
        { label: "Calendar", path: "/inventory/calendar", icon: Calendar },
        { label: t("nav.requests"), path: "/requests", icon: ClipboardList },
        { label: t("nav.analytics"), path: "/analytics", icon: BarChart3 },
        { label: t("nav.invoices"), path: "/hotel-invoices", icon: Receipt },
      ];
    case "super_admin":
      return [
        { label: t("nav.admin"), path: "/admin", icon: Shield },
        {
          label: t("nav.verifications"),
          path: "/admin/verifications",
          icon: CheckCircle,
        },
        {
          label: "Payment Reviews",
          path: "/admin/payment-verifications",
          icon: Upload,
        },
        { label: t("nav.users"), path: "/admin/users", icon: Users },
        { label: t("nav.claims"), path: "/admin/claims", icon: FileText },
        { label: t("admin.invoices"), path: "/admin/invoices", icon: Receipt },
        {
          label: t("admin.auditLogs"),
          path: "/admin/audit-logs",
          icon: ScrollText,
        },
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
      {items.map(item => {
        const active =
          currentPath === item.path ||
          (item.path !== "/" && currentPath.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                active ? "" : "group-hover:scale-110"
              )}
            />
            <span className="truncate">{item.label}</span>
            {active ? (
              <span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />
            ) : null}
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

  const { data: unreadCount } = trpc.notification.unreadCount.useQuery(
    undefined,
    {
      enabled: !!user,
      refetchInterval: 30000,
    }
  );

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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side={dir === "rtl" ? "right" : "left"}
                  className="w-[19rem] p-0"
                >
                  <SheetHeader className="border-b px-5 py-4 text-left">
                    <SheetTitle>
                      <TravexLogotype iconClassName="h-8 w-8" />
                    </SheetTitle>
                    <SheetDescription>{t("app.tagline")}</SheetDescription>
                  </SheetHeader>
                  <div className="p-4">
                    <div className="mb-4 rounded-xl bg-muted/60 px-3 py-2.5">
                      <div className="truncate text-sm font-semibold">
                        {userName}
                      </div>
                      <span
                        className={cn(
                          "mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-medium capitalize",
                          roleColors[role] ?? "bg-muted text-muted-foreground"
                        )}
                      >
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

            <Link
              to="/"
              className="group flex min-w-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${t("app.name")} — ${t("app.tagline")}`}
            >
              <TravexLogotype
                showTagline
                iconClassName="h-10 w-10 transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105"
                className="[&>span:last-child]:hidden sm:[&>span:last-child]:block"
              />
            </Link>
          </div>

          {!user ? (
            <nav className="hidden items-center gap-1 lg:flex">
              <Link
                to="/marketplace"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                Explore Hotels
              </Link>
              <span className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground/60 cursor-default select-none">
                Transport &amp; Logistics
                <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              </span>
              <Link
                to="/about"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
              >
                About
              </Link>
            </nav>
          ) : null}

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold uppercase sm:inline">
                    {locale}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("fr")}>
                  Francais
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>
                  English
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ar")}>
                  Arabic
                </DropdownMenuItem>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="max-w-[11rem] gap-2"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden truncate text-sm sm:inline">
                        {userName}
                      </span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-2 py-1.5">
                      <p className="truncate text-sm font-medium">{userName}</p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {roleBadge}
                      </p>
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
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="me-2 h-4 w-4" />
                      {t("auth.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
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
                  <div className="truncate text-sm font-semibold">
                    {userName}
                  </div>
                  <span
                    className={cn(
                      "inline-block rounded-md px-1.5 py-0.5 text-xs font-medium capitalize",
                      roleColors[role] ?? "bg-muted text-muted-foreground"
                    )}
                  >
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
                {
                  label: t("nav.notifications"),
                  path: "/notifications",
                  icon: Bell,
                },
                { label: t("nav.settings"), path: "/settings", icon: Settings },
              ].map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent/80 hover:text-foreground"
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

        <main
          key={location.pathname}
          className="transition-page min-w-0 flex-1 px-4 py-6 sm:px-0 sm:py-8"
        >
          {children}
        </main>
      </div>

      <footer className="border-t border-slate-800 bg-slate-950 text-slate-400">
        <div className="app-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1 – Brand */}
          <div className="flex flex-col gap-4">
            <TravexLogotype tone="light" iconClassName="h-10 w-10" />
            <p className="text-sm leading-6 text-slate-400">
              © 2026 Travex B2B Marketplace. Global Travel Logistics Simplified.
            </p>
          </div>

          {/* Col 2 – Solutions */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-300">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/marketplace"
                  className="transition-colors hover:text-white"
                >
                  Explore Hotels
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-slate-500 cursor-default">
                  Transport &amp; Logistics
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Soon
                  </span>
                </span>
              </li>
              <li>
                <Link
                  to="/marketplace"
                  className="transition-colors hover:text-white"
                >
                  Partner Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 – Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-300">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  API Documentation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 – Connect */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-300">
              Connect
            </h4>
            <div className="mb-4 flex items-center gap-3">
              <a
                href="#"
                aria-label="Share"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <Send className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <Youtube className="h-3.5 w-3.5" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-primary/20 hover:text-primary"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mb-4 text-xs leading-5 text-slate-500">
              Join our newsletter for exclusive B2B inventory updates.
            </p>
            <div className="space-y-2 text-sm">
              <a
                href="mailto:contact@nexelite.co"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                contact@nexelite.co
              </a>
              <a
                href="tel:+213560000000"
                className="flex items-center gap-2 transition-colors hover:text-white"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                +213 560 000 000
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="app-container flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-600 sm:flex-row">
            <span>© 2026 Travex. All rights reserved.</span>
            <span>Made in Algeria</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
