import { useState } from "react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Hotel, Plus, Minus, Pencil, ToggleLeft, ToggleRight,
  Save, X, MapPin, Phone, Star
} from "lucide-react";

export default function Inventory() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: hotel, isLoading } = trpc.hotel.myHotel.useQuery();
  const createHotel = trpc.hotel.createHotel.useMutation({
    onSuccess: () => { toast.success("Hotel created"); utils.hotel.myHotel.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const updateHotel = trpc.hotel.updateHotel.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.hotel.myHotel.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const upsertRoom = trpc.hotel.upsertRoom.useMutation({
    onSuccess: () => { toast.success("Room saved"); utils.hotel.myHotel.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const adjustAvailability = trpc.hotel.adjustAvailability.useMutation({
    onSuccess: () => utils.hotel.myHotel.invalidate(),
  });
  const toggleRoom = trpc.hotel.toggleRoomActive.useMutation({
    onSuccess: () => { toast.success("Toggled"); utils.hotel.myHotel.invalidate(); },
  });

  const [editMode, setEditMode] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", address: "", phone: "", email: "",
    starRating: 3, wilayaCode: 16, websiteUrl: "", facebookUrl: "", instagramUrl: "",
  });
  const [roomForm, setRoomForm] = useState({ name: "", totalCapacity: 1, b2bRate: "" });

  const handleCreate = () => {
    if (!form.name) { toast.error("Name is required"); return; }
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
    if (!roomForm.name || !roomForm.b2bRate) { toast.error("All fields required"); return; }
    upsertRoom.mutate({
      name: roomForm.name,
      totalCapacity: roomForm.totalCapacity,
      b2bRate: parseFloat(roomForm.b2bRate),
    });
    setRoomForm({ name: "", totalCapacity: 1, b2bRate: "" });
    setShowAddRoom(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  // No hotel yet - creation form
  if (!hotel) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Create Your Hotel Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Hotel Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Wilaya Code *</Label>
                <Input type="number" value={form.wilayaCode} onChange={(e) => setForm({ ...form, wilayaCode: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Star Rating</Label>
                <Input type="number" min={1} max={5} value={form.starRating} onChange={(e) => setForm({ ...form, starRating: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleCreate}
              disabled={createHotel.isPending}
            >
              {createHotel.isPending ? "Creating..." : "Create Hotel"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hotel exists - show profile and rooms
  const hrooms = (hotel.rooms || []) as Array<Record<string, unknown>>;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Hotel Profile */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hotel className="h-5 w-5" />
            {editMode ? "Edit Hotel" : hotel.name}
          </CardTitle>
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (editMode) {
                handleUpdate();
              } else {
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
                setEditMode(true);
              }
            }}
          >
            {editMode ? <><Save className="h-4 w-4 me-1" /> Save</> : <><Pencil className="h-4 w-4 me-1" /> Edit</>}
          </Button>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {hotel.description && <p className="text-slate-600">{hotel.description as string}</p>}
              <div className="flex flex-wrap gap-4 text-slate-500">
                {hotel.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{hotel.address as string}</span>}
                {hotel.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{hotel.phone as string}</span>}
                {hotel.starRating && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {hotel.starRating as number} stars
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rooms */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">{t("hotel.rooms")}</h2>
          <Button size="sm" onClick={() => setShowAddRoom(!showAddRoom)}>
            <Plus className="h-4 w-4 me-1" />
            {t("hotel.addRoom")}
          </Button>
        </div>

        {showAddRoom && (
          <Card className="mb-4 border-teal-200 bg-teal-50/50">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("hotel.roomName")}</Label>
                  <Input
                    size={1}
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    placeholder="e.g. Single Room"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("hotel.capacity")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={roomForm.totalCapacity}
                    onChange={(e) => setRoomForm({ ...roomForm, totalCapacity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("hotel.rate")}</Label>
                  <Input
                    type="number"
                    value={roomForm.b2bRate}
                    onChange={(e) => setRoomForm({ ...roomForm, b2bRate: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddRoom} className="bg-teal-600 hover:bg-teal-700">
                    <Save className="h-4 w-4 me-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddRoom(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hrooms.map((room: Record<string, unknown>) => (
            <Card key={room.id as number} className={!(room.isActive as boolean) ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-800">{room.name as string}</h3>
                    <p className="text-sm text-slate-500">
                      Capacité: {room.totalCapacity as number}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-700">
                      {Number(room.b2bRate).toLocaleString()} DZD
                    </span>
                    <span className="text-xs text-slate-400 block">/nuit</span>
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustAvailability.mutate({ roomId: room.id as number, delta: -1 })}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Badge
                      variant={(room.availableCount as number) > 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {room.availableCount as number} / {room.totalCapacity as number}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => adjustAvailability.mutate({ roomId: room.id as number, delta: 1 })}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 p-0 px-2"
                    onClick={() => toggleRoom.mutate({ roomId: room.id as number })}
                  >
                    {room.isActive ? (
                      <ToggleRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-5 w-5 text-slate-400" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
