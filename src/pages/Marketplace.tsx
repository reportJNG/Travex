import { useState } from "react";
import { Link } from "react-router";
import { Filter, MapPin, Search, Star, UtensilsCrossed, Waves, Wifi, Car } from "lucide-react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  pool: <Waves className="h-3.5 w-3.5" />,
  restaurant: <UtensilsCrossed className="h-3.5 w-3.5" />,
  parking: <Car className="h-3.5 w-3.5" />,
};

function Stars({ count }: { count?: number | null }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export default function Marketplace() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [wilayaFilter, setWilayaFilter] = useState<number | undefined>();
  const [starsFilter, setStarsFilter] = useState<number | undefined>();

  const { data: hotels, isLoading } = trpc.marketplace.listHotels.useQuery({
    search: search || undefined,
    wilaya: wilayaFilter,
    stars: starsFilter,
    page: 1,
    limit: 24,
  });
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery();

  const filterControls = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>{t("marketplace.wilaya")}</Label>
        <Select
          value={wilayaFilter ? String(wilayaFilter) : "all"}
          onValueChange={(value) => setWilayaFilter(value === "all" ? undefined : Number(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("marketplace.allWilayas")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("marketplace.allWilayas")}</SelectItem>
            {wilayas?.map((wilaya) => (
              <SelectItem key={wilaya.code} value={String(wilaya.code)}>
                {wilaya.code} - {wilaya.nameFr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("marketplace.stars")}</Label>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((stars) => (
            <Button
              key={stars}
              type="button"
              variant={starsFilter === stars ? "default" : "outline"}
              size="sm"
              onClick={() => setStarsFilter(starsFilter === stars ? undefined : stars)}
            >
              {stars}
            </Button>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setWilayaFilter(undefined);
          setStarsFilter(undefined);
        }}
      >
        Clear filters
      </Button>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title={t("marketplace.title")}
        description="Search verified hotel inventory, compare availability, and start B2B bookings from one responsive marketplace."
        actions={
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <Filter className="me-2 h-4 w-4" />
                {t("filter")}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("filter")}</SheetTitle>
              </SheetHeader>
              <div className="p-4">{filterControls}</div>
            </SheetContent>
          </Sheet>
        }
      />

      <div className="mb-6 rounded-2xl border bg-card p-3 shadow-sm sm:p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("marketplace.search")}
            className="h-11 ps-9"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24">
            <CardContent className="p-5">{filterControls}</CardContent>
          </Card>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {hotels?.length ?? 0} {t("marketplace.results")}
            </p>
            {(wilayaFilter || starsFilter) ? (
              <Badge variant="secondary">Filtered</Badge>
            ) : null}
          </div>

          {isLoading ? (
            <LoadingCards count={8} />
          ) : hotels && hotels.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hotels.map((hotel: Record<string, unknown>) => {
                const photos = (hotel.photos || []) as Array<{ storagePath: string }>;
                const amenities = (hotel.amenities || []) as Array<{ amenity: { key: string; label?: { fr?: string }; labelFr?: string } }>;
                const totalAvailable = (hotel.totalAvailable as number) || 0;
                const isSeeded = hotel.isSeeded as boolean;
                const minRate = hotel.minRate ? Number(hotel.minRate) : null;
                return (
                  <Card key={hotel.id as string} className="group overflow-hidden">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {photos[0]?.storagePath ? (
                        <img
                          src={photos[0].storagePath}
                          alt={hotel.name as string}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-200">
                          <MapPin className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex gap-2">
                        {isSeeded ? <Badge variant="secondary">{t("marketplace.seeded")}</Badge> : null}
                      </div>
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                        <Stars count={(hotel.starRating as number) || null} />
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{hotel.name as string}</h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {(hotel.wilaya as Record<string, string>)?.nameFr || "Algeria"}
                          </span>
                        </p>
                      </div>
                      <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
                        {amenities.slice(0, 3).map((item) => (
                          <Badge key={item.amenity.key} variant="secondary" className="gap-1 text-xs font-normal">
                            {AMENITY_ICONS[item.amenity.key] || null}
                            {item.amenity.label?.fr || item.amenity.labelFr}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
                        <div className="min-w-0">
                          {minRate ? (
                            <p className="text-sm">
                              <span className="text-muted-foreground">{t("marketplace.from")} </span>
                              <span className="font-semibold text-primary">{minRate.toLocaleString()} DZD</span>
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No room rates yet</p>
                          )}
                          <p className={totalAvailable > 0 ? "text-xs text-emerald-600" : "text-xs text-muted-foreground"}>
                            {totalAvailable > 0 ? `${totalAvailable} ${t("marketplace.available")}` : "No live availability"}
                          </p>
                        </div>
                        <Button size="sm" asChild>
                          <Link to={`/hotel/${hotel.id}`}>
                            {isSeeded ? t("marketplace.viewDetails") : t("marketplace.book")}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title={t("marketplace.noResults")}
              description="Try a different search, wilaya, or star filter."
              action={<Button onClick={() => setSearch("")}>Reset search</Button>}
            />
          )}
        </section>
      </div>
    </div>
  );
}
