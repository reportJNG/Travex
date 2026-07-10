import { useState } from "react";
import { Link } from "react-router";
import { Filter, MapPin, Search, Star, X } from "lucide-react";
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
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const { data: hotels, isLoading } = trpc.marketplace.listHotels.useQuery({
    search: search || undefined,
    wilaya: wilayaFilter,
    stars: starsFilter,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    amenities: selectedAmenities.length ? selectedAmenities : undefined,
    page: 1,
    limit: 24,
  });
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery();
  const { data: allAmenities } = trpc.marketplace.listAmenities.useQuery();

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const clearFilters = () => {
    setWilayaFilter(undefined);
    setStarsFilter(undefined);
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
  };

  const hasFilters = wilayaFilter || starsFilter || minPrice || maxPrice || selectedAmenities.length;

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
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((stars) => (
            <Button
              key={stars}
              type="button"
              variant={starsFilter === stars ? "default" : "outline"}
              size="sm"
              className="px-0"
              onClick={() => setStarsFilter(starsFilter === stars ? undefined : stars)}
            >
              {stars}★
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("marketplace.priceRange")}</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Min (DZD)</span>
            <Input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min={0}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Max (DZD)</span>
            <Input
              type="number"
              placeholder="∞"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min={0}
            />
          </div>
        </div>
      </div>

      {allAmenities && allAmenities.length > 0 ? (
        <div className="space-y-2">
          <Label>{t("marketplace.amenities")}</Label>
          <div className="flex flex-wrap gap-2">
            {allAmenities.map((amenity: any) => {
              const selected = selectedAmenities.includes(amenity.key);
              return (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleAmenity(amenity.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {amenity.labelFr}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasFilters ? (
        <Button
          variant="outline"
          className="w-full"
          onClick={clearFilters}
        >
          <X className="me-2 h-4 w-4" />
          Clear all filters
        </Button>
      ) : null}
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
              <Button variant="outline" className="relative lg:hidden">
                <Filter className="me-2 h-4 w-4" />
                {t("filter")}
                {hasFilters ? (
                  <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {[wilayaFilter, starsFilter, minPrice || maxPrice, ...selectedAmenities].filter(Boolean).length}
                  </span>
                ) : null}
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {hotels?.length ?? 0} {t("marketplace.results")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {wilayaFilter && wilayas ? (
                <Badge variant="secondary" className="gap-1">
                  {wilayas.find((w) => w.code === wilayaFilter)?.nameFr}
                  <button type="button" onClick={() => setWilayaFilter(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {starsFilter ? (
                <Badge variant="secondary" className="gap-1">
                  {starsFilter}★
                  <button type="button" onClick={() => setStarsFilter(undefined)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {selectedAmenities.map((key) => {
                const amenity = allAmenities?.find((a: any) => a.key === key);
                return (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {amenity?.labelFr || key}
                    <button type="button" onClick={() => toggleAmenity(key)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <LoadingCards count={8} />
          ) : hotels && hotels.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {hotels.map((hotel: Record<string, unknown>) => {
                const photos = (hotel.photos || []) as Array<{ storagePath: string }>;
                const amenities = (hotel.amenities || []) as Array<{ amenity: { key: string; labelFr?: string } }>;
                const totalAvailable = (hotel.totalAvailable as number) || 0;
                const isSeeded = hotel.isSeeded as boolean;
                const minRate = hotel.minRate ? Number(hotel.minRate) : null;
                return (
                  <Card key={hotel.id as string} className="group overflow-hidden transition-shadow hover:shadow-md">
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
                        {isSeeded ? <Badge variant="secondary" className="text-xs">{t("marketplace.seeded")}</Badge> : null}
                      </div>
                      {(hotel.starRating as number) ? (
                        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 shadow-sm">
                          <Stars count={(hotel.starRating as number) || null} />
                        </div>
                      ) : null}
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
                      {amenities.length > 0 ? (
                        <div className="mt-3 flex min-h-7 flex-wrap gap-1.5">
                          {amenities.slice(0, 3).map((item) => (
                            <Badge key={item.amenity.key} variant="secondary" className="text-xs font-normal">
                              {item.amenity.labelFr}
                            </Badge>
                          ))}
                          {amenities.length > 3 ? (
                            <Badge variant="outline" className="text-xs font-normal">
                              +{amenities.length - 3}
                            </Badge>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-3 min-h-7" />
                      )}
                      <div className="mt-4 flex items-end justify-between gap-3 border-t pt-4">
                        <div className="min-w-0">
                          {minRate ? (
                            <p className="text-sm">
                              <span className="text-muted-foreground">{t("marketplace.from")} </span>
                              <span className="font-semibold text-primary">{minRate.toLocaleString()} DZD</span>
                              <span className="text-xs text-muted-foreground">{t("marketplace.perNight")}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">No rates yet</p>
                          )}
                          <p className={totalAvailable > 0 ? "text-xs text-emerald-600" : "text-xs text-muted-foreground"}>
                            {totalAvailable > 0
                              ? `${totalAvailable} ${t("marketplace.available")}`
                              : "No availability"}
                          </p>
                        </div>
                        <Button size="sm" asChild className="shrink-0">
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
              description="Try a different search, wilaya, or filter."
              action={<Button onClick={clearFilters}>Reset filters</Button>}
            />
          )}
        </section>
      </div>
    </div>
  );
}
