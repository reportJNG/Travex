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

const roleAccent: Record<string, { badge: string; avatar: string }> = {
  agency: {
    badge: "bg-sky-100 text-sky-700 border-sky-200",
    avatar: "bg-sky-100 text-sky-700",
  },
  hotel: {
    badge: "bg-primary/10 text-primary border-primary/20",
    avatar: "bg-primary/10 text-primary",
  },
  super_admin: {
    badge: "bg-violet-100 text-violet-700 border-violet-200",
    avatar: "bg-violet-100 text-violet-700",
  },
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
        { label: "Calendar", path: "/inventory/calendar", icon: Calendar },
        { label: t("nav.requests"), path: "/requests", icon: ClipboardList },
        { label: t("nav.analytics"), path: "/analytics", icon: BarChart3 },
        { label: t("nav.invoices"), path: "/hotel-invoices", icon: Receipt },
      ];
    case "super_admin":
      return [
        { label: t("nav.admin"), path: "/admin", icon: Shield },
        { label: t("nav.verifications"), path: "/admin/verifications", icon: CheckCircle },
        { label: "Payment Reviews", path: "/admin/payment-verifications", icon: Upload },
        { label: t("nav.users"), path: "/admin/users", icon: Users },
        { label: t("nav.claims"), path: "/admin/claims", icon: FileText },
        { label: t("admin.invoices"), path: "/admin/invoices", icon: Receipt },
        { label: t("admin.auditLogs"), path: "/admin/audit-logs", icon: ScrollText },
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
              "nav-item",
              active ? "nav-item-active" : "nav-item-inactive"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {active && (
              <span className="ms-auto h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function UserAvatar({ name, role, size = "sm" }: { name: string; role: string; size?: "sm" | "md" }) {
  const accent = roleAccent[role] ?? { avatar: "bg-muted text-muted-foreground" };
  const dim = size === "md" ? "h-9 w-9 text-sm" : "h-7 w-7 text-xs";
  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", dim, accent.avatar)}>
      {name.charAt(0).toUpperCase()}
    </div>
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
  const accent = roleAccent[role] ?? { badge: "bg-muted text-muted-foreground border-transparent", avatar: "bg-muted text-muted-foreground" };

  const SidebarUserSection = () => (
    <div className="mb-4 rounded-lg border border-border/60 bg-muted/40 p-3">
      <div className="flex items-center gap-2.5">
        <UserAvatar name={userName} role={role} size="md" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-foreground">{userName}</div>
          <span className={cn("mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", accent.badge)}>
            {roleBadge}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell" dir={dir}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
        <div className="app-container flex h-16 items-center justify-between gap-3">
          {/* Left: mobile menu + logo */}
          <div className="flex min-w-0 items-center gap-2">
            {user && navItems.length > 0 ? (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-72 p-0">
                  <SheetHeader className="border-b px-5 py-4 text-left">
                    <SheetTitle>
                      <TravexLogotype iconClassName="h-8 w-8" />
                    </SheetTitle>
                    <SheetDescription>{t("app.tagline")}</SheetDescription>
                  </SheetHeader>
                  <div className="p-4">
                    <SidebarUserSection />
                    <NavLinks items={navItems} currentPath={location.pathname} onNavigate={() => setMobileOpen(false)} />
                    <Separator className="my-3" />
                    <nav className="space-y-0.5">
                      {[
                        { label: t("nav.profile"), path: "/profile", icon: UserCircle },
                        { label: t("nav.notifications"), path: "/notifications", icon: Bell },
                        { label: t("nav.settings"), path: "/settings", icon: Settings },
                      ].map(item => {
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen(false)}
                            className={cn("nav-item", active ? "nav-item-active" : "nav-item-inactive")}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                            {item.path === "/notifications" && unreadCount ? (
                              <Badge className="ms-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px]">
                                {unreadCount}
                              </Badge>
                            ) : null}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
            ) : null}

            <Link
              to="/"
              className="group flex min-w-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`${t("app.name")} — ${t("app.tagline")}`}
            >
              <TravexLogotype
                showTagline
                iconClassName="h-9 w-9 transition-transform duration-300 group-hover:scale-105"
                className="[&>span:last-child]:hidden sm:[&>span:last-child]:block"
              />
            </Link>
          </div>

          {/* Center: nav links for public */}
          {!user ? (
            <nav className="hidden items-center gap-0.5 lg:flex">
              <Link
                to="/marketplace"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
              >
                Explore Hotels
              </Link>
              <span className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground/50 cursor-default select-none">
                Transport
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  Soon
                </span>
              </span>
              <Link
                to="/about"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-accent hover:text-foreground"
              >
                About
              </Link>
            </nav>
          ) : null}

          {/* Right: controls */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                  <Globe className="h-4 w-4" />
                  <span className="hidden text-xs font-semibold uppercase sm:inline">{locale}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocale("fr")}>Français</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("en")}>English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale("ar")}>العربية</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground hover:text-foreground"
                  onClick={() => navigate("/notifications")}
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount ? (
                    <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  ) : null}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="max-w-[12rem] gap-2 rounded-lg">
                      <UserAvatar name={userName} role={role} />
                      <span className="hidden truncate text-sm sm:inline">{userName}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-2 py-2">
                      <p className="truncate text-sm font-semibold">{userName}</p>
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

      {/* Body: sidebar + main */}
      <div className="app-container flex min-h-[calc(100vh-4rem)] gap-6 px-0 sm:px-6 lg:px-8">
        {user && navItems.length > 0 ? (
          <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-5rem)] w-60 shrink-0 self-start overflow-y-auto lg:block">
            <div className="flex h-full flex-col rounded-xl border border-border/70 bg-card px-3 py-3 shadow-sm">
              <SidebarUserSection />
              <NavLinks items={navItems} currentPath={location.pathname} />
              <div className="mt-auto">
                <Separator className="my-3" />
                <nav className="space-y-0.5">
                  {[
                    { label: t("nav.profile"), path: "/profile", icon: UserCircle },
                    { label: t("nav.notifications"), path: "/notifications", icon: Bell },
                    { label: t("nav.settings"), path: "/settings", icon: Settings },
                  ].map(item => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn("nav-item", active ? "nav-item-active" : "nav-item-inactive")}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.path === "/notifications" && unreadCount ? (
                          <Badge className="ms-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px]">
                            {unreadCount}
                          </Badge>
                        ) : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>
        ) : null}

        <main
          key={location.pathname}
          className="transition-page min-w-0 flex-1 px-4 py-8 sm:px-0"
        >
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0e1628] text-slate-400">
        <div className="app-container grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <TravexLogotype tone="light" iconClassName="h-10 w-10" />
            <p className="text-sm leading-relaxed text-slate-400/80">
              B2B hotel marketplace built for Algeria's travel industry.
            </p>
            <p className="text-xs text-slate-600">© 2026 Travex. All rights reserved.</p>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/marketplace" className="transition-colors hover:text-white">
                  Explore Hotels
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-slate-500 cursor-default">
                  Transport &amp; Logistics
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Soon
                  </span>
                </span>
              </li>
              <li>
                <Link to="/marketplace" className="transition-colors hover:text-white">
                  Partner Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
              Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="transition-colors hover:text-white">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">Terms of Service</Link>
              </li>
              <li>
                <Link to="/" className="transition-colors hover:text-white">API Documentation</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-300">
              Connect
            </h4>
            <div className="mb-5 flex items-center gap-2.5">
              {[
                { icon: Send, label: "Share" },
                { icon: Youtube, label: "YouTube" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 transition-colors hover:bg-primary/20 hover:text-primary"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
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

        <div className="border-t border-slate-800/60">
          <div className="app-container flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-700 sm:flex-row">
            <span>© 2026 Travex. All rights reserved.</span>
            <span>Made in Algeria 🇩🇿</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
