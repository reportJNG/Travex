import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  AirVent,
  Bus,
  Car,
  CreditCard,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Presentation,
  Sparkles,
  Star,
  TreePalm,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { EmptyState } from "@/components/app/StateBlock";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const AMENITY_ICON_MAP: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  pool: <Waves className="h-4 w-4" />,
  restaurant: <UtensilsCrossed className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  meeting_rooms: <Presentation className="h-4 w-4" />,
  spa: <Sparkles className="h-4 w-4" />,
  shuttle: <Bus className="h-4 w-4" />,
  ac: <AirVent className="h-4 w-4" />,
  beach: <TreePalm className="h-4 w-4" />,
};

const bookingSchema = z.object({
  selectedRoom: z.string().min(1, "Please select a room"),
  checkIn: z.string().min(1, "Check-in date is required"),
  checkOut: z.string().min(1, "Check-out date is required"),
  roomsCount: z.number().int().min(1).max(20),
}).refine((d) => {
  if (!d.checkIn || !d.checkOut) return true;
  return new Date(d.checkOut) > new Date(d.checkIn);
}, { message: "Check-out must be after check-in", path: ["checkOut"] });

type BookingErrors = { selectedRoom?: string; checkIn?: string; checkOut?: string };

function Stars({ count }: { count?: number | null }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${count} stars`}>
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

export default function HotelDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hotelId = id || "";
  const { data: hotel, isLoading } = trpc.marketplace.getHotel.useQuery({ id: hotelId });
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      toast.success(`${t("booking.success")} — Ref: ${data.reference || "pending"}`);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (paymentMethod === "offline") {
        navigate(`/booking/${data.bookingId}/offline-payment`);
      } else {
        navigate(`/booking/${data.bookingId}/payment-result`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomsCount, setRoomsCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cib" | "edahabia" | "offline">("offline");
  const [bookingErrors, setBookingErrors] = useState<BookingErrors>({});

  const rooms = (hotel?.rooms || []) as Array<Record<string, unknown>>;
  const activeRooms = rooms.filter((r) => r.isActive !== false);
  const selectedRoomData = activeRooms.find((room) => room.id === selectedRoom);
  const nights =
    checkIn && checkOut
      ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
      : 0;
  const totalEstimate =
    selectedRoomData && nights > 0 ? Number(selectedRoomData.b2bRate) * nights * roomsCount : 0;

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const handleBook = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    const result = bookingSchema.safeParse({
      selectedRoom: selectedRoom || "",
      checkIn,
      checkOut,
      roomsCount,
    });

    if (!result.success) {
      const errors: BookingErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field as keyof BookingErrors]) {
          (errors as Record<string, string>)[field] = issue.message;
        }
      }
      setBookingErrors(errors);
      return;
    }

    setBookingErrors({});
    createBooking.mutate({
      hotelId,
      roomTypeId: selectedRoom!,
      checkIn,
      checkOut,
      roomsCount,
      paymentMethod,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <EmptyState
        icon={<MapPin className="h-6 w-6" />}
        title="Hotel not found"
        description="This listing may have been removed or is not available."
        action={<Button asChild><Link to="/marketplace">Back to marketplace</Link></Button>}
      />
    );
  }

  const photos = (hotel.photos || []) as Array<{ storagePath: string }>;
  const amenities = (hotel.amenities || []) as Array<{ amenity: { key: string; labelFr?: string } }>;
  const isSeeded = hotel.isSeeded as boolean;
  const wilaya = hotel.wilaya as { nameFr?: string } | undefined;
  const wilayaName = wilaya?.nameFr || "Algeria";
  const contacts: Array<{ present: unknown; href: string; icon: LucideIcon; label: string }> = [
    { present: hotel.phone, href: `tel:${hotel.phone}`, icon: Phone, label: String(hotel.phone || "") },
    { present: hotel.email, href: `mailto:${hotel.email}`, icon: Mail, label: String(hotel.email || "") },
    { present: hotel.websiteUrl, href: String(hotel.websiteUrl || ""), icon: Globe, label: "Website" },
    { present: hotel.facebookUrl, href: String(hotel.facebookUrl || ""), icon: Facebook, label: "Facebook" },
    { present: hotel.instagramUrl, href: String(hotel.instagramUrl || ""), icon: Instagram, label: "Instagram" },
  ];

  const paymentMethods = [
    {
      value: "offline" as const,
      label: t("payment.offline"),
      desc: `Pay within ${(hotel.offlinePaymentWindowHours as number) || 48}h of approval`,
    },
    { value: "cib" as const, label: t("payment.cib"), desc: "Online card payment via Chargily" },
    { value: "edahabia" as const, label: t("payment.edahabia"), desc: "Online via Edahabia card" },
  ];

  const bookingPanel = (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border/60 px-5 py-4">
        <h3 className="font-semibold text-foreground text-lg">{t("booking.title")}</h3>
      </div>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("booking.checkIn")}</Label>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => { setCheckIn(e.target.value); setBookingErrors((prev) => ({ ...prev, checkIn: undefined })); }}
              min={today}
              className={bookingErrors.checkIn ? "border-destructive" : ""}
            />
            {bookingErrors.checkIn ? <p className="text-xs text-destructive">{bookingErrors.checkIn}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("booking.checkOut")}</Label>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => { setCheckOut(e.target.value); setBookingErrors((prev) => ({ ...prev, checkOut: undefined })); }}
              min={checkIn || today}
              className={bookingErrors.checkOut ? "border-destructive" : ""}
            />
            {bookingErrors.checkOut ? <p className="text-xs text-destructive">{bookingErrors.checkOut}</p> : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t("booking.rooms")}</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={roomsCount}
            onChange={(e) => setRoomsCount(parseInt(e.target.value) || 1)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{t("booking.paymentMethod")}</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as typeof paymentMethod)}
            className="space-y-1.5"
          >
            {paymentMethods.map(({ value, label, desc }) => (
              <Label
                key={value}
                htmlFor={`pay-${value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/10"
              >
                <RadioGroupItem id={`pay-${value}`} value={value} />
                <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <span className="text-sm font-medium">{label}</span>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {bookingErrors.selectedRoom ? (
          <p className="text-xs text-destructive">{bookingErrors.selectedRoom}</p>
        ) : null}

        {nights > 0 && selectedRoomData ? (
          <div className="rounded-xl border bg-muted/40 p-3 text-sm">
            <div className="flex justify-between gap-3 text-muted-foreground">
              <span>{Number(selectedRoomData.b2bRate).toLocaleString()} × {nights} nights × {roomsCount} rooms</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between gap-3 font-semibold">
              <span>{t("booking.total")}</span>
              <span className="text-primary">{totalEstimate.toLocaleString()} DZD</span>
            </div>
          </div>
        ) : selectedRoom && checkIn && checkOut && nights <= 0 ? (
          <p className="text-xs text-destructive">Check-out must be after check-in</p>
        ) : null}

        <Button
          className="w-full"
          disabled={createBooking.isPending}
          onClick={handleBook}
        >
          {createBooking.isPending ? t("loading") : t("booking.submit")}
        </Button>

        {!user ? (
          <p className="text-center text-xs text-muted-foreground">
            Please{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              login
            </Link>{" "}
            to make a booking.
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Photo grid */}
      <div className="grid gap-2 overflow-hidden rounded-2xl md:grid-cols-3">
        <div className="aspect-[16/10] bg-muted md:col-span-2 md:aspect-auto md:h-96">
          {photos[0]?.storagePath ? (
            <img src={photos[0].storagePath} alt={hotel.name as string} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-slate-200">
              <MapPin className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="hidden gap-2 md:grid">
          {[photos[1]?.storagePath, photos[2]?.storagePath].map((src, index) => (
            <div key={index} className="h-[calc(12rem-0.25rem)] bg-muted">
              {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (
                <div className="h-full bg-gradient-to-br from-primary/5 to-slate-100" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {/* Info card */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {isSeeded ? <StatusBadge status="awaiting_review">{t("marketplace.seeded")}</StatusBadge> : null}
                    <Stars count={(hotel.starRating as number) || null} />
                  </div>
                  <h1 className="break-words text-3xl font-semibold tracking-tight">{hotel.name as string}</h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">{(hotel.address as string) || wilayaName}</span>
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/marketplace">← Back</Link>
                </Button>
              </div>
              {hotel.description ? (
                <p className="mt-5 text-sm leading-7 text-muted-foreground">{hotel.description as string}</p>
              ) : null}
            </div>
          </div>

          {/* Amenities */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border/60 px-5 py-4">
              <h3 className="font-semibold text-foreground">{t("hotel.amenities")}</h3>
            </div>
            <div className="p-5">
              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((item) => (
                    <Badge key={item.amenity.key} variant="secondary" className="gap-1.5 px-3 py-1.5">
                      {AMENITY_ICON_MAP[item.amenity.key] || null}
                      {item.amenity.labelFr}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No amenities listed yet.</p>
              )}
            </div>
          </div>

          {/* Rooms */}
          {!isSeeded ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border/60 px-5 py-4">
                <h3 className="font-semibold text-foreground">{t("hotel.rooms")}</h3>
              </div>
              <div className="p-5 space-y-3">
                {activeRooms.length > 0 ? (
                  activeRooms.map((room) => {
                    const available = Number(room.availableCount || 0);
                    const isSelected = selectedRoom === room.id;
                    return (
                      <button
                        key={room.id as string}
                        type="button"
                        onClick={() => {
                          setSelectedRoom(room.id as string);
                          setBookingErrors((prev) => ({ ...prev, selectedRoom: undefined }));
                        }}
                        className={`w-full rounded-xl border p-4 text-left transition-all hover:border-primary/50 hover:bg-accent ${
                          isSelected ? "border-primary bg-primary/10 ring-1 ring-primary/20" : ""
                        } ${available <= 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                        disabled={available <= 0}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-semibold">{room.name as string}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Capacity {room.totalCapacity as number} ·{" "}
                              <span className={available > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                                {available > 0 ? `${available} available` : "Unavailable"}
                              </span>
                            </p>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="font-semibold text-primary">
                              {Number(room.b2bRate).toLocaleString()} DZD
                            </div>
                            <div className="text-xs text-muted-foreground">/ night</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <EmptyState title="No rooms available" description="This hotel has not published room inventory yet." />
                )}
              </div>
            </div>
          ) : null}

          {/* Contact */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border/60 px-5 py-4">
              <h3 className="font-semibold text-foreground">{t("hotel.contact")}</h3>
            </div>
            <div className="p-5 grid gap-3 sm:grid-cols-2">
              {contacts.map(({ present, href, icon: Icon, label }, index) =>
                present ? (
                  <a
                    key={index}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener"
                    className="flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors hover:bg-accent"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{label}</span>
                  </a>
                ) : null
              )}
            </div>
          </div>
        </div>

        {!isSeeded ? (
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">{bookingPanel}</aside>
        ) : null}
      </div>

      {/* Mobile sticky booking bar */}
      {!isSeeded ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 p-3 shadow-lg backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">
                {totalEstimate ? `${totalEstimate.toLocaleString()} DZD` : selectedRoom ? "Select dates" : "Select a room"}
              </div>
              <div className="text-xs text-muted-foreground">
                {nights > 0 ? `${nights} nights · ${roomsCount} room${roomsCount > 1 ? "s" : ""}` : "Choose dates"}
              </div>
            </div>
            <Button
              onClick={handleBook}
              disabled={createBooking.isPending}
              className="shrink-0"
            >
              {createBooking.isPending ? "Booking..." : t("booking.submit")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
