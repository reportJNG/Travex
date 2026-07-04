import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Star, MapPin, Phone, Mail, Globe, Facebook, Instagram,
  Calendar, Users, CreditCard, Wifi, Waves, UtensilsCrossed, Car,
  Sparkles, Presentation, Bus, AirVent, TreePalm
} from "lucide-react";

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

export default function HotelDetail() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const hotelId = parseInt(id || "0");

  const { data: hotel, isLoading } = trpc.marketplace.getHotel.useQuery({ id: hotelId });
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: (data) => {
      toast.success(`${t("booking.success")} - Ref: ${data.reference}`);
      navigate("/dashboard");
    },
    onError: (err) => toast.error(err.message),
  });

  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomsCount, setRoomsCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<"cib" | "edahabia" | "offline">("offline");

  const handleBook = () => {
    if (!selectedRoom || !checkIn || !checkOut) {
      toast.error("Please fill all fields");
      return;
    }
    createBooking.mutate({
      hotelId,
      roomTypeId: selectedRoom,
      checkIn,
      checkOut,
      roomsCount,
      paymentMethod,
    });
  };

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const selectedRoomData = hotel?.rooms?.find((r: Record<string, unknown>) => r.id === selectedRoom);
  const totalEstimate = selectedRoomData && nights > 0
    ? Number((selectedRoomData as any).b2bRate) * nights * roomsCount
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Hotel not found</h2>
      </div>
    );
  }

  const hphotos = (hotel.photos || []) as Array<{ storagePath: string }>;
  const hamenities = (hotel.amenities || []) as Array<{ amenity: { key: string; labelFr: string } }>;
  const hrooms = (hotel.rooms || []) as Array<Record<string, unknown>>;
  const isSeeded = hotel.isSeeded as boolean;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 rounded-xl overflow-hidden">
        <div className="md:col-span-2 h-64 md:h-80 bg-slate-200">
          {hphotos[0] ? (
            <img src={hphotos[0].storagePath} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-slate-200 flex items-center justify-center">
              <MapPin className="h-16 w-16 text-slate-300" />
            </div>
          )}
        </div>
        <div className="hidden md:grid grid-rows-2 gap-2">
          {hphotos.slice(1, 3).map((p, i) => (
            <div key={i} className="bg-slate-200">
              <img src={p.storagePath} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {hphotos.length < 2 && (
            <>
              <div className="bg-gradient-to-br from-slate-100 to-teal-50" />
              <div className="bg-gradient-to-br from-teal-50 to-slate-100" />
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Hotel Info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{hotel.name as string}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex">
                    {Array.from({ length: (hotel.starRating as number) || 0 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {(hotel.wilaya as any)?.nameFr || "Algeria"}
                  </span>
                </div>
              </div>
              {isSeeded && <Badge variant="outline">{t("marketplace.seeded")}</Badge>}
            </div>
            {hotel.address && (
              <p className="text-sm text-slate-500 mt-2">{hotel.address as string}</p>
            )}
          </div>

          {hotel.description && (
            <p className="text-slate-600 text-sm leading-relaxed">{hotel.description as string}</p>
          )}

          {/* Amenities */}
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">{t("hotel.amenities")}</h2>
            <div className="flex flex-wrap gap-2">
              {hamenities.map((ha) => (
                <Badge key={ha.amenity.key} variant="secondary" className="gap-1.5 py-1.5 px-3">
                  {AMENITY_ICON_MAP[ha.amenity.key] || null}
                  {ha.amenity.labelFr}
                </Badge>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="font-semibold text-slate-800 mb-3">{t("hotel.contact")}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {hotel.phone && (
                <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600">
                  <Phone className="h-4 w-4" /> {hotel.phone as string}
                </a>
              )}
              {hotel.email && (
                <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600">
                  <Mail className="h-4 w-4" /> {hotel.email as string}
                </a>
              )}
              {hotel.websiteUrl && (
                <a href={hotel.websiteUrl as string} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600">
                  <Globe className="h-4 w-4" /> Website
                </a>
              )}
              {hotel.facebookUrl && (
                <a href={hotel.facebookUrl as string} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600">
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
              )}
              {hotel.instagramUrl && (
                <a href={hotel.instagramUrl as string} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-slate-600 hover:text-teal-600">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              )}
            </div>
          </div>

          {/* Rooms */}
          {!isSeeded && (
            <div>
              <h2 className="font-semibold text-slate-800 mb-3">{t("hotel.rooms")}</h2>
              <div className="space-y-3">
                {hrooms.map((room: Record<string, unknown>) => (
                  <Card
                    key={room.id as number}
                    className={`cursor-pointer transition-all ${
                      selectedRoom === room.id ? "ring-2 ring-teal-500 border-teal-500" : ""
                    }`}
                    onClick={() => setSelectedRoom(room.id as number)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-800">{room.name as string}</h3>
                        <p className="text-sm text-slate-500">
                          Capacité: {room.totalCapacity as number} ·
                          <span className={room.availableCount as number > 0 ? "text-green-600" : "text-red-500"}>
                            {" "}{room.availableCount as number} dispo
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-teal-700">
                          {Number(room.b2bRate).toLocaleString()} DZD
                        </span>
                        <span className="text-xs text-slate-400 block">/nuit</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Booking Panel */}
        {!isSeeded && (
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-lg">{t("booking.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("booking.checkIn")}</Label>
                    <Input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{t("booking.checkOut")}</Label>
                    <Input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || undefined}
                    />
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

                <div className="space-y-1.5">
                  <Label className="text-xs">{t("booking.paymentMethod")}</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as any)}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2 rounded-lg border p-2">
                      <RadioGroupItem value="offline" id="offline" />
                      <Label htmlFor="offline" className="flex items-center gap-2 text-sm cursor-pointer">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        {t("payment.offline")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-2">
                      <RadioGroupItem value="cib" id="cib" />
                      <Label htmlFor="cib" className="flex items-center gap-2 text-sm cursor-pointer">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        {t("payment.cib")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-lg border p-2">
                      <RadioGroupItem value="edahabia" id="edahabia" />
                      <Label htmlFor="edahabia" className="flex items-center gap-2 text-sm cursor-pointer">
                        <CreditCard className="h-4 w-4 text-green-500" />
                        {t("payment.edahabia")}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {nights > 0 && selectedRoomData && (
                  <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {Number((selectedRoomData as any).b2bRate).toLocaleString()} x {nights} nuits x {roomsCount}
                      </span>
                      <span>{totalEstimate.toLocaleString()} DZD</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total estimé</span>
                      <span className="text-teal-700">{totalEstimate.toLocaleString()} DZD</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={!selectedRoom || !checkIn || !checkOut || createBooking.isPending}
                  onClick={handleBook}
                >
                  {createBooking.isPending ? "..." : t("booking.submit")}
                </Button>

                {!user && (
                  <p className="text-xs text-center text-slate-500">
                    Please <Link to="/login" className="text-teal-600 hover:underline">login</Link> to book
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
