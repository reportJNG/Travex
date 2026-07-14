-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ TRAVEX — AUDITED DATA-ONLY POSTGRESQL / SUPABASE SEED                      ║
-- ║ Version: 2026-07-14-v3                                                     ║
-- ║ Run after db.sql. This file DOES NOT create or alter application tables.   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝
--
-- Demo password for all accounts: TravexDemo123!
-- The bcrypt hash was verified against that password and uses no pgcrypto calls.
-- Optional newer columns are populated only when they exist.

begin;
set local search_path = public, auth;

-- 0. PREFLIGHT: required tables
DO $do$
DECLARE missing_tables text;
BEGIN
  SELECT string_agg(x.table_name, ', ' ORDER BY x.table_name)
    INTO missing_tables
  FROM (VALUES
    ('profiles'), ('business_documents'), ('countries'), ('wilayas'),
    ('amenities'), ('platform_settings'), ('hotels'), ('hotel_photos'),
    ('hotel_amenities'), ('room_types'), ('bookings'), ('payments'),
    ('invoices'), ('invoice_items'), ('hotel_claims'), ('notifications'),
    ('audit_logs')
  ) AS x(table_name)
  WHERE to_regclass('public.' || x.table_name) IS NULL;

  IF missing_tables IS NOT NULL THEN
    RAISE EXCEPTION 'TRAVEX seed stopped. Missing public tables: %', missing_tables;
  END IF;

  IF to_regclass('auth.users') IS NULL OR to_regclass('auth.identities') IS NULL THEN
    RAISE EXCEPTION 'TRAVEX seed stopped. Supabase auth tables are missing.';
  END IF;
END $do$;

-- 1. REFERENCE DATA
insert into public.countries
  (code, iso3, name_fr, name_ar, name_en, currency_code, phone_prefix, default_locale, is_active)
values
  ('DZ', 'DZA', 'Algérie', 'الجزائر', 'Algeria', 'DZD', '+213', 'fr', true)
on conflict (code) do update set
  iso3 = excluded.iso3,
  name_fr = excluded.name_fr,
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  currency_code = excluded.currency_code,
  phone_prefix = excluded.phone_prefix,
  default_locale = excluded.default_locale,
  is_active = excluded.is_active;

insert into public.wilayas (code, name_fr, name_ar, name_en, lat, lng)
values
  (6, 'Béjaïa', 'بجاية', 'Bejaia', 36.7517, 5.0556),
  (9, 'Blida', 'البليدة', 'Blida', 36.47, 2.8333),
  (11, 'Tamanrasset', 'تمنراست', 'Tamanrasset', 22.785, 5.5228),
  (16, 'Alger', 'الجزائر', 'Algiers', 36.7538, 3.0588),
  (23, 'Annaba', 'عنابة', 'Annaba', 36.9, 7.7667),
  (25, 'Constantine', 'قسنطينة', 'Constantine', 36.365, 6.6147),
  (31, 'Oran', 'وهران', 'Oran', 35.6971, -0.6308),
  (42, 'Tipaza', 'تيبازة', 'Tipaza', 36.5833, 2.45)
on conflict (code) do update set
  name_fr = excluded.name_fr, name_ar = excluded.name_ar, name_en = excluded.name_en,
  lat = excluded.lat, lng = excluded.lng;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wilayas' AND column_name='country_code') THEN
    EXECUTE $$UPDATE public.wilayas SET country_code = 'DZ' WHERE code IN (6,9,11,16,23,25,31,42)$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wilayas' AND column_name='region_type') THEN
    EXECUTE $$UPDATE public.wilayas SET region_type = 'wilaya' WHERE code IN (6,9,11,16,23,25,31,42)$$;
  END IF;
END $do$;

insert into public.amenities (key, lucide_icon, label)
values
  ('wifi', 'Wifi', '{"ar":"واي فاي مجاني","fr":"Wi-Fi gratuit","en":"Free Wi-Fi"}'),
  ('pool', 'Waves', '{"ar":"مسبح","fr":"Piscine","en":"Pool"}'),
  ('gym', 'Dumbbell', '{"ar":"قاعة رياضة","fr":"Salle de sport","en":"Gym"}'),
  ('restaurant', 'UtensilsCrossed', '{"ar":"مطعم","fr":"Restaurant","en":"Restaurant"}'),
  ('parking', 'SquareParking', '{"ar":"موقف سيارات","fr":"Parking","en":"Parking"}'),
  ('meeting_rooms', 'Presentation', '{"ar":"قاعات اجتماعات","fr":"Salles de réunion","en":"Meeting rooms"}'),
  ('spa', 'Sparkles', '{"ar":"سبا","fr":"Spa","en":"Spa"}'),
  ('beach', 'TreePalm', '{"ar":"شاطئ","fr":"Plage","en":"Beach access"}'),
  ('shuttle', 'Bus', '{"ar":"نقل المطار","fr":"Navette aéroport","en":"Airport shuttle"}'),
  ('ac', 'AirVent', '{"ar":"تكييف","fr":"Climatisation","en":"Air conditioning"}')
on conflict (key) do update set lucide_icon = excluded.lucide_icon, label = excluded.label;

insert into public.platform_settings (key, value)
values
  ('commission_rate', '"5.00"'),
  ('invoice_due_day', '"10"'),
  ('review_sla_hours', '"24"'),
  ('default_payment_window_hours', '"48"'),
  ('max_rooms_per_request', '"20"'),
  ('min_checkin_notice_days', '"1"')
on conflict (key) do update set value = excluded.value;

-- 2. AUTH USERS
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  v.id, 'authenticated', 'authenticated', v.email,
  '$2a$10$CvcFfhCbimU/r8BaTm7uNu/zaznuxoceVnKZrdIq44ndKqyhR/AL.',
  now(),
  jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
  jsonb_build_object('full_name',v.full_name),
  v.created_at, now(), '', '', '', ''
from (values

  ('00000000-0000-4000-8000-000000000001'::uuid, 'admin@travex.demo', 'TRAVEX Super Admin', now() - interval '180 days'),
  ('00000000-0000-4000-8000-000000000101'::uuid, 'atlas.agency@travex.demo', 'Amine Benali', now() - interval '150 days'),
  ('00000000-0000-4000-8000-000000000102'::uuid, 'sahara.voyages@travex.demo', 'Lina Mansouri', now() - interval '120 days'),
  ('00000000-0000-4000-8000-000000000103'::uuid, 'nour.travel@travex.demo', 'Nour El Houda', now() - interval '15 days'),
  ('00000000-0000-4000-8000-000000000201'::uuid, 'aurassi@travex.demo', 'Karim Bensaid', now() - interval '140 days'),
  ('00000000-0000-4000-8000-000000000202'::uuid, 'continental.oran@travex.demo', 'Samir Belkacem', now() - interval '110 days'),
  ('00000000-0000-4000-8000-000000000203'::uuid, 'cirta@travex.demo', 'Yasmine Khelifi', now() - interval '100 days'),
  ('00000000-0000-4000-8000-000000000204'::uuid, 'oasis.tamanrasset@travex.demo', 'Mehdi Aggoun', now() - interval '90 days'),
  ('00000000-0000-4000-8000-000000000205'::uuid, 'new.hotel@travex.demo', 'Sofiane Rahmani', now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000206'::uuid, 'claimant.hotel@travex.demo', 'Rania Bouzid', now() - interval '45 days')
) as v(id,email,full_name,created_at)
on conflict do nothing;

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  v.identity_id, v.user_id, v.user_id::text,
  jsonb_build_object('sub',v.user_id::text,'email',v.email,'email_verified',true,'phone_verified',false),
  'email', now(), now(), now()
from (values
  ('90000000-0000-4000-8000-000000000001'::uuid, '00000000-0000-4000-8000-000000000001'::uuid, 'admin@travex.demo'),
  ('90000000-0000-4000-8000-000000000002'::uuid, '00000000-0000-4000-8000-000000000101'::uuid, 'atlas.agency@travex.demo'),
  ('90000000-0000-4000-8000-000000000003'::uuid, '00000000-0000-4000-8000-000000000102'::uuid, 'sahara.voyages@travex.demo'),
  ('90000000-0000-4000-8000-000000000004'::uuid, '00000000-0000-4000-8000-000000000103'::uuid, 'nour.travel@travex.demo'),
  ('90000000-0000-4000-8000-000000000005'::uuid, '00000000-0000-4000-8000-000000000201'::uuid, 'aurassi@travex.demo'),
  ('90000000-0000-4000-8000-000000000006'::uuid, '00000000-0000-4000-8000-000000000202'::uuid, 'continental.oran@travex.demo'),
  ('90000000-0000-4000-8000-000000000007'::uuid, '00000000-0000-4000-8000-000000000203'::uuid, 'cirta@travex.demo'),
  ('90000000-0000-4000-8000-000000000008'::uuid, '00000000-0000-4000-8000-000000000204'::uuid, 'oasis.tamanrasset@travex.demo'),
  ('90000000-0000-4000-8000-000000000009'::uuid, '00000000-0000-4000-8000-000000000205'::uuid, 'new.hotel@travex.demo'),
  ('90000000-0000-4000-8000-000000000010'::uuid, '00000000-0000-4000-8000-000000000206'::uuid, 'claimant.hotel@travex.demo')
) as v(identity_id,user_id,email)
on conflict do nothing;

-- 3. PROFILES
-- country_code and wilaya_code are deliberately omitted here so this works on
-- both the older and current profile schema. They are filled conditionally below.
insert into public.profiles (
  id, role, status, full_name, legal_name, email, phone,
  tax_id, license_number, preferred_locale, rejection_reason,
  reviewed_by, reviewed_at, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-000000000001', 'super_admin', 'approved', 'TRAVEX Super Admin', 'TRAVEX Platform', 'admin@travex.demo', '+213550000001', 'TRAVEX-TAX-001', 'TRAVEX-ADMIN-001', 'fr', null, null, now() - interval '179 days', now() - interval '180 days', now())
on conflict do nothing;

insert into public.profiles (
  id, role, status, full_name, legal_name, email, phone,
  tax_id, license_number, preferred_locale, rejection_reason,
  reviewed_by, reviewed_at, created_at, updated_at
)
values
  ('00000000-0000-4000-8000-000000000101', 'agency', 'approved', 'Amine Benali', 'Atlas Business Travel', 'atlas.agency@travex.demo', '+213550100101', 'NIF-AG-100101', 'AG-ALGER-101', 'fr', null, '00000000-0000-4000-8000-000000000001', now() - interval '148 days', now() - interval '150 days', now()),
  ('00000000-0000-4000-8000-000000000102', 'agency', 'approved', 'Lina Mansouri', 'Sahara Voyages', 'sahara.voyages@travex.demo', '+213550100102', 'NIF-AG-100102', 'AG-ORAN-102', 'fr', null, '00000000-0000-4000-8000-000000000001', now() - interval '118 days', now() - interval '120 days', now()),
  ('00000000-0000-4000-8000-000000000103', 'agency', 'rejected', 'Nour El Houda', 'Nour Travel Services', 'nour.travel@travex.demo', '+213550100103', 'NIF-AG-100103', 'AG-BLIDA-103', 'ar', 'Le registre commercial fourni est illisible.', '00000000-0000-4000-8000-000000000001', now() - interval '12 days', now() - interval '15 days', now()),
  ('00000000-0000-4000-8000-000000000201', 'hotel', 'approved', 'Karim Bensaid', 'EPE Hôtel El Aurassi SPA', 'aurassi@travex.demo', '+213550200201', 'NIF-HT-200201', 'HT-ALGER-201', 'fr', null, '00000000-0000-4000-8000-000000000001', now() - interval '138 days', now() - interval '140 days', now()),
  ('00000000-0000-4000-8000-000000000202', 'hotel', 'approved', 'Samir Belkacem', 'SARL Hôtel Continental Oran', 'continental.oran@travex.demo', '+213550200202', 'NIF-HT-200202', 'HT-ORAN-202', 'fr', null, '00000000-0000-4000-8000-000000000001', now() - interval '108 days', now() - interval '110 days', now()),
  ('00000000-0000-4000-8000-000000000203', 'hotel', 'approved', 'Yasmine Khelifi', 'SARL Hôtel Cirta', 'cirta@travex.demo', '+213550200203', 'NIF-HT-200203', 'HT-CONSTANTINE-203', 'fr', null, '00000000-0000-4000-8000-000000000001', now() - interval '98 days', now() - interval '100 days', now()),
  ('00000000-0000-4000-8000-000000000204', 'hotel', 'approved', 'Mehdi Aggoun', 'EURL Oasis Tamanrasset', 'oasis.tamanrasset@travex.demo', '+213550200204', 'NIF-HT-200204', 'HT-TAMANRASSET-204', 'ar', null, '00000000-0000-4000-8000-000000000001', now() - interval '88 days', now() - interval '90 days', now()),
  ('00000000-0000-4000-8000-000000000205', 'hotel', 'awaiting_review', 'Sofiane Rahmani', 'EURL New Hotel Tipaza', 'new.hotel@travex.demo', '+213550200205', 'NIF-HT-200205', 'HT-TIPAZA-205', 'fr', null, null, null, now() - interval '3 days', now()),
  ('00000000-0000-4000-8000-000000000206', 'hotel', 'approved', 'Rania Bouzid', 'SARL Horizon Hospitality', 'claimant.hotel@travex.demo', '+213550200206', 'NIF-HT-200206', 'HT-ALGER-206', 'fr', null, '00000000-0000-4000-8000-000000000001', now() - interval '43 days', now() - interval '45 days', now())
on conflict do nothing;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='country_code') THEN
    EXECUTE $$UPDATE public.profiles SET country_code = 'DZ' WHERE id::text LIKE '00000000-0000-4000-8000-%'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='wilaya_code') THEN
    EXECUTE $sql$
      UPDATE public.profiles SET wilaya_code = CASE id
        WHEN '00000000-0000-4000-8000-000000000001'::uuid THEN 16
        WHEN '00000000-0000-4000-8000-000000000101'::uuid THEN 16
        WHEN '00000000-0000-4000-8000-000000000102'::uuid THEN 31
        WHEN '00000000-0000-4000-8000-000000000103'::uuid THEN 9
        WHEN '00000000-0000-4000-8000-000000000201'::uuid THEN 16
        WHEN '00000000-0000-4000-8000-000000000202'::uuid THEN 31
        WHEN '00000000-0000-4000-8000-000000000203'::uuid THEN 25
        WHEN '00000000-0000-4000-8000-000000000204'::uuid THEN 11
        WHEN '00000000-0000-4000-8000-000000000205'::uuid THEN 42
        WHEN '00000000-0000-4000-8000-000000000206'::uuid THEN 16
        ELSE wilaya_code END
      WHERE id::text LIKE '00000000-0000-4000-8000-%'
    $sql$;
  END IF;
END $do$;

-- 4. BUSINESS DOCUMENTS
insert into public.business_documents (id,profile_id,type,storage_path,original_name,uploaded_at)
values
  ('30000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000101', 'commercial_registry', '00000000-0000-4000-8000-000000000101/registre-commerce.pdf', 'registre-commerce-atlas.pdf', now() - interval '150 days'),
  ('30000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000101', 'tax_card', '00000000-0000-4000-8000-000000000101/carte-fiscale.pdf', 'carte-fiscale-atlas.pdf', now() - interval '150 days'),
  ('30000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000102', 'commercial_registry', '00000000-0000-4000-8000-000000000102/registre-commerce.pdf', 'registre-commerce-sahara.pdf', now() - interval '120 days'),
  ('30000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000102', 'tax_card', '00000000-0000-4000-8000-000000000102/carte-fiscale.pdf', 'carte-fiscale-sahara.pdf', now() - interval '120 days'),
  ('30000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000103', 'commercial_registry', '00000000-0000-4000-8000-000000000103/registre-flou.pdf', 'registre-commerce-nour.pdf', now() - interval '15 days'),
  ('30000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000201', 'commercial_registry', '00000000-0000-4000-8000-000000000201/registre-commerce.pdf', 'registre-commerce-aurassi.pdf', now() - interval '140 days'),
  ('30000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000201', 'tourism_license', '00000000-0000-4000-8000-000000000201/licence-tourisme.pdf', 'licence-tourisme-aurassi.pdf', now() - interval '140 days'),
  ('30000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000202', 'commercial_registry', '00000000-0000-4000-8000-000000000202/registre-commerce.pdf', 'registre-commerce-continental.pdf', now() - interval '110 days'),
  ('30000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000202', 'tourism_license', '00000000-0000-4000-8000-000000000202/licence-tourisme.pdf', 'licence-tourisme-continental.pdf', now() - interval '110 days'),
  ('30000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000203', 'commercial_registry', '00000000-0000-4000-8000-000000000203/registre-commerce.pdf', 'registre-commerce-cirta.pdf', now() - interval '100 days'),
  ('30000000-0000-4000-8000-000000000206', '00000000-0000-4000-8000-000000000204', 'tourism_license', '00000000-0000-4000-8000-000000000204/licence-tourisme.pdf', 'licence-tourisme-oasis.pdf', now() - interval '90 days'),
  ('30000000-0000-4000-8000-000000000207', '00000000-0000-4000-8000-000000000205', 'commercial_registry', '00000000-0000-4000-8000-000000000205/registre-commerce.pdf', 'registre-commerce-new-hotel.pdf', now() - interval '3 days'),
  ('30000000-0000-4000-8000-000000000208', '00000000-0000-4000-8000-000000000206', 'commercial_registry', '00000000-0000-4000-8000-000000000206/registre-commerce.pdf', 'registre-commerce-horizon.pdf', now() - interval '45 days')
on conflict do nothing;

-- 5. HOTELS
-- country_code and offline_payment_window_hours are omitted; current db.sql defaults them.
insert into public.hotels (
  id, owner_profile_id, is_seeded, is_active, name, description,
  wilaya_code, address, star_rating, phone, email,
  website_url, facebook_url, instagram_url, google_maps_url, google_place_id,
  lat, lng, created_at, updated_at
)
values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', false, true, 'Hotel El Aurassi', 'Luxury five-star hotel in central Algiers with panoramic Mediterranean views, restaurants, meeting spaces and spa services.', 16, '2 Boulevard Frantz Fanon, Alger Centre', 5, '+21323848484', 'reservations@elaurassi.demo', 'https://www.elaurassi.com', null, 'https://instagram.com/elaurassi.demo', null, 'travex-demo-aurassi', 36.7538, 3.0588, now() - interval '135 days', now()),
  ('10000000-0000-4000-8000-000000000002', null, true, true, 'Sofitel Algiers Hamma Garden', 'Premium hotel beside the Botanical Garden, combining business facilities, gardens, restaurants and wellness services.', 16, '172 Rue Hassiba Ben Bouali, El Hamma, Alger', 5, '+21321685100', 'contact@sofitel-algiers.demo', 'https://all.accor.com', null, null, null, 'travex-demo-sofitel-algiers', 36.7449, 3.0721, now() - interval '130 days', now()),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000202', false, true, 'Hotel Continental Oran', 'Business hotel in Oran city centre with sea-view rooms, restaurant, parking and meeting facilities.', 31, '11 Boulevard de la Soummam, Oran', 4, '+21341423333', 'contact@continental-oran.demo', 'https://continental-oran.demo', null, null, null, 'travex-demo-continental-oran', 35.6971, -0.6308, now() - interval '105 days', now()),
  ('10000000-0000-4000-8000-000000000004', null, true, true, 'Le Méridien Oran Hotel & Convention Centre', 'Modern convention hotel in Oran with large event spaces, restaurants, pool, gym and premium rooms.', 31, 'Les Genêts, Chemin de Wilaya, Oran', 5, '+21341984000', 'reservation@meridien-oran.demo', 'https://www.marriott.com', null, null, null, 'travex-demo-meridien-oran', 35.7197, -0.5709, now() - interval '125 days', now()),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000203', false, true, 'Hotel Cirta Constantine', 'Historic hotel overlooking central Constantine, suitable for business groups and cultural stays.', 25, '1 Avenue Rahmani Achour, Constantine', 4, '+21331920000', 'booking@cirta.demo', 'https://hotel-cirta.demo', null, null, null, 'travex-demo-cirta', 36.365, 6.6147, now() - interval '95 days', now()),
  ('10000000-0000-4000-8000-000000000006', null, true, true, 'Sheraton Annaba Hotel', 'Five-star hotel in Annaba with business facilities, restaurants, pool and convenient access to the city centre.', 23, 'Avenue Victor Hugo, Annaba', 5, '+21338598900', 'reservations@sheraton-annaba.demo', 'https://www.marriott.com', null, null, null, 'travex-demo-sheraton-annaba', 36.9, 7.7667, now() - interval '120 days', now()),
  ('10000000-0000-4000-8000-000000000007', null, true, true, 'Hotel Liberté Béjaïa', 'Comfortable city hotel for business and leisure groups visiting Béjaïa and the Kabylie region.', 6, 'Route des Aurès, Béjaïa', 3, '+21334210000', 'contact@liberte-bejaia.demo', null, null, null, null, 'travex-demo-liberte-bejaia', 36.7517, 5.0556, now() - interval '115 days', now()),
  ('10000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000204', false, true, 'Hotel Oasis Tamanrasset', 'Practical Sahara hotel for groups, corporate travel and excursions around Tamanrasset and the Hoggar region.', 11, 'Avenue Emir Abdelkader, Tamanrasset', 3, '+21329340000', 'booking@oasis-tamanrasset.demo', null, null, null, null, 'travex-demo-oasis-tamanrasset', 22.785, 5.5228, now() - interval '85 days', now())
on conflict do nothing;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hotels' AND column_name='country_code') THEN
    EXECUTE $$UPDATE public.hotels SET country_code='DZ' WHERE id::text LIKE '10000000-0000-4000-8000-%'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hotels' AND column_name='offline_payment_window_hours') THEN
    EXECUTE $$UPDATE public.hotels SET offline_payment_window_hours=48 WHERE id::text LIKE '10000000-0000-4000-8000-%'$$;
  END IF;
END $do$;

-- 6. HOTEL PHOTOS
insert into public.hotel_photos (id,hotel_id,storage_path,sort_order)
values
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001/lobby.jpg', 1),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007/cover.jpg', 0),
  ('11000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000008/cover.jpg', 0)
on conflict do nothing;

-- 7. HOTEL AMENITIES
with requested(hotel_id, amenity_key) as (values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'gym'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'meeting_rooms'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'spa'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'pool'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'gym'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'spa'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'meeting_rooms'),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'pool'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'gym'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'meeting_rooms'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'spa'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'meeting_rooms'),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'pool'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'gym'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'spa'),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'ac'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'wifi'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'restaurant'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'parking'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'shuttle'),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'ac')
)
insert into public.hotel_amenities (hotel_id,amenity_id)
select r.hotel_id,a.id from requested r join public.amenities a on a.key=r.amenity_key
on conflict do nothing;

-- 8. ROOM TYPES
insert into public.room_types (id,hotel_id,name,total_capacity,available_count,b2b_rate,thumbnail_path,is_active,created_at,updated_at)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Chambre Deluxe Single', 10, 9, 8500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Chambre Deluxe Double', 15, 12, 12000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Suite Junior', 5, 4, 18000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Suite Présidentielle', 2, 2, 35000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'Luxury Room', 20, 18, 9500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'Prestige Suite', 8, 7, 15000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Opera Suite', 3, 3, 22000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'Standard Single', 12, 11, 4500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'Standard Double', 18, 17, 6500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'Sea View Double', 10, 8, 8500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000004', 'Classic Room', 30, 29, 7500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'Deluxe Sea View', 15, 14, 11000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000004', 'Executive Suite', 5, 4, 20000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000005', 'Standard Room', 15, 14, 4000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000005', 'Superior Room', 10, 9, 6000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000005', 'Cirta Suite', 3, 2, 10000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000006', 'Garden View', 20, 18, 8000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000006', 'Sea View', 15, 14, 10500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000006', 'Club Suite', 5, 5, 16000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000007', 'Single Room', 8, 8, 3000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000007', 'Double Room', 12, 12, 4500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000007', 'Triple Room', 6, 6, 6000.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000008', 'Oasis Standard', 10, 9, 3500.00, null, true, now() - interval '80 days', now()),
  ('20000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000008', 'Oasis Double', 8, 7, 5000.00, null, true, now() - interval '80 days', now())
on conflict do nothing;

-- 9. BOOKINGS
-- reference is supplied for compatibility; the current db.sql trigger may replace it.
insert into public.bookings (
  id, reference, agency_id, hotel_id, room_type_id,
  room_name_snapshot, nightly_rate_snapshot, rooms_count,
  check_in, check_out, total_price, commission_rate,
  payment_method, status, created_at, updated_at
)
values
  ('50000000-0000-4000-8000-000000000001', 'TVX-DEMO-000001', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Chambre Deluxe Double', 12000.00, 2, current_date - 45, current_date - 42, 72000.00, 5.00, 'cib', 'completed', now() - interval '52 days', now() - interval '42 days'),
  ('50000000-0000-4000-8000-000000000002', 'TVX-DEMO-000002', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000010', 'Sea View Double', 8500.00, 1, current_date - 35, current_date - 31, 34000.00, 5.00, 'offline', 'completed', now() - interval '43 days', now() - interval '31 days'),
  ('50000000-0000-4000-8000-000000000003', 'TVX-DEMO-000003', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000016', 'Cirta Suite', 10000.00, 1, current_date + 5, current_date + 8, 30000.00, 5.00, 'edahabia', 'confirmed', now() - interval '5 days', now() - interval '3 days'),
  ('50000000-0000-4000-8000-000000000004', 'TVX-DEMO-000004', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', 'Chambre Deluxe Double', 12000.00, 2, current_date + 10, current_date + 12, 48000.00, 5.00, 'offline', 'pending_hotel', now() - interval '4 hours', now() - interval '4 hours'),
  ('50000000-0000-4000-8000-000000000005', 'TVX-DEMO-000005', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000010', 'Sea View Double', 8500.00, 1, current_date + 14, current_date + 18, 34000.00, 5.00, 'offline', 'awaiting_offline_payment', now() - interval '2 days', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000006', 'TVX-DEMO-000006', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000015', 'Superior Room', 6000.00, 2, current_date + 20, current_date + 22, 24000.00, 5.00, 'cib', 'pending_payment', now() - interval '30 minutes', now() - interval '30 minutes'),
  ('50000000-0000-4000-8000-000000000007', 'TVX-DEMO-000007', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000023', 'Oasis Standard', 3500.00, 1, current_date + 25, current_date + 27, 7000.00, 5.00, 'offline', 'rejected', now() - interval '5 days', now() - interval '3 days'),
  ('50000000-0000-4000-8000-000000000008', 'TVX-DEMO-000008', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Chambre Deluxe Single', 8500.00, 1, current_date + 28, current_date + 30, 17000.00, 5.00, 'offline', 'expired', now() - interval '4 days', now() - interval '2 days'),
  ('50000000-0000-4000-8000-000000000009', 'TVX-DEMO-000009', '00000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000009', 'Standard Double', 6500.00, 1, current_date + 32, current_date + 35, 19500.00, 5.00, 'cib', 'cancelled', now() - interval '8 hours', now() - interval '5 hours'),
  ('50000000-0000-4000-8000-000000000010', 'TVX-DEMO-000010', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000014', 'Standard Room', 4000.00, 3, current_date + 40, current_date + 45, 60000.00, 5.00, 'edahabia', 'confirmed', now() - interval '2 days', now() - interval '1 day'),
  ('50000000-0000-4000-8000-000000000011', 'TVX-DEMO-000011', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000024', 'Oasis Double', 5000.00, 2, current_date - 70, current_date - 68, 20000.00, 5.00, 'offline', 'completed', now() - interval '77 days', now() - interval '68 days'),
  ('50000000-0000-4000-8000-000000000012', 'TVX-DEMO-000012', '00000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000003', 'Suite Junior', 18000.00, 1, current_date + 50, current_date + 53, 54000.00, 5.00, 'edahabia', 'cancelled', now() - interval '6 hours', now() - interval '5 hours')
on conflict do nothing;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='commission_amount') THEN
    EXECUTE $$UPDATE public.bookings SET commission_amount=round(total_price*commission_rate/100,2) WHERE id::text LIKE '50000000-0000-4000-8000-%'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='rejection_reason') THEN
    EXECUTE $sql$UPDATE public.bookings SET rejection_reason=CASE id
      WHEN '50000000-0000-4000-8000-000000000007'::uuid THEN 'No availability for the requested dates.'
      WHEN '50000000-0000-4000-8000-000000000009'::uuid THEN 'Online payment failed.'
      WHEN '50000000-0000-4000-8000-000000000012'::uuid THEN 'Room stock changed after payment confirmation.'
      ELSE rejection_reason END
      WHERE id IN ('50000000-0000-4000-8000-000000000007','50000000-0000-4000-8000-000000000009','50000000-0000-4000-8000-000000000012')$sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='hotel_deadline') THEN
    EXECUTE $sql$UPDATE public.bookings SET hotel_deadline=CASE id
      WHEN '50000000-0000-4000-8000-000000000004'::uuid THEN now()+interval '20 hours'
      WHEN '50000000-0000-4000-8000-000000000007'::uuid THEN now()-interval '3 days'
      WHEN '50000000-0000-4000-8000-000000000008'::uuid THEN now()-interval '2 days'
      ELSE hotel_deadline END
      WHERE id IN ('50000000-0000-4000-8000-000000000004','50000000-0000-4000-8000-000000000007','50000000-0000-4000-8000-000000000008')$sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='payment_deadline') THEN
    EXECUTE $sql$UPDATE public.bookings SET payment_deadline=CASE id
      WHEN '50000000-0000-4000-8000-000000000005'::uuid THEN now()+interval '36 hours'
      WHEN '50000000-0000-4000-8000-000000000006'::uuid THEN now()+interval '2 hours'
      WHEN '50000000-0000-4000-8000-000000000009'::uuid THEN now()-interval '5 hours'
      ELSE payment_deadline END
      WHERE id IN ('50000000-0000-4000-8000-000000000005','50000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000009')$sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='confirmed_at') THEN
    EXECUTE $sql$UPDATE public.bookings SET confirmed_at=CASE id
      WHEN '50000000-0000-4000-8000-000000000001'::uuid THEN now()-interval '50 days'
      WHEN '50000000-0000-4000-8000-000000000003'::uuid THEN now()-interval '3 days'
      WHEN '50000000-0000-4000-8000-000000000010'::uuid THEN now()-interval '1 day'
      WHEN '50000000-0000-4000-8000-000000000011'::uuid THEN now()-interval '75 days'
      ELSE confirmed_at END
      WHERE id IN ('50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000010','50000000-0000-4000-8000-000000000011')$sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='received_confirmed_at') THEN
    EXECUTE $sql$UPDATE public.bookings SET received_confirmed_at=CASE id
      WHEN '50000000-0000-4000-8000-000000000002'::uuid THEN now()-interval '39 days'
      WHEN '50000000-0000-4000-8000-000000000011'::uuid THEN now()-interval '74 days'
      ELSE received_confirmed_at END
      WHERE id IN ('50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000011')$sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='voucher_path') THEN
    EXECUTE $$UPDATE public.bookings SET voucher_path='vouchers/'||id::text||'.pdf' WHERE id IN ('50000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000010','50000000-0000-4000-8000-000000000011')$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='archived_by_agency') THEN
    EXECUTE $$UPDATE public.bookings SET archived_by_agency=true WHERE id='50000000-0000-4000-8000-000000000008'$$;
  END IF;
END $do$;

-- 10. PAYMENTS
insert into public.payments (id,booking_id,provider,method,amount,status,created_at)
values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'chargily', 'cib', 72000.00, 'paid', now()-interval '51 days'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000003', 'chargily', 'edahabia', 30000.00, 'paid', now()-interval '4 days'),
  ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000006', 'chargily', 'cib', 24000.00, 'initiated', now()-interval '30 minutes'),
  ('60000000-0000-4000-8000-000000000004', '50000000-0000-4000-8000-000000000009', 'chargily', 'cib', 19500.00, 'failed', now()-interval '8 hours'),
  ('60000000-0000-4000-8000-000000000005', '50000000-0000-4000-8000-000000000010', 'chargily', 'edahabia', 60000.00, 'paid', now()-interval '2 days'),
  ('60000000-0000-4000-8000-000000000006', '50000000-0000-4000-8000-000000000012', 'chargily', 'edahabia', 54000.00, 'refund_required', now()-interval '6 hours')
on conflict do nothing;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='checkout_id') THEN
    EXECUTE $$UPDATE public.payments SET checkout_id='demo-checkout-'||right(id::text,12) WHERE id::text LIKE '60000000-0000-4000-8000-%'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='raw') THEN
    EXECUTE $$UPDATE public.payments SET raw=jsonb_build_object('mode','demo','status',status::text) WHERE id::text LIKE '60000000-0000-4000-8000-%'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='paid_at') THEN
    EXECUTE $$UPDATE public.payments SET paid_at=created_at+interval '1 hour' WHERE id IN ('60000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000006')$$;
  END IF;
END $do$;

-- 11. INVOICES
insert into public.invoices (id,hotel_id,period_year,period_month,bookings_total,commission_due,status,issued_at,due_date)
values
  ('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',extract(year from current_date-interval '1 month')::int,extract(month from current_date-interval '1 month')::int,72000.00,3600.00,'paid',date_trunc('month',current_date),date_trunc('month',current_date)::date+9),
  ('70000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003',extract(year from current_date-interval '1 month')::int,extract(month from current_date-interval '1 month')::int,34000.00,1700.00,'unpaid',date_trunc('month',current_date),date_trunc('month',current_date)::date+9),
  ('70000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000008',extract(year from current_date-interval '2 months')::int,extract(month from current_date-interval '2 months')::int,20000.00,1000.00,'overdue',date_trunc('month',current_date-interval '1 month'),date_trunc('month',current_date-interval '1 month')::date+9)
on conflict do nothing;

insert into public.invoice_items (invoice_id,booking_id,amount,commission)
select * from (values
  ('70000000-0000-4000-8000-000000000001'::uuid,'50000000-0000-4000-8000-000000000001'::uuid,72000.00::numeric,3600.00::numeric),
  ('70000000-0000-4000-8000-000000000002'::uuid,'50000000-0000-4000-8000-000000000002'::uuid,34000.00::numeric,1700.00::numeric),
  ('70000000-0000-4000-8000-000000000003'::uuid,'50000000-0000-4000-8000-000000000011'::uuid,20000.00::numeric,1000.00::numeric)
) v(invoice_id,booking_id,amount,commission)
where exists (select 1 from public.invoices i where i.id=v.invoice_id)
  and exists (select 1 from public.bookings b where b.id=v.booking_id)
on conflict do nothing;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' AND column_name='invoice_id') THEN
    EXECUTE $sql$
      UPDATE public.bookings b
      SET invoice_id = m.invoice_id
      FROM (VALUES
        ('50000000-0000-4000-8000-000000000001'::uuid,'70000000-0000-4000-8000-000000000001'::uuid),
        ('50000000-0000-4000-8000-000000000002'::uuid,'70000000-0000-4000-8000-000000000002'::uuid),
        ('50000000-0000-4000-8000-000000000011'::uuid,'70000000-0000-4000-8000-000000000003'::uuid)
      ) AS m(booking_id,invoice_id)
      WHERE b.id=m.booking_id
        AND EXISTS (SELECT 1 FROM public.invoices i WHERE i.id=m.invoice_id)
    $sql$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='pdf_path') THEN
    EXECUTE $$UPDATE public.invoices SET pdf_path='invoices/'||id::text||'.pdf' WHERE id::text LIKE '70000000-0000-4000-8000-%'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='paid_at') THEN
    EXECUTE $$UPDATE public.invoices SET paid_at=issued_at+interval '4 days' WHERE id='70000000-0000-4000-8000-000000000001'$$;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='payment_reference') THEN
    EXECUTE $$UPDATE public.invoices SET payment_reference='BANK-DEMO-AURASSI-001' WHERE id='70000000-0000-4000-8000-000000000001'$$;
  END IF;
END $do$;

-- 12. HOTEL CLAIMS
insert into public.hotel_claims (id,claimant_profile_id,seeded_hotel_id,status,decided_by,decided_at,created_at)
values
  ('80000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000206','10000000-0000-4000-8000-000000000002','pending',null,null,now()-interval '2 days'),
  ('80000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000206','10000000-0000-4000-8000-000000000004','rejected','00000000-0000-4000-8000-000000000001',now()-interval '7 days',now()-interval '9 days')
on conflict do nothing;

-- 13. NOTIFICATIONS
insert into public.notifications (id,user_id,type,data,read_at,created_at)
values
  ('81000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000201', 'booking_request', '{"booking_id":"50000000-0000-4000-8000-000000000004","message":"New offline booking request"}'::jsonb, null, now()-interval '4 hours'),
  ('81000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', 'payment_window_started', '{"booking_id":"50000000-0000-4000-8000-000000000005","message":"Offline payment window started"}'::jsonb, null, now()-interval '1 day'),
  ('81000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000101', 'online_confirmed', '{"booking_id":"50000000-0000-4000-8000-000000000003","message":"Online booking confirmed"}'::jsonb, now()-interval '2 days', now()-interval '3 days'),
  ('81000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000102', 'booking_rejected', '{"booking_id":"50000000-0000-4000-8000-000000000007","reason":"No availability for the requested dates."}'::jsonb, null, now()-interval '3 days'),
  ('81000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000102', 'refund_required', '{"booking_id":"50000000-0000-4000-8000-000000000012","amount":54000}'::jsonb, null, now()-interval '5 hours'),
  ('81000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000205', 'account_review_pending', '{"message":"Your hotel account is waiting for administrator review."}'::jsonb, null, now()-interval '3 days'),
  ('81000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000103', 'account_rejected', '{"reason":"Le registre commercial fourni est illisible."}'::jsonb, null, now()-interval '12 days'),
  ('81000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000202', 'invoice_issued', '{"invoice_id":"70000000-0000-4000-8000-000000000002","amount":1700}'::jsonb, null, now()-interval '10 days')
on conflict do nothing;

-- 14. AUDIT LOGS
insert into public.audit_logs (actor_id,action,target_type,target_id,meta,created_at)
select '00000000-0000-4000-8000-000000000001','profile_reviewed','profile','00000000-0000-4000-8000-000000000103','{"decision":"rejected","reason":"Unreadable commercial registry"}'::jsonb,now()-interval '12 days'
where not exists (select 1 from public.audit_logs where action='profile_reviewed' and target_id='00000000-0000-4000-8000-000000000103');

insert into public.audit_logs (actor_id,action,target_type,target_id,meta,created_at)
select '00000000-0000-4000-8000-000000000001','hotel_claim_decided','hotel_claim','80000000-0000-4000-8000-000000000002','{"decision":"rejected"}'::jsonb,now()-interval '7 days'
where not exists (select 1 from public.audit_logs where action='hotel_claim_decided' and target_id='80000000-0000-4000-8000-000000000002');

insert into public.audit_logs (actor_id,action,target_type,target_id,meta,created_at)
select '00000000-0000-4000-8000-000000000001','demo_seed_loaded','database','travex-demo-data-v3',jsonb_build_object('hotels',8,'rooms',24,'bookings',12),now()
where not exists (select 1 from public.audit_logs where action='demo_seed_loaded' and target_id='travex-demo-data-v3');

commit;

-- 15. VERIFICATION
select 'profiles' table_name,count(*) row_count from public.profiles
union all select 'business_documents',count(*) from public.business_documents
union all select 'hotels',count(*) from public.hotels
union all select 'hotel_photos',count(*) from public.hotel_photos
union all select 'hotel_amenities',count(*) from public.hotel_amenities
union all select 'room_types',count(*) from public.room_types
union all select 'bookings',count(*) from public.bookings
union all select 'payments',count(*) from public.payments
union all select 'invoices',count(*) from public.invoices
union all select 'invoice_items',count(*) from public.invoice_items
union all select 'hotel_claims',count(*) from public.hotel_claims
union all select 'notifications',count(*) from public.notifications
union all select 'audit_logs',count(*) from public.audit_logs
order by table_name;

-- Demo accounts, all using TravexDemo123!:
-- admin@travex.demo
-- atlas.agency@travex.demo
-- sahara.voyages@travex.demo
-- aurassi@travex.demo
-- continental.oran@travex.demo
-- cirta@travex.demo
-- oasis.tamanrasset@travex.demo
-- claimant.hotel@travex.demo
