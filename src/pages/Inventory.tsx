import { useState } from "react";
import {
  Hotel,
  Mail,
  MapPin,
  Minus,
  Pencil,
  Phone,
  Plus,
  Save,
  Star,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

const hotelSchema = z.object({
  name: z.string().min(2, "Hotel name must be at least 2 characters"),
  wilayaCode: z.number().min(1, "Please select a wilaya"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
});

const roomSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  totalCapacity: z.number().int().min(1, "Capacity must be at least 1"),
  b2bRate: z.string().refine((v) => !v || Number(v) > 0, { message: "Rate must be greater than 0" }),
});

type HotelErrors = Partial<Record<"name" | "wilayaCode" | "email", string>>;
type RoomErrors = Partial<Record<"name" | "totalCapacity" | "b2bRate", string>>;

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-colors hover:bg-accent"
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-6 w-6 transition-colors ${
              star <= (hovered || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Inventory() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: hotel, isLoading } = trpc.hotel.myHotel.useQuery();
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery();
  const [editMode, setEditMode] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [hotelErrors, setHotelErrors] = useState<HotelErrors>({});
  const [roomErrors, setRoomErrors] = useState<RoomErrors>({});
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    starRating: 3,
    wilayaCode: 16,
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
  });
  const [roomForm, setRoomForm] = useState({ name: "", totalCapacity: 1, b2bRate: "" });

  const createHotel = trpc.hotel.createHotel.useMutation({
    onSuccess: () => {
      toast.success("Hotel created successfully");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateHotel = trpc.hotel.updateHotel.useMutation({
    onSuccess: () => {
      toast.success("Hotel updated");
      utils.hotel.myHotel.invalidate();
      setEditMode(false);
    },
    onError: (err) => toast.error(err.message),
  });
  const upsertRoom = trpc.hotel.upsertRoom.useMutation({
    onSuccess: () => {
      toast.success("Room saved");
      utils.hotel.myHotel.invalidate();
      setShowAddRoom(false);
      setRoomForm({ name: "", totalCapacity: 1, b2bRate: "" });
      setRoomErrors({});
    },
    onError: (err) => toast.error(err.message),
  });
  const adjustAvailability = trpc.hotel.adjustAvailability.useMutation({
    onSuccess: () => utils.hotel.myHotel.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const toggleRoom = trpc.hotel.toggleRoomActive.useMutation({
    onSuccess: () => {
      toast.success("Room status updated");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const hydrateForm = () => {
    if (!hotel) return;
    setForm({
      name: hotel.name || "",
      description: (hotel.description as string) || "",
      address: (hotel.address as string) || "",
      phone: (hotel.phone as string) || "",
      email: (hotel.email as string) || "",
      starRating: (hotel.starRating as number) || 3,
      wilayaCode: hotel.wilayaCode || 16,
      websiteUrl: (hotel.websiteUrl as string) || "",
      facebookUrl: (hotel.facebookUrl as string) || "",
      instagramUrl: (hotel.instagramUrl as string) || "",
    });
    setHotelErrors({});
  };

  const validateHotelForm = (): boolean => {
    const result = hotelSchema.safeParse({ name: form.name, wilayaCode: form.wilayaCode, email: form.email });
    if (!result.success) {
      const errors: HotelErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof HotelErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setHotelErrors(errors);
      return false;
    }
    setHotelErrors({});
    return true;
  };

  const validateRoomForm = (): boolean => {
    const result = roomSchema.safeParse(roomForm);
    if (!result.success) {
      const errors: RoomErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RoomErrors;
        if (!errors[field]) errors[field] = issue.message;
      }
      setRoomErrors(errors);
      return false;
    }
    setRoomErrors({});
    return true;
  };

  const handleCreate = () => {
    if (!validateHotelForm()) return;
    createHotel.mutate({
      name: form.name,
      description: form.description || undefined,
      wilayaCode: form.wilayaCode,
      address: form.address || undefined,
      starRating: form.starRating,
      phone: form.phone || undefined,
      email: form.email || undefined,
      websiteUrl: form.websiteUrl || undefined,
      facebookUrl: form.facebookUrl || undefined,
      instagramUrl: form.instagramUrl || undefined,
    });
  };

  const handleUpdate = () => {
    if (!validateHotelForm()) return;
    updateHotel.mutate({
      name: form.name || undefined,
      description: form.description || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      starRating: form.starRating,
      wilayaCode: form.wilayaCode,
    });
  };

  const handleAddRoom = () => {
    if (!validateRoomForm()) return;
    upsertRoom.mutate({
      name: roomForm.name,
      totalCapacity: roomForm.totalCapacity,
      b2bRate: parseFloat(roomForm.b2bRate),
    });
  };

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;

  if (isLoading) {
    return <LoadingCards count={4} />;
  }

  if (!hotel) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          eyebrow="Hotel setup"
          title="Create your hotel profile"
          description="Add the core information agencies need before you start publishing B2B inventory."
        />
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hotel name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setHotelErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder="Grand Hotel Alger"
                  className={hotelErrors.name ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.name} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of your hotel, services, and facilities..."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Wilaya *</Label>
                <Select
                  value={String(form.wilayaCode)}
                  onValueChange={(v) => { setForm({ ...form, wilayaCode: parseInt(v, 10) }); setHotelErrors((p) => ({ ...p, wilayaCode: undefined })); }}
                >
                  <SelectTrigger className={hotelErrors.wilayaCode ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {wilayas?.map((w) => (
                      <SelectItem key={w.code} value={String(w.code)}>
                        {w.code} – {w.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={hotelErrors.wilayaCode} />
              </div>
              <div className="space-y-1.5">
                <Label>Star rating</Label>
                <StarPicker value={form.starRating} onChange={(v) => setForm({ ...form, starRating: v })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+213 XXX XXX XXX" />
              </div>
              <div className="space-y-1.5">
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setHotelErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="contact@hotel.dz"
                  className={hotelErrors.email ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.email} />
              </div>
            </div>
            <Button className="w-full sm:w-auto" onClick={handleCreate} disabled={createHotel.isPending}>
              {createHotel.isPending ? "Creating..." : "Create hotel profile"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rooms = (hotel.rooms || []) as Array<Record<string, unknown>>;
  const activeRooms = rooms.filter((room) => room.isActive).length;
  const availableRooms = rooms.reduce((total, room) => total + Number(room.availableCount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Hotel workspace"
        title={hotel.name}
        description="Maintain hotel information, room rates, live availability, and publishable inventory."
        actions={
          editMode ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setEditMode(false); setHotelErrors({}); }}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateHotel.isPending}>
                <Save className="me-2 h-4 w-4" />
                {updateHotel.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => { hydrateForm(); setEditMode(true); }}>
              <Pencil className="me-2 h-4 w-4" />
              Edit hotel
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Rooms" value={rooms.length} icon={<Hotel className="h-5 w-5" />} />
        <StatCard label="Active" value={activeRooms} icon={<ToggleRight className="h-5 w-5" />} tone="green" />
        <StatCard label="Available" value={availableRooms} icon={<Plus className="h-5 w-5" />} tone="amber" />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editMode ? "Edit hotel profile" : "Hotel profile"}</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Hotel name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => { setForm({ ...form, name: e.target.value }); setHotelErrors((p) => ({ ...p, name: undefined })); }}
                  className={hotelErrors.name ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Star rating</Label>
                <StarPicker value={form.starRating} onChange={(v) => setForm({ ...form, starRating: v })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Wilaya *</Label>
                <Select
                  value={String(form.wilayaCode)}
                  onValueChange={(v) => setForm({ ...form, wilayaCode: parseInt(v, 10) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wilaya" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {wilayas?.map((w) => (
                      <SelectItem key={w.code} value={String(w.code)}>
                        {w.code} – {w.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); setHotelErrors((p) => ({ ...p, email: undefined })); }}
                  className={hotelErrors.email ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.email} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {hotel.description ? <p className="text-muted-foreground">{hotel.description as string}</p> : null}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                {hotel.address ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />{hotel.address as string}
                  </span>
                ) : null}
                {hotel.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />{hotel.phone as string}
                  </span>
                ) : null}
                {hotel.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />{hotel.email as string}
                  </span>
                ) : null}
                {hotel.starRating ? (
                  <span className="flex items-center gap-1">
                    {Array.from({ length: hotel.starRating as number }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("hotel.rooms")}</h2>
          <p className="text-sm text-muted-foreground">Manage B2B rates, active state, and real-time availability.</p>
        </div>
        <Button size="sm" onClick={() => { setShowAddRoom((v) => !v); setRoomErrors({}); }}>
          <Plus className="me-1 h-4 w-4" />
          {t("hotel.addRoom")}
        </Button>
      </div>

      {showAddRoom ? (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-4 sm:items-start">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs">{t("hotel.roomName")} *</Label>
                <Input
                  value={roomForm.name}
                  onChange={(e) => { setRoomForm({ ...roomForm, name: e.target.value }); setRoomErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder="Single room"
                  className={roomErrors.name ? "border-destructive" : ""}
                />
                <FieldError msg={roomErrors.name} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("hotel.capacity")} *</Label>
                <Input
                  type="number"
                  min={1}
                  value={roomForm.totalCapacity}
                  onChange={(e) => setRoomForm({ ...roomForm, totalCapacity: parseInt(e.target.value, 10) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("hotel.rate")} *</Label>
                <Input
                  type="number"
                  value={roomForm.b2bRate}
                  onChange={(e) => { setRoomForm({ ...roomForm, b2bRate: e.target.value }); setRoomErrors((p) => ({ ...p, b2bRate: undefined })); }}
                  placeholder="5000"
                  className={roomErrors.b2bRate ? "border-destructive" : ""}
                />
                <FieldError msg={roomErrors.b2bRate} />
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={handleAddRoom} disabled={upsertRoom.isPending}>
                  <Save className="me-1 h-4 w-4" />
                  {upsertRoom.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => { setShowAddRoom(false); setRoomErrors({}); }}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {rooms.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const isActive = Boolean(room.isActive);
            return (
              <Card
                key={room.id as string}
                className={`transition-all ${!isActive ? "opacity-60" : "hover:shadow-md"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{room.name as string}</h3>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {room.totalCapacity as number}
                      </p>
                    </div>
                    <div className="text-end">
                      <div className="font-bold text-primary">{Number(room.b2bRate).toLocaleString()} DZD</div>
                      <div className="text-xs text-muted-foreground">/night</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => adjustAvailability.mutate({ roomId: room.id as string, delta: -1 })}
                        disabled={adjustAvailability.isPending || Number(room.availableCount) <= 0}
                        aria-label="Decrease availability"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium tabular-nums">
                        {room.availableCount as number} / {room.totalCapacity as number}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => adjustAvailability.mutate({ roomId: room.id as string, delta: 1 })}
                        disabled={adjustAvailability.isPending || Number(room.availableCount) >= Number(room.totalCapacity)}
                        aria-label="Increase availability"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleRoom.mutate({ roomId: room.id as string })}
                      disabled={toggleRoom.isPending}
                    >
                      {isActive ? (
                        <><ToggleRight className="me-1 h-5 w-5 text-primary" />Active</>
                      ) : (
                        <><ToggleLeft className="me-1 h-5 w-5 text-muted-foreground" />Paused</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Hotel className="h-6 w-6" />}
          title="No rooms yet"
          description="Add your first room type to publish availability in the marketplace."
          action={
            <Button onClick={() => setShowAddRoom(true)}>
              <Plus className="me-2 h-4 w-4" />
              Add room
            </Button>
          }
        />
      )}
    </div>
  );
}
