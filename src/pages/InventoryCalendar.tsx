import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type CalendarView = "month";

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Pad start
  const startDow = firstDay.getDay();
  for (let i = 0; i < startDow; i++) {
    days.push(new Date(year, month, -startDow + i + 1));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function InventoryCalendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockQuantity, setBlockQuantity] = useState(1);
  const [blockReason, setBlockReason] = useState("");
  const [blockNote, setBlockNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: hotel, isLoading } = trpc.hotel.myHotel.useQuery();

  const days = getDaysInMonth(year, month);
  const rooms = (hotel?.rooms || []) as Array<Record<string, any>>;

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function handleCreateBlock() {
    if (!blockStart || !blockEnd || !blockReason) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (new Date(blockEnd) <= new Date(blockStart)) {
      toast.error("End date must be after start date");
      return;
    }
    setIsSubmitting(true);
    try {
      // In production: call a mutation to create a manual block
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Block created successfully");
      setBlockDialogOpen(false);
      setBlockStart("");
      setBlockEnd("");
      setBlockReason("");
      setBlockNote("");
    } catch {
      toast.error("Failed to create block");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No hotel profile</AlertTitle>
        <AlertDescription>
          You need to create your hotel profile first.{" "}
          <Link to="/inventory" className="font-medium underline">
            Go to Inventory
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const selectedRoom = selectedRoomId !== "all"
    ? rooms.find((r) => r.id === selectedRoomId)
    : null;

  const totalCapacity = selectedRoom
    ? Number(selectedRoom.totalCapacity || 0)
    : rooms.reduce((s, r) => s + Number(r.totalCapacity || 0), 0);

  const available = selectedRoom
    ? Number(selectedRoom.availableCount || 0)
    : rooms.reduce((s, r) => s + Number(r.availableCount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Hotel"
        title="Availability Calendar"
        description="View and manage room availability, holds, and manual blocks."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/inventory">
                <ArrowLeft className="me-1.5 h-4 w-4" />
                Back to inventory
              </Link>
            </Button>
            <Button onClick={() => setBlockDialogOpen(true)}>
              <Plus className="me-1.5 h-4 w-4" />
              Add block
            </Button>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span>Partial hold</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-rose-500" />
          <span>Fully booked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-slate-400" />
          <span>Manual block</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[10rem] text-center font-semibold">
            {MONTH_NAMES[month]} {year}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Availability summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4">
            <div className="text-xs text-muted-foreground">Total capacity</div>
            <div className="mt-1 text-2xl font-bold">{totalCapacity}</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4">
            <div className="text-xs text-muted-foreground">Available</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{available}</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4">
            <div className="text-xs text-muted-foreground">Held/Booked</div>
            <div className="mt-1 text-2xl font-bold text-amber-600">{totalCapacity - available}</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-4">
            <div className="text-xs text-muted-foreground">Rooms</div>
            <div className="mt-1 text-2xl font-bold">{rooms.length}</div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border/60 px-5 py-4">
          <h3 className="font-semibold text-foreground">
            {MONTH_NAMES[month]} {year}
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {days.map((day, i) => {
              const isCurrentMonth = day.getMonth() === month;
              const isToday = fmtDate(day) === fmtDate(today);
              const isPast = day < today && !isToday;

              return (
                <div
                  key={i}
                  className={`min-h-[4rem] rounded-lg border p-1 transition-colors ${
                    !isCurrentMonth ? "opacity-30" : ""
                  } ${isToday ? "border-primary bg-primary/5" : "border-border/50"} ${
                    isPast && isCurrentMonth ? "bg-muted/30" : ""
                  }`}
                >
                  <div
                    className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                  {isCurrentMonth && !isPast && available > 0 ? (
                    <div className="rounded px-1 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-medium">
                      {available} avail.
                    </div>
                  ) : isCurrentMonth && !isPast ? (
                    <div className="rounded px-1 py-0.5 text-[10px] bg-rose-100 text-rose-800 font-medium">
                      Full
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Room breakdown */}
      {rooms.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border/60 px-5 py-4">
            <h3 className="font-semibold text-foreground">Room inventory</h3>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {rooms.map((room) => {
                const cap = Number(room.totalCapacity || 0);
                const avail = Number(room.availableCount || 0);
                const pct = cap > 0 ? (avail / cap) * 100 : 0;
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <div className="font-medium">{room.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {Number(room.b2bRate).toLocaleString("fr-DZ")} DZD/night
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="text-right">
                        <div className="font-semibold text-emerald-600">
                          {avail}/{cap}
                        </div>
                        <div className="text-xs text-muted-foreground">available</div>
                      </div>
                      <Badge
                        variant={pct > 50 ? "secondary" : pct > 0 ? "outline" : "destructive"}
                        className="shrink-0"
                      >
                        {pct > 50 ? "Available" : pct > 0 ? "Limited" : "Full"}
                      </Badge>
                      {!room.isActive ? (
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Block sheet */}
      <Sheet open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create manual block</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4 px-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="block-start">Start date *</Label>
                <Input
                  id="block-start"
                  type="date"
                  value={blockStart}
                  min={fmtDate(today)}
                  onChange={(e) => setBlockStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="block-end">End date *</Label>
                <Input
                  id="block-end"
                  type="date"
                  value={blockEnd}
                  min={blockStart || fmtDate(today)}
                  onChange={(e) => setBlockEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-room">Room type</Label>
              <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                <SelectTrigger id="block-room">
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-qty">Quantity to block *</Label>
              <Input
                id="block-qty"
                type="number"
                min={1}
                value={blockQuantity}
                onChange={(e) => setBlockQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-reason">Reason *</Label>
              <Input
                id="block-reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Renovation, Private event..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="block-note">Note (optional)</Label>
              <Textarea
                id="block-note"
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                rows={2}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <SheetFooter className="px-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBlock} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create block"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
