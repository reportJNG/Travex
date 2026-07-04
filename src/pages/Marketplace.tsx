import { useState } from "react";
import { Link } from "react-router";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MapPin, Wifi, Waves, UtensilsCrossed, Car, Search, Filter } from "lucide-react";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  pool: <Waves className="h-3.5 w-3.5" />,
  restaurant: <UtensilsCrossed className="h-3.5 w-3.5" />,
  parking: <Car className="h-3.5 w-3.5" />,
};

export default function Marketplace() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [wilayaFilter, setWilayaFilter] = useState<number | undefined>();
  const [starsFilter, setStarsFilter] = useState<number | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const { data: hotels, isLoading } = trpc.marketplace.listHotels.useQuery({
    search: search || undefined,
    wilaya: wilayaFilter,
    stars: starsFilter,
    page: 1,
    limit: 24,
  });

  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery();

  const renderStars = (count: number | null) => {
    if (!count) return null;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t("marketplace.title")}</h1>
        <p className="text-slate-500 text-sm mt-1">
          {hotels?.length ?? 0} {t("marketplace.results")}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={t("marketplace.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {t("filter")}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-4 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                {t("marketplace.wilaya")}
              </label>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={wilayaFilter || ""}
                onChange={(e) => setWilayaFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              >
                <option value="">{t("marketplace.allWilayas")}</option>
                {wilayas?.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.code} - {w.nameFr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                {t("marketplace.stars")}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Button
                    key={s}
                    variant={starsFilter === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStarsFilter(starsFilter === s ? undefined : s)}
                    className="px-3"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hotels Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hotels && hotels.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hotels.map((hotel: Record<string, unknown>) => {
            const hphotos = (hotel.photos || []) as Array<{ storagePath: string }>;
            const hamenities = (hotel.amenities || []) as Array<{ amenity: { key: string; labelFr: string } }>;
            const hrooms = (hotel.rooms || []) as Array<{ availableCount: number }>;
            const totalAvailable = (hotel.totalAvailable as number) || 0;
            const isSeeded = hotel.isSeeded as boolean;

            return (
              <Card
                key={hotel.id as number}
                className="overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="relative h-48 bg-slate-200 overflow-hidden">
                  {hphotos[0] ? (
                    <img
                      src={hphotos[0].storagePath}
                      alt={hotel.name as string}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-100 to-slate-200 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-slate-400" />
                    </div>
                  )}
                  {isSeeded && (
                    <Badge variant="secondary" className="absolute top-2 left-2 bg-white/90">
                      {t("marketplace.seeded")}
                    </Badge>
                  )}
                  <div className="absolute top-2 right-2">
                    {renderStars((hotel.starRating as number) || null)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-800 truncate">{hotel.name as string}</h3>
                  <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {(hotel.wilaya as Record<string, string>)?.nameFr || "Algeria"}
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hamenities.slice(0, 4).map((ha) => (
                      <Badge
                        key={ha.amenity.key}
                        variant="secondary"
                        className="text-xs font-normal gap-1"
                      >
                        {AMENITY_ICONS[ha.amenity.key] || null}
                        {ha.amenity.labelFr}
                      </Badge>
                    ))}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div>
                      {hotel.minRate ? (
                        <div className="text-sm">
                          <span className="text-slate-500">{t("marketplace.from")} </span>
                          <span className="font-bold text-teal-700">
                            {(hotel.minRate as number).toLocaleString()} DZD
                          </span>
                          <span className="text-slate-400 text-xs"> {t("marketplace.perNight")}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No rooms available</span>
                      )}
                      {totalAvailable > 0 && (
                        <div className="text-xs text-green-600 mt-0.5">
                          {totalAvailable} {t("marketplace.available")}
                        </div>
                      )}
                    </div>
                    <Link to={`/hotel/${hotel.id}`}>
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                        {isSeeded ? t("marketplace.viewDetails") : t("marketplace.book")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-600">{t("marketplace.noResults")}</h3>
          <p className="text-sm text-slate-400 mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
