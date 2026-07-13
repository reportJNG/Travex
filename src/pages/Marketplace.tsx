import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Filter, MapPin, Search, Star, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function parsePrice(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export default function Marketplace() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const initialCountry = searchParams.get("country");
  const initialWilaya = Number(searchParams.get("wilaya"));
  const [countryFilter, setCountryFilter] = useState<"DZ" | "TN" | undefined>(
    initialCountry === "DZ" || initialCountry === "TN" ? initialCountry : undefined,
  );
  const [wilayaFilter, setWilayaFilter] = useState<number | undefined>(
    Number.isInteger(initialWilaya) && initialWilaya > 0 ? initialWilaya : undefined,
  );
  const [starsFilter, setStarsFilter] = useState<number | undefined>();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"recommended" | "price_asc" | "availability" | "stars">("recommended");

  const { data: hotels, isLoading } = trpc.marketplace.listHotels.useQuery({
    search: search || undefined,
    country: countryFilter,
    wilaya: wilayaFilter,
    stars: starsFilter,
    minPrice: parsePrice(minPrice),
    maxPrice: parsePrice(maxPrice),
    amenities: selectedAmenities.length ? selectedAmenities : undefined,
    page: 1,
    limit: 24,
  });
  const { data: countries } = trpc.marketplace.listCountries.useQuery();
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery({ country: countryFilter });
  const { data: allAmenities } = trpc.marketplace.listAmenities.useQuery();
  const sortedHotels = [...(hotels ?? [])].sort((a: any, b: any) => {
    if (sortBy === "price_asc") return Number(a.minRate ?? Infinity) - Number(b.minRate ?? Infinity);
    if (sortBy === "availability") return Number(b.totalAvailable ?? 0) - Number(a.totalAvailable ?? 0);
    if (sortBy === "stars") return Number(b.starRating ?? 0) - Number(a.starRating ?? 0);
    return 0;
  });

  const toggleAmenity = (key: string) => {
    setSelectedAmenities(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const clearFilters = () => {
    setWilayaFilter(undefined);
    setCountryFilter(undefined);
    setStarsFilter(undefined);
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
  };

  const hasFilters = countryFilter || wilayaFilter || starsFilter || minPrice || maxPrice || selectedAmenities.length;

  const filterControls = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pays
        </Label>
        <Select
          value={countryFilter ?? "all"}
          onValueChange={value => {
            setCountryFilter(value === "all" ? undefined : value as "DZ" | "TN");
            setWilayaFilter(undefined);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Tous les pays" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pays</SelectItem>
            {countries?.map(country => (
              <SelectItem key={country.code} value={country.code}>
                {country.nameFr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {countryFilter === "TN" ? "Gouvernorat" : t("marketplace.wilaya")}
        </Label>
        <Select
          value={wilayaFilter ? String(wilayaFilter) : "all"}
          onValueChange={value => setWilayaFilter(value === "all" ? undefined : Number(value))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("marketplace.allWilayas")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{countryFilter === "TN" ? "Tous les gouvernorats" : t("marketplace.allWilayas")}</SelectItem>
            {wilayas?.map(wilaya => (
              <SelectItem key={wilaya.code} value={String(wilaya.code)}>
                {wilaya.code} — {wilaya.nameFr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("marketplace.stars")}
        </Label>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map(stars => (
            <Button
              key={stars}
              type="button"
              variant={starsFilter === stars ? "default" : "outline"}
              size="sm"
              className="px-0 text-xs"
              onClick={() => setStarsFilter(starsFilter === stars ? undefined : stars)}
            >
              {stars}★
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("marketplace.priceRange")}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="mb-1 block text-xs text-muted-foreground">Min (DZD)</span>
            <Input type="number" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} min={0} />
          </div>
          <div>
            <span className="mb-1 block text-xs text-muted-foreground">Max (DZD)</span>
            <Input type="number" placeholder="∞" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} min={0} />
          </div>
        </div>
      </div>

      {allAmenities && allAmenities.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("marketplace.amenities")}
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {allAmenities.map((amenity: any) => {
              const selected = selectedAmenities.includes(amenity.key);
              return (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleAmenity(amenity.key)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {amenity.labelFr}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasFilters && (
        <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
          <X className="me-2 h-3.5 w-3.5" />
          Effacer les filtres
        </Button>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title={t("marketplace.title")}
        description="Recherchez l'inventaire hôtelier vérifié et démarrez des réservations B2B."
        actions={
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative lg:hidden">
                <Filter className="me-2 h-4 w-4" />
                {t("filter")}
                {hasFilters ? (
                  <span className="absolute -end-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {[countryFilter, wilayaFilter, starsFilter, minPrice || maxPrice, ...selectedAmenities].filter(Boolean).length}
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

      {/* Search bar */}
      <div className="mb-6 relative">
        <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("marketplace.search")}
          className="h-11 ps-10 rounded-xl border-border/80"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        {/* Filter sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Filtres</h2>
            {filterControls}
          </div>
        </aside>

        {/* Results */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{hotels?.length ?? 0}</span> {t("marketplace.results")}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Trier</span>
              <Select value={sortBy} onValueChange={value => setSortBy(value as typeof sortBy)}>
                <SelectTrigger className="h-9 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommandés</SelectItem>
                  <SelectItem value="price_asc">Prix croissant</SelectItem>
                  <SelectItem value="availability">Disponibilité</SelectItem>
                  <SelectItem value="stars">Étoiles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {countryFilter && countries ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {countries.find(c => c.code === countryFilter)?.nameFr}
                  <button
                    type="button"
                    onClick={() => {
                      setCountryFilter(undefined);
                      setWilayaFilter(undefined);
                    }}
                    className="hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {wilayaFilter && wilayas ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {wilayas.find(w => w.code === wilayaFilter)?.nameFr}
                  <button type="button" onClick={() => setWilayaFilter(undefined)} className="hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {starsFilter ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  {starsFilter}★
                  <button type="button" onClick={() => setStarsFilter(undefined)} className="hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null}
              {selectedAmenities.map(key => {
                const amenity = allAmenities?.find((a: any) => a.key === key);
                return (
                  <Badge key={key} variant="secondary" className="gap-1 text-xs">
                    {amenity?.labelFr || key}
                    <button type="button" onClick={() => toggleAmenity(key)} className="hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>

          {isLoading ? (
            <LoadingCards count={8} />
          ) : sortedHotels.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedHotels.map((hotel: Record<string, unknown>) => {
                const photos = (hotel.photos || []) as Array<{ storagePath: string }>;
                const amenities = (hotel.amenities || []) as Array<{ amenity: { key: string; labelFr?: string } }>;
                const totalAvailable = (hotel.totalAvailable as number) || 0;
                const isSeeded = hotel.isSeeded as boolean;
                const minRate = hotel.minRate ? Number(hotel.minRate) : null;
                const hotelHref = `/hotel/${hotel.id as string}`;

                return (
                  <div
                    key={hotel.id as string}
                    className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-border/80 hover:shadow-md"
                  >
                    <Link to={hotelHref} className="block">
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        {photos[0]?.storagePath ? (
                          <img
                            src={photos[0].storagePath}
                            alt={hotel.name as string}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/8 to-muted">
                            <MapPin className="h-10 w-10 text-muted-foreground/40" />
                          </div>
                        )}

                        {isSeeded && (
                          <div className="absolute left-3 top-3">
                            <span className="rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                              {t("marketplace.seeded")}
                            </span>
                          </div>
                        )}

                        {(hotel.starRating as number) ? (
                          <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                            <Stars count={(hotel.starRating as number) || null} />
                          </div>
                        ) : null}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="min-w-0">
                        <Link to={hotelHref}>
                          <h3 className="truncate font-semibold text-foreground transition-colors hover:text-primary">
                            {hotel.name as string}
                          </h3>
                        </Link>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {[
                              (hotel.wilaya as Record<string, string>)?.nameFr,
                              (hotel.country as Record<string, string>)?.nameFr,
                            ].filter(Boolean).join(", ") || "Algérie"}
                          </span>
                        </p>
                      </div>

                      {amenities.length > 0 && (
                        <div className="mt-3 flex min-h-7 flex-wrap gap-1">
                          {amenities.slice(0, 3).map(item => (
                            <span
                              key={item.amenity.key}
                              className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-normal text-muted-foreground"
                            >
                              {item.amenity.labelFr}
                            </span>
                          ))}
                          {amenities.length > 3 && (
                            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                              +{amenities.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/60 pt-4">
                        <div className="min-w-0">
                          {minRate ? (
                            <p className="text-sm">
                              <span className="text-xs text-muted-foreground">{t("marketplace.from")} </span>
                              <span className="font-bold text-primary">{minRate.toLocaleString()} DZD</span>
                              <span className="text-xs text-muted-foreground">{t("marketplace.perNight")}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Aucun tarif</p>
                          )}
                          <p className={totalAvailable > 0 ? "text-xs font-medium text-emerald-600" : "text-xs text-muted-foreground"}>
                            {totalAvailable > 0 ? `${totalAvailable} ${t("marketplace.available")}` : "Indisponible"}
                          </p>
                        </div>
                        <Button size="sm" asChild className="shrink-0 h-8">
                          <Link to={`/hotel/${hotel.id}`}>
                            {isSeeded ? t("marketplace.viewDetails") : t("marketplace.book")}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title={t("marketplace.noResults")}
              description="Essayez une autre recherche, wilaya ou filtre."
              action={<Button onClick={clearFilters}>Réinitialiser les filtres</Button>}
            />
          )}
        </section>
      </div>
    </div>
  );
}
