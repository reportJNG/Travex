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
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function Inventory() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: hotel, isLoading } = trpc.hotel.myHotel.useQuery();
  const [editMode, setEditMode] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
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
      toast.success("Hotel created");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const updateHotel = trpc.hotel.updateHotel.useMutation({
    onSuccess: () => {
      toast.success("Updated");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const upsertRoom = trpc.hotel.upsertRoom.useMutation({
    onSuccess: () => {
      toast.success("Room saved");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const adjustAvailability = trpc.hotel.adjustAvailability.useMutation({
    onSuccess: () => utils.hotel.myHotel.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const toggleRoom = trpc.hotel.toggleRoomActive.useMutation({
    onSuccess: () => {
      toast.success("Room updated");
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
  };

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
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
    updateHotel.mutate({
      name: form.name || undefined,
      description: form.description || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
    });
    setEditMode(false);
  };

  const handleAddRoom = () => {
    if (!roomForm.name.trim() || !roomForm.b2bRate) {
      toast.error("All fields required");
      return;
    }
    upsertRoom.mutate({
      name: roomForm.name,
      totalCapacity: roomForm.totalCapacity,
      b2bRate: parseFloat(roomForm.b2bRate),
    });
    setRoomForm({ name: "", totalCapacity: 1, b2bRate: "" });
    setShowAddRoom(false);
  };

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
              <div className="space-y-2 sm:col-span-2">
                <Label>Hotel name *</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Wilaya code *</Label>
                <Input type="number" value={form.wilayaCode} onChange={(event) => setForm({ ...form, wilayaCode: parseInt(event.target.value, 10) || 16 })} />
              </div>
              <div className="space-y-2">
                <Label>Star rating</Label>
                <Input type="number" min={1} max={5} value={form.starRating} onChange={(event) => setForm({ ...form, starRating: parseInt(event.target.value, 10) || 3 })} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </div>
            </div>
            <Button className="w-full sm:w-auto" onClick={handleCreate} disabled={createHotel.isPending}>
              {createHotel.isPending ? "Creating..." : "Create hotel"}
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
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => {
              if (editMode) {
                handleUpdate();
              } else {
                hydrateForm();
                setEditMode(true);
              }
            }}
            disabled={updateHotel.isPending}
          >
            {editMode ? <Save className="me-2 h-4 w-4" /> : <Pencil className="me-2 h-4 w-4" />}
            {editMode ? "Save hotel" : "Edit hotel"}
          </Button>
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
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {hotel.description ? <p className="text-muted-foreground">{hotel.description as string}</p> : null}
              <div className="flex flex-wrap gap-4 text-muted-foreground">
                {hotel.address ? <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{hotel.address as string}</span> : null}
                {hotel.phone ? <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{hotel.phone as string}</span> : null}
                {hotel.email ? <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{hotel.email as string}</span> : null}
                {hotel.starRating ? <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{hotel.starRating as number} stars</span> : null}
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
        <Button size="sm" onClick={() => setShowAddRoom((value) => !value)}>
          <Plus className="me-1 h-4 w-4" />
          {t("hotel.addRoom")}
        </Button>
      </div>

      {showAddRoom ? (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label className="text-xs">{t("hotel.roomName")}</Label>
                <Input value={roomForm.name} onChange={(event) => setRoomForm({ ...roomForm, name: event.target.value })} placeholder="Single room" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("hotel.capacity")}</Label>
                <Input type="number" min={1} value={roomForm.totalCapacity} onChange={(event) => setRoomForm({ ...roomForm, totalCapacity: parseInt(event.target.value, 10) || 1 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("hotel.rate")}</Label>
                <Input type="number" value={roomForm.b2bRate} onChange={(event) => setRoomForm({ ...roomForm, b2bRate: event.target.value })} placeholder="5000" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddRoom} disabled={upsertRoom.isPending}>
                  <Save className="me-1 h-4 w-4" />
                  Save
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShowAddRoom(false)} aria-label="Cancel adding room">
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
              <Card key={room.id as string} className={!isActive ? "opacity-70" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">{room.name as string}</h3>
                      <p className="text-sm text-muted-foreground">Capacity: {room.totalCapacity as number}</p>
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
                        disabled={adjustAvailability.isPending}
                        aria-label="Decrease availability"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                        {room.availableCount as number} / {room.totalCapacity as number}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => adjustAvailability.mutate({ roomId: room.id as string, delta: 1 })}
                        disabled={adjustAvailability.isPending}
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
                      {isActive ? <ToggleRight className="me-1 h-5 w-5 text-primary" /> : <ToggleLeft className="me-1 h-5 w-5 text-muted-foreground" />}
                      {isActive ? "Active" : "Paused"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<Hotel className="h-6 w-6" />} title="No rooms yet" description="Add your first room type to publish availability in the marketplace." />
      )}
    </div>
  );
}
