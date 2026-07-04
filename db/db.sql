-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  TRAVEX — Complete Supabase SQL                                            ║
-- ║  Paste this entire file into the Supabase SQL Editor and click RUN.        ║
-- ║  Order matters — run it top to bottom in one shot.                         ║
-- ║  After running: create your first admin user (instructions at the bottom). ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝


-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. EXTENSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";     -- gen_random_uuid()
create extension if not exists "pg_trgm";      -- fuzzy search (admin user search, claim matching)


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. ENUMS
-- ═══════════════════════════════════════════════════════════════════════════════

create type user_role      as enum ('agency', 'hotel', 'super_admin');
create type account_status as enum ('awaiting_review', 'approved', 'rejected', 'suspended');
create type doc_type       as enum ('commercial_registry', 'tax_card', 'tourism_license', 'other');
create type booking_status as enum (
  'pending_payment',            -- online: checkout created, waiting gateway callback
  'pending_hotel',              -- offline: sent to hotel, 24h to respond
  'awaiting_offline_payment',   -- hotel agreed, agency must pay externally before deadline
  'confirmed',                  -- payment done (online or hotel clicked Received)
  'completed',                  -- stay finished (check_out < today), stock restored
  'rejected',                   -- hotel refused
  'expired',                    -- deadline passed (24h or payment window)
  'cancelled'                   -- online payment failed / abandoned / sold-out race
);
create type payment_method as enum ('cib', 'edahabia', 'offline');
create type payment_status as enum ('initiated', 'paid', 'failed', 'refund_required', 'refunded');
create type invoice_status as enum ('unpaid', 'paid', 'overdue');
create type claim_status   as enum ('pending', 'approved', 'rejected');


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. REFERENCE TABLES (wilayas, amenities, platform settings)
-- ═══════════════════════════════════════════════════════════════════════════════

create table wilayas (
  code    int primary key,
  name_fr text not null,
  name_ar text not null,
  name_en text not null,
  lat     double precision,
  lng     double precision
);

create table amenities (
  id          serial primary key,
  key         text unique not null,
  lucide_icon text not null,
  label       jsonb not null              -- {"ar":"…","fr":"…","en":"…"}
);

create table platform_settings (
  key   text primary key,
  value jsonb not null
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. IDENTITY & VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════════

create table profiles (
  id               uuid primary key references auth.users on delete cascade,
  role             user_role not null,
  status           account_status not null default 'awaiting_review',
  full_name        text not null,
  legal_name       text not null,
  email            text not null,
  phone            text not null,
  wilaya_code      int references wilayas(code),
  tax_id           text,
  license_number   text,
  preferred_locale text not null default 'fr'
                   check (preferred_locale in ('ar','fr','en')),
  rejection_reason text,
  reviewed_by      uuid references profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table business_documents (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  type          doc_type not null,
  storage_path  text not null,
  original_name text not null,
  uploaded_at   timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. HOTELS, PHOTOS, AMENITIES, ROOMS
-- ═══════════════════════════════════════════════════════════════════════════════

create table hotels (
  id                           uuid primary key default gen_random_uuid(),
  owner_profile_id             uuid references profiles(id),   -- NULL = seeded/unclaimed
  is_seeded                    boolean not null default false,
  is_active                    boolean not null default true,
  name                         text not null,
  description                  text,
  wilaya_code                  int not null references wilayas(code),
  address                      text,
  star_rating                  int check (star_rating between 1 and 5),
  phone                        text,
  email                        text,
  website_url                  text,
  facebook_url                 text,
  instagram_url                text,
  google_maps_url              text,
  google_place_id              text unique,
  lat                          double precision,
  lng                          double precision,
  offline_payment_window_hours int not null default 48
                               check (offline_payment_window_hours between 6 and 168),
  replaced_seeded_id           uuid references hotels(id),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now()
);

-- v1: one hotel per account
create unique index one_hotel_per_owner on hotels(owner_profile_id)
  where owner_profile_id is not null;

create table hotel_photos (
  id           uuid primary key default gen_random_uuid(),
  hotel_id     uuid not null references hotels(id) on delete cascade,
  storage_path text not null,
  sort_order   int not null default 0
);

create table hotel_amenities (
  hotel_id   uuid references hotels(id) on delete cascade,
  amenity_id int  references amenities(id) on delete cascade,
  primary key (hotel_id, amenity_id)
);

create table room_types (
  id              uuid primary key default gen_random_uuid(),
  hotel_id        uuid not null references hotels(id) on delete cascade,
  name            text not null,
  total_capacity  int not null check (total_capacity > 0),
  available_count int not null check (available_count >= 0),
  b2b_rate        numeric(12,2) not null check (b2b_rate > 0),
  thumbnail_path  text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (available_count <= total_capacity)
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. BOOKINGS & PAYMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

create sequence booking_ref_seq;

create table bookings (
  id                     uuid primary key default gen_random_uuid(),
  reference              text unique not null default '',
  agency_id              uuid not null references profiles(id),
  hotel_id               uuid not null references hotels(id),
  room_type_id           uuid not null references room_types(id),
  room_name_snapshot     text not null,
  nightly_rate_snapshot  numeric(12,2) not null,
  rooms_count            int not null check (rooms_count > 0),
  check_in               date not null,
  check_out              date not null,
  nights                 int generated always as (check_out - check_in) stored,
  total_price            numeric(12,2) not null,
  commission_rate        numeric(5,2) not null,
  commission_amount      numeric(12,2),
  payment_method         payment_method not null,
  status                 booking_status not null,
  rejection_reason       text,
  hotel_deadline         timestamptz,
  payment_deadline       timestamptz,
  confirmed_at           timestamptz,
  received_confirmed_at  timestamptz,
  voucher_path           text,
  archived_by_agency     boolean not null default false,
  invoice_id             uuid,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  check (check_out > check_in)
);

-- Auto-generate booking reference: TVX-2026-000001
create or replace function set_booking_reference()
returns trigger language plpgsql as $$
begin
  new.reference := 'TVX-' || to_char(now(), 'YYYY') || '-'
                   || lpad(nextval('booking_ref_seq')::text, 6, '0');
  return new;
end $$;

create trigger trg_booking_ref
  before insert on bookings
  for each row execute function set_booking_reference();

create table payments (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references bookings(id) on delete cascade,
  provider    text not null default 'chargily',
  method      payment_method not null,
  checkout_id text unique,
  amount      numeric(12,2) not null,
  status      payment_status not null default 'initiated',
  raw         jsonb,
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. INVOICING
-- ═══════════════════════════════════════════════════════════════════════════════

create table invoices (
  id               uuid primary key default gen_random_uuid(),
  hotel_id         uuid not null references hotels(id),
  period_year      int not null,
  period_month     int not null check (period_month between 1 and 12),
  bookings_total   numeric(14,2) not null,
  commission_due   numeric(14,2) not null,
  status           invoice_status not null default 'unpaid',
  pdf_path         text,
  issued_at        timestamptz not null default now(),
  due_date         date not null,
  paid_at          timestamptz,
  payment_reference text,
  unique (hotel_id, period_year, period_month)
);

create table invoice_items (
  invoice_id uuid references invoices(id) on delete cascade,
  booking_id uuid references bookings(id),
  amount     numeric(12,2) not null,
  commission numeric(12,2) not null,
  primary key (invoice_id, booking_id)
);

-- Now add the FK from bookings → invoices (deferred because invoices didn't exist yet)
alter table bookings
  add constraint bookings_invoice_fk
  foreign key (invoice_id) references invoices(id);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. CLAIMS, NOTIFICATIONS, AUDIT LOGS
-- ═══════════════════════════════════════════════════════════════════════════════

create table hotel_claims (
  id                  uuid primary key default gen_random_uuid(),
  claimant_profile_id uuid not null references profiles(id),
  seeded_hotel_id     uuid not null references hotels(id),
  status              claim_status not null default 'pending',
  decided_by          uuid references profiles(id),
  decided_at          timestamptz,
  created_at          timestamptz not null default now(),
  unique (claimant_profile_id, seeded_hotel_id)
);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  data       jsonb not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references profiles(id),
  action      text not null,
  target_type text,
  target_id   text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

create index idx_bookings_agency        on bookings (agency_id, created_at desc);
create index idx_bookings_hotel_status  on bookings (hotel_id, status);
create index idx_bookings_hotel_deadline on bookings (status, hotel_deadline);
create index idx_bookings_pay_deadline  on bookings (status, payment_deadline);
create index idx_bookings_checkout      on bookings (status, check_out);
create index idx_bookings_uninvoiced    on bookings (invoice_id) where invoice_id is null;
create index idx_rooms_hotel_active     on room_types (hotel_id) where is_active;
create index idx_hotels_wilaya_active   on hotels (wilaya_code) where is_active;
create index idx_hotels_name_trgm       on hotels using gin (name gin_trgm_ops);
create index idx_notif_user_created     on notifications (user_id, created_at desc);
create index idx_notif_unread           on notifications (user_id) where read_at is null;
create index idx_docs_profile           on business_documents (profile_id);
create index idx_profiles_legal_trgm    on profiles using gin (legal_name gin_trgm_ops);


-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. TRIGGERS (updated_at + profile protection)
-- ═══════════════════════════════════════════════════════════════════════════════

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_updated_hotels     before update on hotels     for each row execute function set_updated_at();
create trigger trg_updated_room_types before update on room_types for each row execute function set_updated_at();
create trigger trg_updated_bookings   before update on bookings   for each row execute function set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. HELPER FUNCTIONS (used by RLS policies and RPCs)
-- ═══════════════════════════════════════════════════════════════════════════════

create or replace function is_admin()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'super_admin' and status = 'approved'
  )
$$;

create or replace function is_approved()
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and status = 'approved'
  )
$$;

create or replace function owns_hotel(h uuid)
returns boolean language sql stable security definer
set search_path = public as $$
  select exists (
    select 1 from hotels
    where id = h and owner_profile_id = auth.uid()
  )
$$;

-- Protect profile columns: non-admins cannot change role/status/review fields
create or replace function protect_profile_columns()
returns trigger language plpgsql security definer
set search_path = public as $$
begin
  if not is_admin() then
    new.role             := old.role;
    new.status           := old.status;
    new.reviewed_by      := old.reviewed_by;
    new.reviewed_at      := old.reviewed_at;
    new.rejection_reason := old.rejection_reason;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger trg_protect_profile
  before update on profiles
  for each row execute function protect_profile_columns();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. ROW LEVEL SECURITY — every table
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on ALL tables
alter table profiles           enable row level security;
alter table business_documents enable row level security;
alter table hotels             enable row level security;
alter table hotel_photos       enable row level security;
alter table hotel_amenities    enable row level security;
alter table room_types         enable row level security;
alter table bookings           enable row level security;
alter table payments           enable row level security;
alter table invoices           enable row level security;
alter table invoice_items      enable row level security;
alter table hotel_claims       enable row level security;
alter table notifications      enable row level security;
alter table audit_logs         enable row level security;
alter table wilayas            enable row level security;
alter table amenities          enable row level security;
alter table platform_settings  enable row level security;

-- ── Reference data: any authenticated user can read ─────────────────────────
create policy "wilayas_read"   on wilayas            for select to authenticated using (true);
create policy "amenities_read" on amenities           for select to authenticated using (true);
create policy "settings_read"  on platform_settings   for select to authenticated using (true);
create policy "settings_admin" on platform_settings   for all    to authenticated
  using (is_admin()) with check (is_admin());

-- ── profiles ────────────────────────────────────────────────────────────────
create policy "profiles_read" on profiles for select to authenticated
  using (id = auth.uid() or is_admin());

create policy "profiles_update" on profiles for update to authenticated
  using (id = auth.uid() or is_admin());
  -- Note: the protect_profile_columns trigger blocks non-admin changes to protected cols
  -- Insert: done by service role only (registration action) → no insert policy needed

-- ── business_documents ──────────────────────────────────────────────────────
create policy "docs_insert" on business_documents for insert to authenticated
  with check (profile_id = auth.uid());

create policy "docs_read" on business_documents for select to authenticated
  using (profile_id = auth.uid() or is_admin());

-- ── hotels ──────────────────────────────────────────────────────────────────
create policy "hotels_read" on hotels for select to authenticated using (
  is_admin()
  or owner_profile_id = auth.uid()
  or (is_active and is_approved())
);

create policy "hotels_insert" on hotels for insert to authenticated with check (
  owner_profile_id = auth.uid()
  and not is_seeded
  and exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'hotel' and p.status = 'approved'
  )
);

create policy "hotels_update" on hotels for update to authenticated
  using (owner_profile_id = auth.uid() or is_admin());

-- ── hotel_photos ────────────────────────────────────────────────────────────
create policy "photos_read" on hotel_photos for select to authenticated using (
  exists (
    select 1 from hotels h where h.id = hotel_id
    and (is_admin() or h.owner_profile_id = auth.uid() or (h.is_active and is_approved()))
  )
);
create policy "photos_insert" on hotel_photos for insert to authenticated
  with check (owns_hotel(hotel_id));
create policy "photos_update" on hotel_photos for update to authenticated
  using (owns_hotel(hotel_id));
create policy "photos_delete" on hotel_photos for delete to authenticated
  using (owns_hotel(hotel_id));

-- ── hotel_amenities ─────────────────────────────────────────────────────────
create policy "hamenities_read" on hotel_amenities for select to authenticated using (
  exists (
    select 1 from hotels h where h.id = hotel_id
    and (is_admin() or h.owner_profile_id = auth.uid() or (h.is_active and is_approved()))
  )
);
create policy "hamenities_insert" on hotel_amenities for insert to authenticated
  with check (owns_hotel(hotel_id));
create policy "hamenities_delete" on hotel_amenities for delete to authenticated
  using (owns_hotel(hotel_id));

-- ── room_types ──────────────────────────────────────────────────────────────
create policy "rooms_read" on room_types for select to authenticated using (
  exists (
    select 1 from hotels h where h.id = hotel_id
    and (is_admin() or h.owner_profile_id = auth.uid() or (h.is_active and is_approved()))
  )
);
create policy "rooms_insert" on room_types for insert to authenticated
  with check (owns_hotel(hotel_id));
create policy "rooms_update" on room_types for update to authenticated
  using (owns_hotel(hotel_id));
create policy "rooms_delete" on room_types for delete to authenticated
  using (owns_hotel(hotel_id));

-- ── bookings: read own side; ALL writes happen via security-definer RPCs ────
create policy "bookings_read" on bookings for select to authenticated using (
  agency_id = auth.uid() or owns_hotel(hotel_id) or is_admin()
);
-- No insert/update/delete policies → only RPCs (definer) and service role can write

-- ── payments ────────────────────────────────────────────────────────────────
create policy "payments_read" on payments for select to authenticated using (
  is_admin()
  or exists (
    select 1 from bookings b where b.id = booking_id
    and (b.agency_id = auth.uid() or owns_hotel(b.hotel_id))
  )
);

-- ── invoices / invoice_items ────────────────────────────────────────────────
create policy "invoices_read" on invoices for select to authenticated
  using (owns_hotel(hotel_id) or is_admin());

create policy "inv_items_read" on invoice_items for select to authenticated using (
  exists (
    select 1 from invoices i where i.id = invoice_id
    and (owns_hotel(i.hotel_id) or is_admin())
  )
);

-- ── hotel_claims ────────────────────────────────────────────────────────────
create policy "claims_insert" on hotel_claims for insert to authenticated with check (
  claimant_profile_id = auth.uid()
  and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'hotel' and p.status = 'approved')
  and exists (select 1 from hotels s where s.id = seeded_hotel_id and s.is_seeded and s.is_active)
);
create policy "claims_read" on hotel_claims for select to authenticated
  using (claimant_profile_id = auth.uid() or is_admin());

-- ── notifications ───────────────────────────────────────────────────────────
create policy "notif_read"   on notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notif_update" on notifications for update to authenticated
  using (user_id = auth.uid());  -- mark as read

-- ── audit_logs ──────────────────────────────────────────────────────────────
create policy "audit_read" on audit_logs for select to authenticated
  using (is_admin());


-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public) values
  ('verification-docs', 'verification-docs', false),
  ('hotel-media',       'hotel-media',       true),
  ('vouchers',          'vouchers',          false),
  ('invoices',          'invoices',          false),
  ('brand',             'brand',             true)
on conflict do nothing;

-- verification-docs: owner uploads into their own folder, owner + admin can read
create policy "vdocs_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "vdocs_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'verification-docs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

-- hotel-media: hotel owner manages their folder; public reads via URL
create policy "hmedia_upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'hotel-media'
    and owns_hotel(((storage.foldername(name))[1])::uuid)
  );

create policy "hmedia_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'hotel-media'
    and owns_hotel(((storage.foldername(name))[1])::uuid)
  );

-- vouchers and invoices: written by service role only, read via signed URLs only
-- → no object-level policies needed (service role bypasses RLS)


-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. RPC FUNCTIONS — all business logic / state transitions
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Tiny helpers ─────────────────────────────────────────────────────────────

create or replace function push_notification(p_user uuid, p_type text, p_data jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, type, data) values (p_user, p_type, p_data)
$$;

create or replace function notify_admins(p_type text, p_data jsonb)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, type, data)
  select id, p_type, p_data from profiles
  where role = 'super_admin' and status = 'approved'
$$;

create or replace function setting_numeric(p_key text, p_default numeric)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(
    (select (value #>> '{}')::numeric from platform_settings where key = p_key),
    p_default
  )
$$;


-- ── RPC 1: Agency creates an OFFLINE booking request ─────────────────────────
-- No stock decrement yet — hotel must [Agree] first.

create or replace function create_offline_booking(
  p_hotel     uuid,
  p_room_type uuid,
  p_check_in  date,
  p_check_out date,
  p_rooms     int
) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  v_agency profiles;
  v_room   room_types;
  v_hotel  hotels;
  v_total  numeric(12,2);
  v_b      bookings;
begin
  -- Caller must be an approved agency
  select * into v_agency from profiles
  where id = auth.uid() and role = 'agency' and status = 'approved';
  if not found then raise exception 'AGENCY_ONLY'; end if;

  -- Room must exist and be active
  select * into v_room from room_types
  where id = p_room_type and is_active;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;

  -- Hotel must be a bookable registered partner (not seeded)
  select * into v_hotel from hotels
  where id = p_hotel
    and id = v_room.hotel_id
    and is_active
    and not is_seeded
    and owner_profile_id is not null;
  if not found then raise exception 'HOTEL_NOT_BOOKABLE'; end if;

  -- Date validation
  if p_check_in < current_date + (setting_numeric('min_checkin_notice_days', 1))::int then
    raise exception 'CHECKIN_TOO_SOON';
  end if;
  if p_check_out <= p_check_in then
    raise exception 'INVALID_DATES';
  end if;

  -- Rooms count validation
  if p_rooms < 1 or p_rooms > setting_numeric('max_rooms_per_request', 20)::int then
    raise exception 'ROOMS_COUNT_INVALID';
  end if;

  -- Availability check (soft — hotel will verify at [Agree] time)
  if v_room.available_count < p_rooms then
    raise exception 'INSUFFICIENT_AVAILABILITY';
  end if;

  -- Server-computed total — NEVER trust client
  v_total := round(v_room.b2b_rate * (p_check_out - p_check_in) * p_rooms, 2);

  -- Insert booking
  insert into bookings (
    agency_id, hotel_id, room_type_id, room_name_snapshot,
    nightly_rate_snapshot, rooms_count, check_in, check_out,
    total_price, commission_rate, payment_method, status, hotel_deadline
  ) values (
    v_agency.id, v_hotel.id, v_room.id, v_room.name,
    v_room.b2b_rate, p_rooms, p_check_in, p_check_out,
    v_total, setting_numeric('commission_rate', 5.00),
    'offline', 'pending_hotel',
    now() + interval '24 hours'
  ) returning * into v_b;

  -- Notify the hotel
  perform push_notification(
    v_hotel.owner_profile_id,
    'booking_request',
    jsonb_build_object(
      'booking_id', v_b.id,
      'reference', v_b.reference,
      'agency', v_agency.legal_name,
      'total', v_total,
      'deadline', v_b.hotel_deadline
    )
  );

  return v_b;
end $$;


-- ── RPC 2: Agency starts an ONLINE booking (creates payment row) ─────────────
-- The app then creates the Chargily checkout and stores checkout_id.

create or replace function create_online_booking(
  p_hotel     uuid,
  p_room_type uuid,
  p_check_in  date,
  p_check_out date,
  p_rooms     int,
  p_method    payment_method
) returns table (booking_id uuid, payment_id uuid, amount numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_b bookings;
begin
  if p_method not in ('cib', 'edahabia') then
    raise exception 'METHOD_INVALID';
  end if;

  -- Reuse the offline function for all validation + insert
  v_b := create_offline_booking(p_hotel, p_room_type, p_check_in, p_check_out, p_rooms);

  -- Override to online status
  update bookings
  set payment_method = p_method,
      status = 'pending_payment',
      hotel_deadline = null,
      updated_at = now()
  where id = v_b.id
  returning * into v_b;

  -- Remove the hotel notification (online doesn't need hotel decision)
  delete from notifications
  where (data->>'booking_id')::uuid = v_b.id
    and type = 'booking_request';

  -- Create payment record
  insert into payments (booking_id, method, amount)
  values (v_b.id, p_method, v_b.total_price);

  return query
    select v_b.id, p.id, v_b.total_price
    from payments p where p.booking_id = v_b.id;
end $$;


-- ── RPC 3: Confirm online payment (called by webhook — IDEMPOTENT) ───────────
-- Handles the sold-out race: if rooms gone → refund_required, booking cancelled.

create or replace function confirm_online_payment(p_checkout_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_p     payments;
  v_b     bookings;
  v_room  room_types;
  v_owner uuid;
begin
  select * into v_p from payments where checkout_id = p_checkout_id for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;

  -- Idempotency: already processed → do nothing
  if v_p.status = 'paid' then return; end if;

  select * into v_b from bookings where id = v_p.booking_id for update;
  select owner_profile_id into v_owner from hotels where id = v_b.hotel_id;
  select * into v_room from room_types where id = v_b.room_type_id for update;

  -- Sold-out race check
  if v_b.status <> 'pending_payment' or v_room.available_count < v_b.rooms_count then
    update payments set status = 'refund_required', paid_at = now() where id = v_p.id;
    update bookings set status = 'cancelled',
           rejection_reason = 'SOLD_OUT_AFTER_PAYMENT', updated_at = now()
    where id = v_b.id;

    perform push_notification(v_b.agency_id, 'refund_required',
      jsonb_build_object('booking_id', v_b.id, 'reference', v_b.reference));
    perform notify_admins('refund_required',
      jsonb_build_object('booking_id', v_b.id, 'reference', v_b.reference, 'amount', v_p.amount));
    return;
  end if;

  -- Happy path: decrement stock immediately (per spec)
  update room_types
  set available_count = available_count - v_b.rooms_count
  where id = v_room.id;

  -- Confirm payment + booking
  update payments set status = 'paid', paid_at = now() where id = v_p.id;
  update bookings set status = 'confirmed',
         confirmed_at = now(),
         commission_amount = round(total_price * commission_rate / 100, 2),
         updated_at = now()
  where id = v_b.id;

  -- Notify both sides
  perform push_notification(v_b.agency_id, 'online_confirmed',
    jsonb_build_object('booking_id', v_b.id, 'reference', v_b.reference));
  perform push_notification(v_owner, 'online_confirmed',
    jsonb_build_object('booking_id', v_b.id, 'reference', v_b.reference, 'total', v_b.total_price));
end $$;


-- ── RPC 4: Hotel decides an offline request ──────────────────────────────────
-- [Agree] → hold stock + set payment countdown
-- [Refuse] → rejected + reason (required)

create or replace function hotel_decide_booking(
  p_booking uuid,
  p_approve boolean,
  p_reason  text default null
) returns bookings
language plpgsql security definer set search_path = public as $$
declare
  v_b      bookings;
  v_room   room_types;
  v_window int;
begin
  select b.* into v_b
  from bookings b
  join hotels h on h.id = b.hotel_id
  where b.id = p_booking and h.owner_profile_id = auth.uid()
  for update of b;

  if not found then raise exception 'NOT_FOUND'; end if;
  if v_b.status <> 'pending_hotel' then raise exception 'INVALID_STATE'; end if;
  if now() > v_b.hotel_deadline then raise exception 'DEADLINE_PASSED'; end if;

  -- ── REFUSE ──
  if not p_approve then
    if coalesce(length(trim(p_reason)), 0) < 3 then
      raise exception 'REASON_REQUIRED';
    end if;

    update bookings
    set status = 'rejected', rejection_reason = p_reason, updated_at = now()
    where id = v_b.id returning * into v_b;

    perform push_notification(v_b.agency_id, 'booking_rejected',
      jsonb_build_object('booking_id', v_b.id, 'reference', v_b.reference, 'reason', p_reason));
    return v_b;
  end if;

  -- ── AGREE ──
  select * into v_room from room_types where id = v_b.room_type_id for update;

  if v_room.available_count < v_b.rooms_count then
    raise exception 'INSUFFICIENT_AVAILABILITY';
  end if;

  -- Hold stock
  update room_types
  set available_count = available_count - v_b.rooms_count
  where id = v_room.id;

  -- Set payment deadline
  select offline_payment_window_hours into v_window
  from hotels where id = v_b.hotel_id;

  update bookings
  set status = 'awaiting_offline_payment',
      payment_deadline = now() + make_interval(hours => v_window),
      updated_at = now()
  where id = v_b.id returning * into v_b;

  perform push_notification(v_b.agency_id, 'payment_window_started',
    jsonb_build_object(
      'booking_id', v_b.id,
      'reference', v_b.reference,
      'deadline', v_b.payment_deadline,
      'total', v_b.total_price
    ));
  return v_b;
end $$;


-- ── RPC 5: Hotel confirms external payment received ──────────────────────────

create or replace function hotel_mark_received(p_booking uuid)
returns bookings language plpgsql security definer set search_path = public as $$
declare v_b bookings;
begin
  select b.* into v_b
  from bookings b
  join hotels h on h.id = b.hotel_id
  where b.id = p_booking and h.owner_profile_id = auth.uid()
  for update of b;

  if not found then raise exception 'NOT_FOUND'; end if;
  if v_b.status <> 'awaiting_offline_payment' then raise exception 'INVALID_STATE'; end if;

  update bookings
  set status = 'confirmed',
      confirmed_at = now(),
      received_confirmed_at = now(),
      commission_amount = round(total_price * commission_rate / 100, 2),
      updated_at = now()
  where id = v_b.id returning * into v_b;

  perform push_notification(v_b.agency_id, 'payment_received',
    jsonb_build_object('booking_id', v_b.id, 'reference', v_b.reference));
  return v_b;
end $$;


-- ── RPC 6: Expire overdue bookings (called by cron every 10 min) ─────────────
-- Handles: 24h hotel deadline, offline payment window, and abandoned online checkouts.
-- Restores held stock when awaiting_offline_payment expires.

create or replace function expire_due_bookings()
returns int language plpgsql security definer set search_path = public as $$
declare
  r       record;
  v_count int := 0;
begin
  for r in
    select b.*, h.owner_profile_id
    from bookings b
    join hotels h on h.id = b.hotel_id
    where
      (b.status = 'pending_hotel'            and b.hotel_deadline   < now())
      or (b.status = 'awaiting_offline_payment' and b.payment_deadline < now())
      or (b.status = 'pending_payment'          and b.created_at < now() - interval '2 hours')
    for update of b
  loop
    -- Restore held stock if hotel had already agreed
    if r.status = 'awaiting_offline_payment' then
      update room_types
      set available_count = least(total_capacity, available_count + r.rooms_count)
      where id = r.room_type_id;
    end if;

    -- Set final status
    update bookings
    set status = case
          when r.status = 'pending_payment' then 'cancelled'::booking_status
          else 'expired'::booking_status
        end,
        updated_at = now()
    where id = r.id;

    -- Notify agency
    perform push_notification(r.agency_id, 'booking_expired',
      jsonb_build_object('booking_id', r.id, 'reference', r.reference, 'was', r.status));

    -- Notify hotel (not for abandoned online checkouts)
    if r.status <> 'pending_payment' then
      perform push_notification(r.owner_profile_id, 'booking_expired',
        jsonb_build_object('booking_id', r.id, 'reference', r.reference, 'was', r.status));
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;


-- ── RPC 7: Complete finished stays (cron, daily) ─────────────────────────────
-- Confirmed bookings past check-out → completed + restore stock counter.

create or replace function complete_finished_stays()
returns int language plpgsql security definer set search_path = public as $$
declare
  r record;
  v int := 0;
begin
  for r in
    select * from bookings
    where status = 'confirmed' and check_out < current_date
    for update
  loop
    update room_types
    set available_count = least(total_capacity, available_count + r.rooms_count)
    where id = r.room_type_id;

    update bookings set status = 'completed', updated_at = now()
    where id = r.id;

    v := v + 1;
  end loop;
  return v;
end $$;


-- ── RPC 8: Hotel adjusts room availability (guarded ±) ──────────────────────

create or replace function adjust_room_availability(p_room uuid, p_delta int)
returns room_types language plpgsql security definer set search_path = public as $$
declare v room_types;
begin
  select * into v from room_types
  where id = p_room and owns_hotel(hotel_id)
  for update;

  if not found then raise exception 'NOT_FOUND'; end if;

  if v.available_count + p_delta < 0
     or v.available_count + p_delta > v.total_capacity then
    raise exception 'AVAILABILITY_OUT_OF_RANGE';
  end if;

  update room_types
  set available_count = available_count + p_delta
  where id = p_room returning * into v;

  return v;
end $$;


-- ── RPC 9: Agency archives a rejected/expired booking (soft) ─────────────────

create or replace function archive_rejected_booking(p_booking uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update bookings
  set archived_by_agency = true, updated_at = now()
  where id = p_booking
    and agency_id = auth.uid()
    and status in ('rejected', 'expired', 'cancelled');

  if not found then raise exception 'NOT_ARCHIVABLE'; end if;
end $$;


-- ── RPC 10: Admin reviews an account (approve / reject) ─────────────────────

create or replace function admin_review_account(
  p_profile uuid,
  p_approve boolean,
  p_reason  text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'ADMIN_ONLY'; end if;

  update profiles
  set status = case
        when p_approve then 'approved'::account_status
        else 'rejected'::account_status
      end,
      rejection_reason = case
        when p_approve then null
        else coalesce(p_reason, '')
      end,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_profile and status = 'awaiting_review';

  if not found then raise exception 'NOT_REVIEWABLE'; end if;

  -- Notification
  perform push_notification(
    p_profile,
    case when p_approve then 'account_approved' else 'account_rejected' end,
    jsonb_build_object('reason', p_reason)
  );

  -- Audit trail
  insert into audit_logs(actor_id, action, target_type, target_id, meta)
  values (
    auth.uid(),
    case when p_approve then 'account.approve' else 'account.reject' end,
    'profile', p_profile::text,
    jsonb_build_object('reason', p_reason)
  );
end $$;


-- ── RPC 11: Admin decides a hotel claim (Partner Takeover) ───────────────────

create or replace function approve_hotel_claim(p_claim uuid, p_approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  v          hotel_claims;
  v_new_hotel uuid;
begin
  if not is_admin() then raise exception 'ADMIN_ONLY'; end if;

  select * into v from hotel_claims
  where id = p_claim and status = 'pending' for update;
  if not found then raise exception 'NOT_FOUND'; end if;

  update hotel_claims
  set status = case when p_approve then 'approved'::claim_status else 'rejected'::claim_status end,
      decided_by = auth.uid(),
      decided_at = now()
  where id = p_claim;

  if p_approve then
    -- Retire the seeded listing
    update hotels set is_active = false where id = v.seeded_hotel_id;
    -- Link the partner's hotel to the seeded one it replaces
    select id into v_new_hotel from hotels where owner_profile_id = v.claimant_profile_id;
    if v_new_hotel is not null then
      update hotels set replaced_seeded_id = v.seeded_hotel_id where id = v_new_hotel;
    end if;
  end if;

  perform push_notification(v.claimant_profile_id, 'claim_decided',
    jsonb_build_object('approved', p_approve, 'seeded_hotel_id', v.seeded_hotel_id));

  insert into audit_logs(actor_id, action, target_type, target_id)
  values (
    auth.uid(),
    'claim.' || case when p_approve then 'approve' else 'reject' end,
    'hotel_claim', p_claim::text
  );
end $$;


-- ── RPC 12: Generate monthly invoices (cron, 1st of each month) ─────────────

create or replace function generate_monthly_invoices(p_year int, p_month int)
returns int language plpgsql security definer set search_path = public as $$
declare
  h       record;
  v_inv   uuid;
  v_due   date;
  v_count int := 0;
begin
  -- Due date = e.g. 10th of the following month
  v_due := (
    make_date(p_year, p_month, 1)
    + interval '1 month'
    + make_interval(days => setting_numeric('invoice_due_day', 10)::int - 1)
  )::date;

  for h in
    select b.hotel_id,
           sum(b.total_price)      as total,
           sum(b.commission_amount) as comm
    from bookings b
    where b.status in ('confirmed', 'completed')
      and b.invoice_id is null
      and date_trunc('month', b.confirmed_at) = make_date(p_year, p_month, 1)
    group by b.hotel_id
  loop
    insert into invoices (
      hotel_id, period_year, period_month,
      bookings_total, commission_due, due_date
    ) values (
      h.hotel_id, p_year, p_month,
      h.total, h.comm, v_due
    )
    on conflict (hotel_id, period_year, period_month) do nothing
    returning id into v_inv;

    -- Skip if invoice already existed (idempotent)
    if v_inv is null then continue; end if;

    -- Attach booking items
    insert into invoice_items (invoice_id, booking_id, amount, commission)
    select v_inv, b.id, b.total_price, b.commission_amount
    from bookings b
    where b.hotel_id = h.hotel_id
      and b.status in ('confirmed', 'completed')
      and b.invoice_id is null
      and date_trunc('month', b.confirmed_at) = make_date(p_year, p_month, 1);

    -- Link bookings to this invoice
    update bookings set invoice_id = v_inv
    where id in (select booking_id from invoice_items where invoice_id = v_inv);

    -- Notify hotel
    perform push_notification(
      (select owner_profile_id from hotels where id = h.hotel_id),
      'invoice_issued',
      jsonb_build_object(
        'invoice_id', v_inv,
        'period', p_year || '-' || p_month,
        'commission_due', h.comm,
        'due_date', v_due
      )
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

-- Lock down: only authenticated users can call these
revoke execute on all functions in schema public from anon;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 15. VIEWS (analytics + admin)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Hotel analytics — uses security_invoker so RLS on bookings still applies
create or replace view hotel_analytics with (security_invoker = on) as
select
  hotel_id,
  date_trunc('month', confirmed_at)::date as month,
  count(*)                                as bookings,
  sum(total_price)                        as revenue,
  sum(commission_amount)                  as commission,
  sum(rooms_count * nights)               as room_nights
from bookings
where status in ('confirmed', 'completed')
group by 1, 2;

-- Admin: user overview with Gmail verification badge + signup timestamp
create or replace function admin_user_overview()
returns table (
  id              uuid,
  role            user_role,
  status          account_status,
  legal_name      text,
  full_name       text,
  email           text,
  phone           text,
  wilaya_code     int,
  license_number  text,
  created_at      timestamptz,
  email_verified  boolean,
  google_linked   boolean
)
language sql stable security definer set search_path = public, auth as $$
  select
    p.id, p.role, p.status, p.legal_name, p.full_name, p.email, p.phone,
    p.wilaya_code, p.license_number, p.created_at,
    u.email_confirmed_at is not null,
    (u.raw_app_meta_data->'providers') ? 'google'
  from profiles p
  join auth.users u on u.id = p.id
  where is_admin()
$$;

-- Admin: platform-wide statistics
create or replace function admin_platform_stats()
returns table (
  agencies  bigint,
  hotels    bigint,
  tx_count  bigint,
  tx_volume numeric
)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from profiles where role = 'agency'  and status = 'approved'),
    (select count(*) from profiles where role = 'hotel'   and status = 'approved'),
    (select count(*) from bookings where status in ('confirmed', 'completed')),
    coalesce((select sum(total_price) from bookings where status in ('confirmed', 'completed')), 0)
  where is_admin()
$$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 16. SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Platform settings
insert into platform_settings (key, value) values
  ('commission_rate',              '"5.00"'),
  ('invoice_due_day',             '"10"'),
  ('review_sla_hours',            '"24"'),
  ('default_payment_window_hours','"48"'),
  ('max_rooms_per_request',       '"20"'),
  ('min_checkin_notice_days',     '"1"')
on conflict do nothing;

-- Amenities (lucide icon names)
insert into amenities (key, lucide_icon, label) values
  ('wifi',          'Wifi',              '{"ar":"واي فاي مجاني","fr":"Wi-Fi gratuit","en":"Free Wi-Fi"}'),
  ('pool',          'Waves',             '{"ar":"مسبح","fr":"Piscine","en":"Pool"}'),
  ('gym',           'Dumbbell',          '{"ar":"قاعة رياضة","fr":"Salle de sport","en":"Gym"}'),
  ('restaurant',    'UtensilsCrossed',   '{"ar":"مطعم","fr":"Restaurant","en":"Restaurant"}'),
  ('parking',       'SquareParking',     '{"ar":"موقف سيارات","fr":"Parking","en":"Parking"}'),
  ('meeting_rooms', 'Presentation',      '{"ar":"قاعات اجتماعات","fr":"Salles de réunion","en":"Meeting rooms"}'),
  ('spa',           'Sparkles',          '{"ar":"سبا","fr":"Spa","en":"Spa"}'),
  ('ac',            'AirVent',           '{"ar":"تكييف","fr":"Climatisation","en":"Air conditioning"}'),
  ('beach',         'TreePalm',          '{"ar":"شاطئ","fr":"Plage","en":"Beach access"}'),
  ('shuttle',       'Bus',               '{"ar":"نقل المطار","fr":"Navette aéroport","en":"Airport shuttle"}')
on conflict do nothing;

-- All 58 wilayas of Algeria
insert into wilayas (code, name_fr, name_ar, name_en, lat, lng) values
  ( 1, 'Adrar',            'أدرار',            'Adrar',             27.8742,  -0.2939),
  ( 2, 'Chlef',            'الشلف',            'Chlef',             36.1654,   1.3340),
  ( 3, 'Laghouat',         'الأغواط',          'Laghouat',          33.8000,   2.8650),
  ( 4, 'Oum El Bouaghi',   'أم البواقي',       'Oum El Bouaghi',    35.8756,   7.1131),
  ( 5, 'Batna',            'باتنة',            'Batna',             35.5560,   6.1742),
  ( 6, 'Béjaïa',           'بجاية',            'Béjaïa',            36.7509,   5.0567),
  ( 7, 'Biskra',           'بسكرة',            'Biskra',            34.8484,   5.7268),
  ( 8, 'Béchar',           'بشار',             'Béchar',            31.6200,  -2.2200),
  ( 9, 'Blida',            'البليدة',          'Blida',             36.4700,   2.8300),
  (10, 'Bouira',           'البويرة',          'Bouira',            36.3694,   3.9028),
  (11, 'Tamanrasset',      'تمنراست',          'Tamanrasset',       22.7903,   5.5228),
  (12, 'Tébessa',          'تبسة',             'Tébessa',           35.4008,   8.1200),
  (13, 'Tlemcen',          'تلمسان',           'Tlemcen',           34.8828,  -1.3167),
  (14, 'Tiaret',           'تيارت',            'Tiaret',            35.3711,   1.3178),
  (15, 'Tizi Ouzou',       'تيزي وزو',        'Tizi Ouzou',        36.7169,   4.0497),
  (16, 'Alger',            'الجزائر',          'Algiers',           36.7538,   3.0588),
  (17, 'Djelfa',           'الجلفة',           'Djelfa',            34.6704,   3.2503),
  (18, 'Jijel',            'جيجل',             'Jijel',             36.8210,   5.7664),
  (19, 'Sétif',            'سطيف',             'Sétif',             36.1905,   5.4078),
  (20, 'Saïda',            'سعيدة',            'Saïda',             34.8415,   0.1456),
  (21, 'Skikda',           'سكيكدة',           'Skikda',            36.8667,   6.9000),
  (22, 'Sidi Bel Abbès',   'سيدي بلعباس',     'Sidi Bel Abbès',    35.1897,  -0.6308),
  (23, 'Annaba',           'عنابة',            'Annaba',            36.9000,   7.7667),
  (24, 'Guelma',           'قالمة',            'Guelma',            36.4622,   7.4256),
  (25, 'Constantine',      'قسنطينة',          'Constantine',       36.3650,   6.6147),
  (26, 'Médéa',            'المدية',           'Médéa',             36.2675,   2.7542),
  (27, 'Mostaganem',       'مستغانم',          'Mostaganem',        35.9311,   0.0892),
  (28, 'M''Sila',          'المسيلة',          'M''Sila',           35.7050,   4.5422),
  (29, 'Mascara',          'معسكر',            'Mascara',           35.3953,   0.1403),
  (30, 'Ouargla',          'ورقلة',            'Ouargla',           31.9497,   5.3300),
  (31, 'Oran',             'وهران',            'Oran',              35.6971,  -0.6308),
  (32, 'El Bayadh',        'البيض',            'El Bayadh',         33.6833,   1.0167),
  (33, 'Illizi',           'إليزي',            'Illizi',            26.5000,   8.4833),
  (34, 'Bordj Bou Arréridj','برج بوعريريج',   'Bordj Bou Arréridj',36.0686,   4.7631),
  (35, 'Boumerdès',        'بومرداس',          'Boumerdès',         36.7525,   3.4736),
  (36, 'El Tarf',          'الطارف',           'El Tarf',           36.7672,   8.3136),
  (37, 'Tindouf',          'تندوف',            'Tindouf',           27.6744,  -8.1478),
  (38, 'Tissemsilt',       'تيسمسيلت',         'Tissemsilt',        35.6072,   1.8103),
  (39, 'El Oued',          'الوادي',           'El Oued',           33.3683,   6.8675),
  (40, 'Khenchela',        'خنشلة',            'Khenchela',         35.4264,   7.1411),
  (41, 'Souk Ahras',       'سوق أهراس',       'Souk Ahras',        36.2861,   7.9511),
  (42, 'Tipaza',           'تيبازة',           'Tipaza',            36.5897,   2.4483),
  (43, 'Mila',             'ميلة',             'Mila',              36.4503,   6.2644),
  (44, 'Aïn Defla',        'عين الدفلى',       'Aïn Defla',         36.2641,   1.9679),
  (45, 'Naama',            'النعامة',          'Naama',             33.2667,  -0.3167),
  (46, 'Aïn Témouchent',   'عين تموشنت',      'Aïn Témouchent',    35.2972,  -1.1403),
  (47, 'Ghardaïa',         'غرداية',           'Ghardaïa',          32.4900,   3.6700),
  (48, 'Relizane',         'غليزان',           'Relizane',          35.7375,   0.5564),
  (49, 'El M''Ghair',      'المغير',           'El M''Ghair',       33.9500,   5.9167),
  (50, 'El Meniaa',        'المنيعة',          'El Meniaa',         32.2833,   3.5000),
  (51, 'Ouled Djellal',    'أولاد جلال',       'Ouled Djellal',     34.4167,   5.0667),
  (52, 'Bordj Badji Mokhtar','برج باجي مختار', 'Bordj Badji Mokhtar',21.3250,  0.9500),
  (53, 'Béni Abbès',       'بني عباس',         'Béni Abbès',        30.1331,  -2.1667),
  (54, 'Timimoun',         'تيميمون',          'Timimoun',          29.2639,   0.2303),
  (55, 'Touggourt',        'تقرت',             'Touggourt',         33.1000,   6.0667),
  (56, 'Djanet',           'جانت',             'Djanet',            24.5544,   9.4847),
  (57, 'In Salah',         'عين صالح',         'In Salah',          27.1939,   2.4675),
  (58, 'In Guezzam',       'عين قزام',         'In Guezzam',        19.5667,   5.7667)
on conflict do nothing;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 17. ENABLE REALTIME (for notifications and bookings live updates)
-- ═══════════════════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table bookings;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ✅ DONE
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- NEXT STEP: Create your first Super Admin user.
--
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
--    Email: your-admin@email.com   Password: (strong)   ✅ Auto Confirm
--
-- 2. Copy the UUID that Supabase generates for that user.
--
-- 3. If this user does NOT already exist in profiles, run this
--    (replace the UUID and your details):
--
--    INSERT INTO profiles (id, role, status, full_name, legal_name, email, phone)
--    VALUES (
--      'PASTE-THE-UUID-HERE',
--      'super_admin',
--      'approved',
--      'Benamer Abdou-Rahmane',
--      'TRAVEX',
--      'your-admin@email.com',
--      '+213XXXXXXXXX'
--    );
--
--    If the user already exists in profiles as awaiting_review, temporarily
--    disable the protection trigger while bootstrapping the first admin:
--
--    ALTER TABLE profiles DISABLE TRIGGER trg_protect_profile;
--
--    UPDATE profiles
--    SET role = 'super_admin',
--        status = 'approved',
--        full_name = 'Benamer Abdou-Rahmane',
--        legal_name = 'TRAVEX',
--        email = 'your-admin@email.com',
--        phone = '+213XXXXXXXXX',
--        rejection_reason = NULL,
--        reviewed_by = NULL,
--        reviewed_at = now()
--    WHERE id = 'PASTE-THE-UUID-HERE';
--
--    ALTER TABLE profiles ENABLE TRIGGER trg_protect_profile;
--
-- That's it. Your database is fully set up.
