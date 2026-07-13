import { useRef, useState } from "react";
import {
  CreditCard,
  Hotel,
  Image,
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
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  name: z.string().trim().min(2, "Hotel name must be at least 2 characters"),
  countryCode: z.enum(["DZ", "TN"], { message: "Please select a country" }),
  wilayaCode: z.number().min(1, "Please select a wilaya"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
});

const roomSchema = z.object({
  name: z.string().trim().min(1, "Room name is required"),
  totalCapacity: z
    .string()
    .refine(v => Number.isInteger(Number(v)) && Number(v) >= 1, {
      message: "Capacity must be at least 1",
    }),
  b2bRate: z
    .string()
    .refine(v => Number.isFinite(Number(v)) && Number(v) > 0, {
      message: "Rate must be greater than 0",
    }),
});

type HotelErrors = Partial<Record<"name" | "countryCode" | "wilayaCode" | "email", string>>;
type RoomErrors = Partial<Record<"name" | "totalCapacity" | "b2bRate", string>>;
type PaymentMethod = "online" | "offline" | "both";
const ROOM_TYPES = ["Single", "Double", "Triple", "Family Suite"] as const;

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
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
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-destructive">{msg}</p> : null;
}

export default function Inventory() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: hotel, isLoading } = trpc.hotel.myHotel.useQuery();
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    starRating: 3,
    countryCode: "DZ" as "DZ" | "TN",
    wilayaCode: 16,
    websiteUrl: "",
    facebookUrl: "",
    instagramUrl: "",
  });
  const { data: countries } = trpc.marketplace.listCountries.useQuery();
  const { data: wilayas } = trpc.marketplace.listWilayas.useQuery({ country: form.countryCode });
  const { data: invoices } = trpc.hotel.myInvoices.useQuery();
  const [editMode, setEditMode] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [hotelErrors, setHotelErrors] = useState<HotelErrors>({});
  const [roomErrors, setRoomErrors] = useState<RoomErrors>({});
  const [roomForm, setRoomForm] = useState({
    name: "",
    totalCapacity: "1",
    b2bRate: "",
    roomType: "Single",
  });

  // Payment Settings state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [ccpAccount, setCcpAccount] = useState("");
  const [bankRib, setBankRib] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Media gallery state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const createHotel = trpc.hotel.createHotel.useMutation({
    onSuccess: () => {
      toast.success("Hotel created successfully");
      utils.hotel.myHotel.invalidate();
    },
    onError: err => toast.error(err.message),
  });
  const updateHotel = trpc.hotel.updateHotel.useMutation({
    onSuccess: () => {
      toast.success("Hotel updated");
      utils.hotel.myHotel.invalidate();
      setEditMode(false);
    },
    onError: err => toast.error(err.message),
  });
  const upsertRoom = trpc.hotel.upsertRoom.useMutation({
    onSuccess: () => {
      toast.success("Room saved");
      utils.hotel.myHotel.invalidate();
      setShowAddRoom(false);
      setRoomForm({
        name: "",
        totalCapacity: "1",
        b2bRate: "",
        roomType: "Single",
      });
      setRoomErrors({});
    },
    onError: err => toast.error(err.message),
  });
  const adjustAvailability = trpc.hotel.adjustAvailability.useMutation({
    onSuccess: () => utils.hotel.myHotel.invalidate(),
    onError: err => toast.error(err.message),
  });
  const toggleRoom = trpc.hotel.toggleRoomActive.useMutation({
    onSuccess: () => {
      toast.success("Room status updated");
      utils.hotel.myHotel.invalidate();
    },
    onError: err => toast.error(err.message),
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
      countryCode: ((hotel.countryCode as "DZ" | "TN") || "DZ"),
      wilayaCode: hotel.wilayaCode || 16,
      websiteUrl: (hotel.websiteUrl as string) || "",
      facebookUrl: (hotel.facebookUrl as string) || "",
      instagramUrl: (hotel.instagramUrl as string) || "",
    });
    setHotelErrors({});
  };

  const validateHotelForm = (): boolean => {
    const result = hotelSchema.safeParse({
      name: form.name,
      countryCode: form.countryCode,
      wilayaCode: form.wilayaCode,
      email: form.email,
    });
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
    const result = roomSchema.safeParse({
      name: roomForm.name,
      totalCapacity: roomForm.totalCapacity,
      b2bRate: roomForm.b2bRate,
    });
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
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      countryCode: form.countryCode,
      wilayaCode: form.wilayaCode,
      address: form.address.trim() || undefined,
      starRating: form.starRating,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      websiteUrl: form.websiteUrl.trim() || undefined,
      facebookUrl: form.facebookUrl.trim() || undefined,
      instagramUrl: form.instagramUrl.trim() || undefined,
    });
  };

  const handleUpdate = () => {
    if (!validateHotelForm()) return;
    updateHotel.mutate({
      name: form.name.trim() || undefined,
      description: form.description.trim() || undefined,
      address: form.address.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      starRating: form.starRating,
      countryCode: form.countryCode,
      wilayaCode: form.wilayaCode,
    });
  };

  const handleAddRoom = () => {
    if (!validateRoomForm()) return;
    const fullName = roomForm.roomType
      ? `${roomForm.roomType} – ${roomForm.name.trim()}`
      : roomForm.name.trim();
    upsertRoom.mutate({
      name: fullName,
      totalCapacity: Number(roomForm.totalCapacity),
      b2bRate: Number(roomForm.b2bRate),
    });
  };

  const handleSavePayment = () => {
    setSavingPayment(true);
    // Build a payment settings note to append to description if needed
    // For now, just show success — UI-only feature as specified
    setTimeout(() => {
      setSavingPayment(false);
      toast.success("Payment settings saved");
    }, 600);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith("image/")
    );
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f =>
      f.type.startsWith("image/")
    );
    setSelectedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Hotel name *</Label>
                <Input
                  value={form.name}
                  onChange={e => {
                    setForm({ ...form, name: e.target.value });
                    setHotelErrors(p => ({ ...p, name: undefined }));
                  }}
                  placeholder="Grand Hotel Alger"
                  className={hotelErrors.name ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.name} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brief description of your hotel, services, and facilities..."
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Select
                  value={form.countryCode}
                  onValueChange={v => {
                    const countryCode = v as "DZ" | "TN";
                    setForm({ ...form, countryCode, wilayaCode: countryCode === "TN" ? 101 : 16 });
                    setHotelErrors(p => ({ ...p, countryCode: undefined, wilayaCode: undefined }));
                  }}
                >
                  <SelectTrigger className={hotelErrors.countryCode ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={hotelErrors.countryCode} />
              </div>
              <div className="space-y-1.5">
                <Label>{form.countryCode === "TN" ? "Governorate" : "Wilaya"} *</Label>
                <Select
                  value={String(form.wilayaCode)}
                  onValueChange={v => {
                    setForm({ ...form, wilayaCode: parseInt(v, 10) });
                    setHotelErrors(p => ({ ...p, wilayaCode: undefined }));
                  }}
                >
                  <SelectTrigger
                    className={
                      hotelErrors.wilayaCode ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder={form.countryCode === "TN" ? "Select governorate" : "Select wilaya"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {wilayas?.map(w => (
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
                <StarPicker
                  value={form.starRating}
                  onChange={v => setForm({ ...form, starRating: v })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Full address"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+213 XXX XXX XXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => {
                    setForm({ ...form, email: e.target.value });
                    setHotelErrors(p => ({ ...p, email: undefined }));
                  }}
                  placeholder="contact@hotel.dz"
                  className={hotelErrors.email ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.email} />
              </div>
            </div>
            <Button
              className="w-full sm:w-auto"
              onClick={handleCreate}
              disabled={createHotel.isPending}
            >
              {createHotel.isPending ? "Creating..." : "Create hotel profile"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const rooms = (hotel.rooms || []) as Array<Record<string, unknown>>;
  const photos = (hotel.photos || []) as Array<Record<string, unknown>>;
  const activeRooms = rooms.filter(room => room.isActive).length;
  const availableRooms = rooms.reduce(
    (total, room) => total + Number(room.availableCount || 0),
    0
  );

  const invoiceList = (invoices ?? []) as Array<Record<string, unknown>>;
  const totalCommission = invoiceList.reduce(
    (sum, inv) => sum + Number(inv.commissionDue ?? 0),
    0
  );
  const lowAvailabilityRooms = rooms.filter(room => Number(room.availableCount || 0) <= Math.max(1, Math.floor(Number(room.totalCapacity || 0) * 0.2))).length;
  const unpublishedPhotos = photos.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="Hotel workspace"
        title={hotel.name}
        description="Maintain hotel information, room rates, live availability, and publishable inventory."
        actions={
          editMode ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setHotelErrors({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateHotel.isPending}>
                <Save className="me-2 h-4 w-4" />
                {updateHotel.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                hydrateForm();
                setEditMode(true);
              }}
            >
              <Pencil className="me-2 h-4 w-4" />
              Edit hotel
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-6">
        {[
          { href: "#profile", label: "Profile" },
          { href: "#rooms", label: "Rooms" },
          { href: "#availability", label: "Availability" },
          { href: "#payments", label: "Payments" },
          { href: "#finance", label: "Finance" },
          { href: "#media", label: "Photos" },
        ].map(item => (
          <a
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </div>

      {(lowAvailabilityRooms > 0 || unpublishedPhotos) ? (
        <div className="mb-6 grid gap-3 lg:grid-cols-2">
          {lowAvailabilityRooms > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="font-semibold">{lowAvailabilityRooms} room type{lowAvailabilityRooms > 1 ? "s" : ""}</span> need availability attention.
            </div>
          ) : null}
          {unpublishedPhotos ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
              Add hotel photos to make the listing more credible for agencies.
            </div>
          ) : null}
        </div>
      ) : null}

      <div id="availability" className="mb-6 grid gap-4 sm:grid-cols-4 scroll-mt-24">
        <StatCard
          label="Rooms"
          value={rooms.length}
          icon={<Hotel className="h-5 w-5" />}
        />
        <StatCard
          label="Active"
          value={activeRooms}
          icon={<ToggleRight className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Available"
          value={availableRooms}
          icon={<Plus className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Low stock"
          value={lowAvailabilityRooms}
          icon={<Minus className="h-5 w-5" />}
          tone={lowAvailabilityRooms > 0 ? "amber" : "green"}
        />
      </div>

      <section id="profile" className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card mb-6">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="font-semibold text-foreground">
            {editMode ? "Edit hotel profile" : "Hotel profile"}
          </h3>
        </div>
        <div className="p-5">
          {editMode ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Hotel name *</Label>
                <Input
                  value={form.name}
                  onChange={e => {
                    setForm({ ...form, name: e.target.value });
                    setHotelErrors(p => ({ ...p, name: undefined }));
                  }}
                  className={hotelErrors.name ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.name} />
              </div>
              <div className="space-y-1.5">
                <Label>Star rating</Label>
                <StarPicker
                  value={form.starRating}
                  onChange={v => setForm({ ...form, starRating: v })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Country *</Label>
                <Select
                  value={form.countryCode}
                  onValueChange={v => {
                    const countryCode = v as "DZ" | "TN";
                    setForm({ ...form, countryCode, wilayaCode: countryCode === "TN" ? 101 : 16 });
                    setHotelErrors(p => ({ ...p, countryCode: undefined, wilayaCode: undefined }));
                  }}
                >
                  <SelectTrigger className={hotelErrors.countryCode ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries?.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={hotelErrors.countryCode} />
              </div>
              <div className="space-y-1.5">
                <Label>{form.countryCode === "TN" ? "Governorate" : "Wilaya"} *</Label>
                <Select
                  value={String(form.wilayaCode)}
                  onValueChange={v => {
                    setForm({ ...form, wilayaCode: parseInt(v, 10) });
                    setHotelErrors(p => ({ ...p, wilayaCode: undefined }));
                  }}
                >
                  <SelectTrigger className={hotelErrors.wilayaCode ? "border-destructive" : ""}>
                    <SelectValue placeholder={form.countryCode === "TN" ? "Select governorate" : "Select wilaya"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {wilayas?.map(w => (
                      <SelectItem key={w.code} value={String(w.code)}>
                        {w.code} – {w.nameFr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={hotelErrors.wilayaCode} />
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => {
                    setForm({ ...form, email: e.target.value });
                    setHotelErrors(p => ({ ...p, email: undefined }));
                  }}
                  className={hotelErrors.email ? "border-destructive" : ""}
                />
                <FieldError msg={hotelErrors.email} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {hotel.description ? (
                <p className="text-muted-foreground">
                  {hotel.description as string}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-muted-foreground">
                {hotel.address ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {hotel.address as string}
                  </span>
                ) : null}
                {hotel.phone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {hotel.phone as string}
                  </span>
                ) : null}
                {hotel.email ? (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {hotel.email as string}
                  </span>
                ) : null}
                {hotel.starRating ? (
                  <span className="flex items-center gap-1">
                    {Array.from({ length: hotel.starRating as number }).map(
                      (_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        />
                      )
                    )}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Payment Settings */}
      <section id="payments" className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card mb-6">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </h3>
        </div>
        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Accepted payment methods
            </Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={v => setPaymentMethod(v as PaymentMethod)}
              className="flex flex-col gap-2 sm:flex-row sm:gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="online" id="pm-online" />
                <Label
                  htmlFor="pm-online"
                  className="cursor-pointer font-normal"
                >
                  Online Only
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="offline" id="pm-offline" />
                <Label
                  htmlFor="pm-offline"
                  className="cursor-pointer font-normal"
                >
                  Offline Only
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="both" id="pm-both" />
                <Label htmlFor="pm-both" className="cursor-pointer font-normal">
                  Both Payment Methods
                </Label>
              </div>
            </RadioGroup>
          </div>

          {(paymentMethod === "offline" || paymentMethod === "both") && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Wallet className="h-4 w-4" />
                Offline payment account details
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    CCP Account Number (Post Office)
                  </Label>
                  <Input
                    value={ccpAccount}
                    onChange={e => setCcpAccount(e.target.value)}
                    placeholder="0000000 / 00"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank RIB Number</Label>
                  <Input
                    value={bankRib}
                    onChange={e => setBankRib(e.target.value)}
                    placeholder="00000 00000 00000000000 00"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            size="sm"
            onClick={handleSavePayment}
            disabled={savingPayment}
          >
            <Save className="me-2 h-4 w-4" />
            {savingPayment ? "Saving..." : "Save Payment Settings"}
          </Button>
        </div>
      </section>

      {/* Hotel Photos */}
      <section id="media" className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card mb-6">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
            <Image className="h-5 w-5" />
            Hotel Photos
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Existing photos grid */}
          {photos.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Uploaded photos ({photos.length})
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {photos.map(photo => (
                  <div
                    key={photo.id as string}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <div className="flex h-full items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {(photo.storagePath as string)?.split("/").pop() ??
                        "photo"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag and drop zone */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
            }`}
          >
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag photos here or click to upload
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                PNG, JPG, WEBP — up to 10 MB each
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Upload className="me-2 h-4 w-4" />
              Upload Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Selected files preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Selected files ({selectedFiles.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs"
                  >
                    <Image className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  toast.info("Photo upload API not yet connected");
                }}
              >
                <Upload className="me-2 h-4 w-4" />
                Upload {selectedFiles.length} photo
                {selectedFiles.length !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Room Management */}
      <section id="rooms" className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("hotel.rooms")}</h2>
          <p className="text-sm text-muted-foreground">
            Manage B2B rates, active state, and real-time availability.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowAddRoom(v => !v);
            setRoomErrors({});
          }}
        >
          <Plus className="me-1 h-4 w-4" />
          {t("hotel.addRoom")}
        </Button>
      </div>

      {showAddRoom ? (
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/5 mb-4">
          <div className="p-4">
            <div className="grid gap-3 sm:grid-cols-5 sm:items-start">
              <div className="space-y-1.5">
                <Label className="text-xs">Room Type</Label>
                <Select
                  value={roomForm.roomType}
                  onValueChange={v => setRoomForm({ ...roomForm, roomType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map(rt => (
                      <SelectItem key={rt} value={rt}>
                        {rt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs">{t("hotel.roomName")} *</Label>
                <Input
                  value={roomForm.name}
                  onChange={e => {
                    setRoomForm({ ...roomForm, name: e.target.value });
                    setRoomErrors(p => ({ ...p, name: undefined }));
                  }}
                  placeholder="Deluxe"
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
                  onChange={e => {
                    setRoomForm({
                      ...roomForm,
                      totalCapacity: e.target.value,
                    });
                    setRoomErrors(p => ({ ...p, totalCapacity: undefined }));
                  }}
                  onBlur={e => {
                    if (!Number.isInteger(Number(e.target.value)) || Number(e.target.value) < 1) {
                      setRoomForm({ ...roomForm, totalCapacity: "1" });
                    }
                  }}
                  className={roomErrors.totalCapacity ? "border-destructive" : ""}
                />
                <FieldError msg={roomErrors.totalCapacity} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("hotel.rate")} *</Label>
                <Input
                  type="number"
                  value={roomForm.b2bRate}
                  onChange={e => {
                    setRoomForm({ ...roomForm, b2bRate: e.target.value });
                    setRoomErrors(p => ({ ...p, b2bRate: undefined }));
                  }}
                  placeholder="5000"
                  className={roomErrors.b2bRate ? "border-destructive" : ""}
                />
                <FieldError msg={roomErrors.b2bRate} />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  size="sm"
                  onClick={handleAddRoom}
                  disabled={upsertRoom.isPending}
                >
                  <Save className="me-1 h-4 w-4" />
                  {upsertRoom.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setShowAddRoom(false);
                    setRoomErrors({});
                  }}
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {rooms.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map(room => {
            const isActive = Boolean(room.isActive);
            return (
              <div
                key={room.id as string}
                className={`overflow-hidden rounded-xl border border-border bg-card transition-all ${!isActive ? "opacity-60" : "hover:shadow-md"}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {room.name as string}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {room.totalCapacity as number}
                      </p>
                    </div>
                    <div className="text-end">
                      <div className="font-bold text-primary">
                        {Number(room.b2bRate).toLocaleString()} DZD
                      </div>
                      <div className="text-xs text-muted-foreground">
                        /night
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() =>
                          adjustAvailability.mutate({
                            roomId: room.id as string,
                            delta: -1,
                          })
                        }
                        disabled={
                          adjustAvailability.isPending ||
                          Number(room.availableCount) <= 0
                        }
                        aria-label="Decrease availability"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium tabular-nums">
                        {room.availableCount as number} /{" "}
                        {room.totalCapacity as number}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() =>
                          adjustAvailability.mutate({
                            roomId: room.id as string,
                            delta: 1,
                          })
                        }
                        disabled={
                          adjustAvailability.isPending ||
                          Number(room.availableCount) >=
                            Number(room.totalCapacity)
                        }
                        aria-label="Increase availability"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        toggleRoom.mutate({ roomId: room.id as string })
                      }
                      disabled={toggleRoom.isPending}
                    >
                      {isActive ? (
                        <>
                          <ToggleRight className="me-1 h-5 w-5 text-primary" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="me-1 h-5 w-5 text-muted-foreground" />
                          Paused
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
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
      </section>

      {/* Commission Ledger */}
      <section id="finance" className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card mt-8">
        <div className="border-b border-border/60 px-5 py-4">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5" />
              Platform Commission Ledger
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time tracking of 5% platform commissions
            </p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {invoiceList.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-8 text-center">
              <Wallet className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No commission records yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Commissions are tracked per confirmed offline booking at a 5%
                rate.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Period
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                        Bookings Total
                      </th>
                      <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">
                        Commission (5%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceList.map((inv, idx) => (
                      <tr
                        key={inv.id as string}
                        className={`border-b border-border last:border-0 ${idx % 2 === 0 ? "" : "bg-muted/20"}`}
                      >
                        <td className="px-4 py-3 font-medium">
                          {MONTH_NAMES[(inv.periodMonth as number) - 1]}{" "}
                          {inv.periodYear as number}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              inv.status === "paid"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            }`}
                          >
                            {(inv.status as string) === "paid"
                              ? "Paid"
                              : "Unpaid"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {Number(inv.bookingsTotal ?? 0).toLocaleString()} DZD
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                          {Number(inv.commissionDue ?? 0).toLocaleString()} DZD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <span className="text-sm font-medium">
                  Total accumulated commission
                </span>
                <span className="text-base font-bold text-primary tabular-nums">
                  {totalCommission.toLocaleString()} DZD
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Commission Rate: 5% of total booking value per confirmed offline
                booking. Monthly invoices are generated automatically on the 1st
                of each month.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
