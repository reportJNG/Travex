# TRAVEX — complete product implementation master prompt

Copy the full prompt below into the implementation agent. This specification consolidates the original 15-page `Travex Futers.pdf`, the supplied Travex brand board, the generated visual assets, and every current application route into one build-ready source of truth.

---

## BEGIN IMPLEMENTATION PROMPT

You are the senior product designer, full-stack engineer, database engineer, security reviewer, and QA owner responsible for finishing **Travex** as a production-quality Algerian B2B hotel marketplace.

Your task is to **implement the complete product in the existing repository**. Do not return only a plan, do not create another prompt, and do not stop after producing mockups or isolated assets. Inspect the repository first, preserve working code and user changes, then implement, connect, test, and verify every requirement below.

If a feature already exists, audit it against this specification and finish or correct it. If a feature is missing, build it. Do not use fake buttons, dead links, placeholder toasts, or “coming soon” interactions in the final result. Seeded/demo data must be visibly identified and must never be presented as a real hotel partner.

### 1. Product outcome

Build a trustworthy three-sided marketplace connecting:

1. Verified Algerian travel agencies that search and book hotel inventory at B2B rates.
2. Verified hotel/accommodation providers that manage property information, rooms, availability, booking requests, payments, and commission invoices.
3. Travex super administrators who verify businesses and documents, audit offline receipts, manage users and hotel claims, monitor platform revenue, issue commission invoices, enforce overdue-payment suspension, and inspect immutable audit logs.

The finished product must support the full registration-to-verification-to-booking-to-payment-to-invoicing lifecycle. It must work in French, English, and Arabic, including right-to-left Arabic layouts. Currency is Algerian dinar (`DZD`), dates use Algerian conventions, and all deadline calculations use the `Africa/Algiers` timezone.

### 2. Repository and source-of-truth rules

Before changing code:

- Read the repository structure, package scripts, environment variables, routes, API routers, database schema, migrations, storage rules, existing tests, and current UI components.
- Read `prompts/Travex Futers.pdf` in full.
- Inspect `prompts/TRAVEX brand identity.png` for brand intent.
- Read `prompts/GENERATED_ASSETS.md` for final image prompts and asset paths.
- Reuse the existing React, TypeScript, Vite, Tailwind/shadcn-style UI, tRPC, Supabase/PostgreSQL, storage, and authentication architecture unless a verified repository constraint requires otherwise.
- Preserve all unrelated user changes. Extend existing components and tokens instead of creating duplicate systems.
- Keep secrets in environment variables. Never expose service-role keys, payment secrets, or private storage URLs to the browser.
- Treat this master prompt as the resolved functional specification when the older PDF wording is incomplete or ambiguous.

### 3. Non-negotiable definition of done

The product is not complete until all of the following are true:

- Every public, agency, hotel, shared, admin, account-state, payment, document, and error screen listed below exists and is responsive.
- Every visible action is connected to real application logic or is removed.
- Authentication, role guards, account-state guards, and ownership checks work on both client and server.
- Business document upload, private storage, signed viewing, validation, and admin decisions work.
- Online payment is implemented behind a provider adapter with safe success, failure, cancellation, webhook, idempotency, and refund-required handling. If live provider credentials are unavailable, provide a clearly labeled sandbox adapter that exercises the complete state machine without pretending to be production payment.
- Offline payment creates an inventory hold, exposes exact payment instructions, enforces the 48-hour deadline, accepts a PDF/image receipt, routes it to admin review, and releases inventory automatically when expired.
- The 5% Travex commission is calculated on the server from immutable booking snapshots; clients may display but may never determine the authoritative value.
- Monthly hotel commission invoices are generated idempotently, downloadable as real PDFs, tracked through grace and overdue states, and connected to hotel visibility enforcement.
- Booking vouchers/confirmations and required financial documents are real server-generated PDFs, not HTML screenshots.
- Notifications and audit logs are produced for every critical transition.
- Loading, empty, error, forbidden, offline/retry, success, expired, rejected, suspended, and destructive-confirmation states are designed and functional.
- No broken image, missing icon, duplicated ID, layout overflow, console error, TypeScript error, lint error, test failure, or production build failure remains.
- Desktop, tablet, mobile, French, English, Arabic RTL, keyboard navigation, and reduced-motion behavior are verified.

### 4. Roles, permissions, and account states

#### 4.1 Roles

- `agency`: browse approved/visible hotels, make bookings, complete payments, upload offline receipts, access agency history/documents, and edit non-sensitive profile information.
- `hotel`: manage only its owned/approved property, payment settings, rooms, media, availability, requests, analytics, commissions, and invoices.
- `super_admin`: access all operational queues, verification documents, payment receipts, users, claims, invoices, audit logs, settings, and aggregate analytics.

#### 4.2 Account states

- `awaiting_review`: may sign in but only sees the pending-review screen, permitted profile/help actions, and notifications.
- `approved`: receives role-appropriate access.
- `rejected`: sees the rejection reason, support path, and resubmission path when permitted.
- `suspended`: cannot perform marketplace operations; sees the reason, effective date, and support path.

Enforce these states server-side. Hiding a navigation link is not authorization.

#### 4.3 Property visibility state

Hotel marketplace visibility is separate from user account status:

- `draft`: incomplete profile; never listed.
- `pending_verification`: profile/payment ownership awaiting admin approval.
- `visible`: approved and eligible for marketplace display.
- `hidden_manual`: hidden by hotel or admin.
- `hidden_overdue`: automatically hidden due to an overdue Travex commission invoice.

When an overdue settlement is verified, restore the prior eligible visibility state and record the change in the audit log.

### 5. Brand and interface system

#### 5.1 Brand identity

Use the supplied Travex vector family as the only logo source:

- `/public/brand/travex-mark.svg`
- `/public/brand/travex-mark-mono.svg`
- `/public/brand/travex-lockup.svg`
- `/public/brand/travex-lockup-light.svg`

Use the existing favicon, Apple icon, maskable icon, social card, and web manifest. Do not regenerate the logo with an image model and do not distort, rotate, recolor, crop, or add effects to the mark.

Core palette:

- Ink/navy: `#222C4F`
- Teal: `#54B0A4`
- Sky: `#5E9CCD`
- Violet: `#9C72BE`
- Coral: `#EA7C73`
- Amber: `#F5C07E`

Use ink/navy for authority and readable text, teal for primary actions and positive states, sky/violet for supporting accents, coral for destructive emphasis, and amber for time-sensitive warnings. Maintain WCAG AA contrast; brand color never overrides legibility.

#### 5.2 Photography

Use the approved project assets:

- Home: `/media/travex-home-hero.webp` and `/media/travex-home-hero-mobile.webp`
- About: `/media/travex-about-hero.webp` and `/media/travex-about-hero-mobile.webp`
- Authentication: `/media/travex-auth-lobby.webp`
- Generic demo listing media: hotel exterior, room, pool, and conference WebP files in `/public/media`

Use responsive `<picture>` sources, explicit width/height, useful alt text, lazy loading below the fold, and dark overlays only where needed for text contrast. Real hotel listings must use provider-uploaded media. Generic generated imagery must be labeled as illustrative/demo content.

#### 5.3 Typography, spacing, and components

- Use a clean modern sans-serif with strong Arabic support and stable fallbacks.
- Use a restrained 4/8px spacing system, consistent page width, 12–20px card radius, subtle borders, and layered but soft shadows.
- Provide shared buttons, form controls, cards, data tables, status badges, dialogs, sheets, drawers, tabs, pagination, breadcrumbs, skeletons, file uploaders, date pickers, currency formatting, charts, toasts, empty states, and error states.
- Desktop tables must transform into readable mobile cards rather than forcing horizontal overflow wherever practical.
- All forms need persistent labels, help text, validation messages, required indicators, disabled/submitting states, and safe focus placement after errors.

#### 5.4 Motion and hover behavior

- Use 160–240ms transitions with standard easing.
- Cards may lift by at most 2–3px and strengthen their shadow/border on hover.
- Listing images may scale to at most 1.04 inside an overflow-hidden frame.
- Buttons need hover, pressed, keyboard-focus, disabled, and loading states.
- Dialogs/sheets use subtle opacity and transform transitions.
- Route transitions must be brief and must never leave content invisible.
- Respect `prefers-reduced-motion`; remove decorative translation/scaling and keep essential state feedback.

### 6. Global application shell

#### 6.1 Public header

- Travex lockup links to Home.
- Links: Explore Hotels, Transport & Logistics with an honest “Soon” badge, About.
- Language selector: French, English, Arabic; changing to Arabic switches document direction to RTL.
- Signed-out actions: Log in and Create account.
- Signed-in actions: role-aware workspace shortcut, notifications with unread count, profile menu, settings, and sign out.
- Sticky behavior is acceptable if it does not cover anchored content.
- Mobile uses an accessible menu sheet with focus trapping and close controls.

#### 6.2 Authenticated workspace navigation

Agency navigation:

- Marketplace
- Dashboard / Bookings
- Documents / Invoices
- Notifications
- Profile
- Settings

Hotel navigation:

- Property & Inventory
- Booking Requests
- Analytics
- Commission Invoices
- Notifications
- Profile
- Settings

Admin navigation:

- Command Center
- Business Verifications
- Offline Payment Reviews
- Users
- Hotel Claims
- Hotel Invoices
- Audit Logs
- Notifications
- Settings

Show the current route, collapse appropriately on smaller screens, and prevent role-inaccessible destinations from rendering.

#### 6.3 Footer

- Travex lockup and concise B2B positioning.
- Help Center, Contact Us, About, Privacy Policy, Terms, Cookie Policy, and business verification information.
- Verified support email and phone values from configuration—never hard-coded fake company details.
- Social/share links only when configured.
- Language switch and copyright year.

### 7. Route and screen inventory

Use the existing routes where present and add explicit nested routes or route-backed overlays for missing flows. Every item below is required.

| Area        | Route or route family          | Screen                                              |
| ----------- | ------------------------------ | --------------------------------------------------- |
| Public      | `/`                            | Home                                                |
| Public      | `/about`                       | About Travex                                        |
| Auth        | `/login`                       | Sign in                                             |
| Auth        | `/register`                    | Multi-step business registration                    |
| Auth        | `/register/submitted`          | Registration submitted confirmation                 |
| Account     | `/pending`                     | Awaiting review                                     |
| Account     | `/rejected`                    | Rejected application                                |
| Account     | `/suspended`                   | Suspended account                                   |
| Marketplace | `/marketplace`                 | Search and hotel results                            |
| Marketplace | `/hotel/:id`                   | Hotel detail and room selection                     |
| Booking     | `/booking/:id/checkout`        | Booking review and payment choice                   |
| Booking     | `/booking/:id/offline-payment` | Offline instructions, countdown, and receipt upload |
| Booking     | `/booking/:id/payment-result`  | Online payment result                               |
| Booking     | `/booking/:id/confirmation`    | Confirmed booking and voucher                       |
| Agency      | `/dashboard`                   | Agency booking dashboard                            |
| Agency      | `/invoices`                    | Agency documents and booking financial history      |
| Hotel       | `/inventory`                   | Property profile, rooms, media, and inventory       |
| Hotel       | `/inventory/calendar`          | Availability calendar and manual blocks             |
| Hotel       | `/requests`                    | Booking/payment requests                            |
| Hotel       | `/analytics`                   | Hotel analytics                                     |
| Hotel       | `/hotel-invoices`              | Commission ledger and invoices                      |
| Admin       | `/admin`                       | Command center                                      |
| Admin       | `/admin/verifications`         | Business verification queue                         |
| Admin       | `/admin/payment-verifications` | Offline receipt review queue                        |
| Admin       | `/admin/users`                 | User management                                     |
| Admin       | `/admin/claims`                | Hotel ownership claims                              |
| Admin       | `/admin/invoices`              | Monthly invoice management                          |
| Admin       | `/admin/audit-logs`            | Audit log explorer                                  |
| Shared      | `/notifications`               | Notification center                                 |
| Shared      | `/profile`                     | Profile                                             |
| Shared      | `/settings`                    | Settings                                            |
| System      | `*`                            | 404 / unavailable route                             |

### 8. Screen-by-screen requirements

#### 8.1 Home — `/`

Purpose: establish trust, explain Travex quickly, and move verified B2B users into hotel discovery or registration.

Required sections:

1. Hero with responsive Algiers imagery, a clear “Travel Excellence” value proposition, and a B2B/Algeria trust label.
2. Search module with check-in, check-out, Algerian wilaya/city, optional hotel name, room quantity, and Search Hotels action.
3. Search validation: checkout after check-in, no past dates, 1–20 rooms, and accessible inline errors.
4. Primary actions: Create an account and Explore Hotels.
5. Trust metrics for approved hotels, verified agencies, bookings, and wilayas. Load real aggregate values or label seeded values as illustrative.
6. Curated opportunities containing image, demo/verified status, hotel/property label, location, star/category, starting B2B price in DZD, amenities, and View Hotel action.
7. “Why Travex” benefits: verified network, B2B-only rates, secure payment workflows, inventory clarity, Algerian focus, and role-aware operations.
8. Three-step workflow for agencies and a parallel three-step workflow for hotels.
9. Payment and verification transparency section explaining online and offline paths without misleading security claims.
10. Testimonials or partner statements only when sourced; otherwise use product-value proof instead of invented quotations.
11. Final branded CTA and complete footer.

States:

- Signed-out CTA routes to registration/login.
- Approved users route to the role-appropriate workspace.
- Pending/rejected/suspended users route to their account-state screen.
- Search submission carries filters into Marketplace.

#### 8.2 About — `/about`

Required content:

- Responsive Oran hero and concise mission.
- The problem Travex solves for Algerian travel agencies and hotels.
- How verification, booking, payment, commission, and auditability work.
- Trust-first principles, B2B exclusivity, Algeria focus, and partner ecosystem.
- Wilaya coverage/growth statement backed by actual data.
- Role-specific CTA cards for agencies and hotels.
- Contact/help path and legal footer links.

Do not invent founding dates, partners, awards, regulatory approvals, or statistics.

#### 8.3 Login — `/login`

- Branded lobby image panel on desktop and compact Travex identity on mobile.
- Email and password fields with show/hide password, forgot-password link, validation, and submit loading state.
- Google authentication connected to the configured auth provider. If Google credentials are absent, hide the button or show a configuration-safe disabled explanation; never use a fake success toast.
- Remember-session behavior only if supported securely.
- Clear invalid-credentials, unverified-email, rate-limit, network, and suspended-account responses.
- Registration link and return-to-intended-route behavior.

#### 8.4 Registration — `/register`

Use a responsive multi-step form with a visible stepper and saved in-progress state.

Step 1 — Account type:

- Large, keyboard-accessible selection cards: Travel Agency or Hotel/Accommodation Provider.
- Explain what each workspace provides.

Step 2 — Credentials and business identity:

- Representative full name.
- Business email and verified phone.
- Password and confirmation with visible requirements.
- Official legal/corporate name.
- Algerian wilaya and full business address.
- NIF/tax number.
- Tourism/operating licence number.
- Role-specific fields where legally required.

Step 3 — Document upload center:

- Commercial Registry.
- Tourism and Operating License.
- Tax Card / NIF document.
- Optional supplementary legal document.
- Accept PDF, JPEG, and PNG only; enforce configurable size/page limits, MIME sniffing, malware scanning hook, and private storage.
- Drag/drop plus normal file picker, upload progress, preview, replace, remove, and retry.
- Mandatory warning that files must be clear/readable and the account remains locked pending manual review.

Step 4 — Review and consent:

- Summarize entered information and uploaded file names.
- Links to Terms and Privacy Policy.
- Required consent checkbox with timestamp and policy version.
- Final Submit for Review action with duplicate-submit protection.

#### 8.5 Registration submitted — `/register/submitted`

- Success identity, application reference, submitted business, and expected review guidance.
- Explain that access is locked until admin approval.
- Buttons for View Status, Sign In, and Contact Support.
- Never promise a fixed approval time unless operationally guaranteed.

#### 8.6 Pending, rejected, and suspended account screens

Pending `/pending`:

- Application reference, submitted time, current step, document checklist, notification guidance, and support action.
- Allow permitted document replacement only through an audited resubmission workflow.

Rejected `/rejected`:

- Exact admin-provided reason, decision date, support path, and Resubmit Documents action when allowed.
- Never reveal internal-only notes.

Suspended `/suspended`:

- Plain-language suspension reason, effective date, affected capability, and resolution/contact instructions.
- If the issue is a hotel invoice, link the owner to the exact overdue invoice and settlement instructions.

#### 8.7 Marketplace — `/marketplace`

- Search by hotel name, city/wilaya, check-in, check-out, and room count.
- Filters: wilaya, price range in DZD, property category/stars, amenities, room type, online/offline payment support, and verified-only.
- Sort: recommended, lowest rate, highest rate, rating/category, and newest verified.
- Desktop filter rail or toolbar; mobile filter sheet with selected-filter count and clear-all.
- Result cards: real/illustrative image status, property name, exact wilaya, category, core amenities, payment methods, availability for selected dates, starting B2B price, and View Rooms.
- Optional map/list toggle only after the map and coordinates are truly connected.
- Pagination or stable cursor loading, preserved filters in the URL, and back-navigation restoration.
- Loading skeleton, no-results suggestions, API failure retry, and hidden/suspended property exclusion.

Never expose private contact/payment details in search cards.

#### 8.8 Hotel detail and room selection — `/hotel/:id`

- Breadcrumbs and verified/demo status.
- Hotel name, category/stars, exact address, wilaya, map pin, description, policies, and amenities with icons.
- Accessible media gallery with primary image, thumbnails, lightbox, image count, and safe fallbacks.
- Room cards with room name/type, images, occupancy, included amenities, B2B nightly rate, remaining availability for selected dates, cancellation/payment policy, and Select action.
- Sticky desktop booking summary and mobile bottom action.
- Check-in, check-out, rooms count, room type, number of nights, rate snapshot, subtotal, Travex fee/commission disclosure where appropriate, and total DZD.
- Disable booking when dates/stock/profile/payment method are invalid.
- Hotel owners/admins may preview but may not accidentally book their own listing.

#### 8.9 Booking review and payment choice — `/booking/:id/checkout`

Show an immutable review before committing:

- Agency legal identity.
- Hotel and room snapshot.
- Dates, nights, room count, occupancy, and cancellation terms.
- Itemized DZD pricing and gross total.
- Available payment choices based on hotel configuration: CIB, Edahabia, offline bank/CCP, or both.
- Plain-language explanation of what happens next for each method.
- Required confirmation of booking/payment terms.
- Back/edit action that safely revalidates inventory.
- Confirm action protected from duplicate clicks and stale inventory.

#### 8.10 Online payment flow

The server must create the checkout and calculate:

- `gross_amount = authoritative booking total`
- `travex_share = round(gross_amount × 0.05, currency rules)`
- `vendor_share = gross_amount - travex_share`

Requirements:

- Use a payment-provider adapter and server-created checkout session.
- Verify signed webhooks and process them idempotently.
- Never trust a client-provided amount, commission, status, or success redirect.
- On verified success, confirm the booking, permanently allocate inventory for the stay, store payment/commission records, notify agency and hotel, and create the voucher.
- On failure/cancellation, preserve a clear retry path and release any expiring provisional hold.
- On sold-out race after payment, mark `refund_required`, notify admins, initiate/track refund, and never silently confirm unavailable inventory.

Payment result `/booking/:id/payment-result` states:

- Processing/pending webhook.
- Confirmed with reference and View Voucher.
- Failed with safe retry.
- Cancelled.
- Refund required/in progress with support reference.

#### 8.11 Offline payment instructions and receipt upload — `/booking/:id/offline-payment`

Immediately after confirmed offline selection:

- Lock the exact requested inventory for the requested date range.
- Set status to `awaiting_receipt_upload`.
- Create a server deadline exactly 48 hours from confirmation, or the configured approved hotel window when the business setting explicitly overrides it.
- Display hotel legal beneficiary name, masked/approved CCP or bank RIB details, exact DZD amount, booking reference required in the transfer memo, and safe copy buttons.
- Display a server-derived countdown and absolute deadline in local time. Client clocks never control expiry.
- Explain accepted receipt formats and the admin review process.

Receipt uploader:

- PDF/JPEG/PNG, private storage, file validation, upload progress, preview, replace, and submit.
- Store checksum, MIME, size, uploader, upload time, and booking association.
- After submission set status to `awaiting_admin_payment_verification`.
- Admin may approve, reject with reason, or request resubmission.
- If rejected before the deadline, show the reason and allow a replacement.
- At expiry, atomically set `expired`, release the hold, notify agency/hotel, close upload, and remove any blocking overlay.

Persistent reminder behavior:

- While an agency has an offline booking awaiting receipt, show a high-priority banner on all agency screens.
- Near the deadline, show a blocking modal when required by product policy, but retain safe access to receipt upload, booking details, support, sign out, and cancellation.
- Never trap users without a recovery path.

#### 8.12 Booking confirmation and voucher — `/booking/:id/confirmation`

- Confirmation state, booking reference, hotel, room, dates, guests/rooms, total, payment method, and support details.
- View/download voucher PDF.
- Add-to-calendar file where supported.
- Print-friendly view.
- Clear next steps and cancellation/contact policy.
- Access is limited to booking agency, owning hotel, and admin.

#### 8.13 Agency dashboard — `/dashboard`

- KPI cards: active bookings, awaiting action, confirmed/upcoming, completed, and total booked value.
- High-priority offline payment countdown panel.
- Search and filter by reference, hotel, dates, payment method, and status.
- Tabs: All, Pending, Awaiting Receipt, Awaiting Admin Review, Confirmed, Completed, Rejected, Expired/Cancelled, Archived.
- Responsive rows/cards with hotel, room, dates, total, payment, deadline, status, and context actions.
- Detail drawer with state timeline and audit-safe status history.
- Actions: continue payment, upload/replace receipt, view reason, view voucher, download document, archive terminal booking, and contact support.
- Empty, loading, retry, and partial-data states.

#### 8.14 Agency documents and financial history — `/invoices`

- Explain that hotel commission invoices belong to hotel accounts; agency documents are booking confirmations, receipts, vouchers, and payment records.
- Filters by date, hotel, booking reference, payment method, and status.
- Each row shows booking total, payment status, document availability, and actions.
- Download booking voucher, booking receipt, and agency booking statement PDF when applicable.
- Provide totals for the selected period without mislabeling them as tax invoices unless the legal document qualifies.

#### 8.15 Hotel property and inventory — `/inventory`

Organize the page into clear tabs or sections.

Property profile:

- Hotel name, category/stars, full address, wilaya, phone, business email, website, description, check-in/out policy, and visibility state.
- Google Maps-compatible location picker with draggable pin and stored latitude/longitude. Use the configured map provider; if absent, retain manual coordinates without a fake map.

Amenities and marketing:

- Multi-select hotel amenities such as Wi-Fi, gym, pool, parking, security, meeting rooms, restaurant, airport transfer, and accessibility.
- Drag/drop gallery, primary-image selection, ordering, captions/alt text, progress, crop guidance, removal confirmation, and real storage integration.

Payment settings:

- Online only, Offline only, or Both.
- Conditional CCP/RIB fields, beneficiary legal name, bank/post provider, and ownership proof.
- Sensitive values masked after save.
- Changes that affect verified ownership return to admin review before becoming active.
- Configurable offline payment window within admin-approved limits; default 48 hours.

Room inventory:

- Add/edit room type: Single, Double, Triple, Family Suite, or custom designation.
- Room name, description, occupancy, bed configuration, amenities, B2B nightly rate in DZD, total stock, active status, and room-category images.
- Increase/decrease stock with validation and audit history.
- Prevent stock reductions below already allocated inventory.
- Display available, held, booked, and blocked counts separately.

#### 8.16 Availability calendar — `/inventory/calendar`

- Month/week calendar and room-type selector.
- Visual layers for available stock, Travex booking holds, confirmed bookings, and manual external blocks.
- Create a manual block with room type, quantity, start/end dates, reason, and optional note.
- Edit or cancel future manual blocks with confirmation.
- Automatically release blocks at their configured end date.
- Restore availability after checkout without exceeding physical stock.
- Detect conflicting or impossible adjustments and explain them.

#### 8.17 Hotel requests — `/requests`

- Tabs for New Requests, Awaiting Agency Receipt, Awaiting Admin Verification, Confirmed, and History.
- Booking cards/table include agency identity, reference, room/date/quantity, total, payment method, deadline, and status.
- If the configured offline business flow requires hotel acceptance, provide Approve and Reject with a mandatory rejection reason before the agency payment window starts. Do not add this step to online instant booking unless policy requires it.
- Hotel can acknowledge payment information but cannot perform the admin receipt-verification action defined by the original Travex financial-control workflow.
- View receipt only when policy and privacy permit; admin remains the final verification authority.
- State timeline and notifications for every decision.

#### 8.18 Hotel analytics — `/analytics`

- Date range and comparison selector.
- KPIs: booking count, confirmed nights, occupancy based on managed stock, gross booking value, Travex commission, average booking value, cancellation/expiry rate.
- Charts: booking trend, room-type performance, payment method share, booking-status distribution, and top agency relationships where privacy permits.
- Explain metric formulas in tooltips.
- Use real data, meaningful zero states, accessible chart summaries, and CSV export.

#### 8.19 Hotel commission ledger and invoices — `/hotel-invoices`

- Live ledger of confirmed/completed bookings and their 5% commission entries.
- Summary: unbilled commission, currently due, overdue, and paid year-to-date.
- Monthly invoice table with invoice number, period, booking total, commission due, issue date, due date, grace status, payment reference, and visibility consequence.
- Invoice detail sheet/page with line items and booking references.
- Download invoice PDF.
- Settlement instructions for Travex CCP/CIB/bank channel from secure configuration.
- Upload settlement receipt if the operational process requires admin verification.
- Prominent countdown/warning during grace and clear hidden-overdue state.

#### 8.20 Admin command center — `/admin`

- KPIs: approved agencies, approved/visible hotels, confirmed bookings, gross transaction volume, platform commission earned, unbilled commission, overdue invoices, pending business reviews, and pending receipts.
- Time-series charts for GTV and commission.
- Operational queue cards linking to exact filtered queues.
- Monthly invoice status matrix: Paid, Within Grace, Overdue/Hidden.
- Recently completed admin actions and system health/cron status.
- No fabricated live telemetry. Show unavailable/error states when a metric cannot load.

#### 8.21 Business verification queue — `/admin/verifications`

- Search/filter by entity type, wilaya, submission age, and document completeness.
- Table/cards: legal name, Agency/Hotel, owner, phone, email, wilaya, submitted time, and risk/completeness flags.
- Review screen or wide sheet with submitted profile and documents side by side.
- Native PDF/image viewer with page controls, zoom, rotate, download authorization, and signed private URLs.
- Approve & Verify action.
- Reject action requiring a user-facing rejection reason; optional separate internal note.
- Request Replacement action selecting the problematic documents.
- Confirm dialogs for irreversible decisions.
- Write reviewer ID/time, decision, reason, document versions, and audit event.

#### 8.22 Offline payment review queue — `/admin/payment-verifications`

- Filters: age, deadline, hotel, agency, wilaya, amount, receipt state, and suspected duplicate.
- Row data: booking reference, agency, hotel, gross amount, 5% commission, submitted time, deadline, and receipt status.
- Review workspace: booking snapshot, beneficiary details used at booking time, amount/reference matcher, receipt image/PDF viewer, receipt metadata/checksum, and prior submission history.
- Approve Clearance: atomically confirm booking, permanently assign inventory, calculate/store commission, create voucher, and notify both businesses.
- Reject / Request Resubmission: mandatory user-facing reason and retained version history.
- Flag for Investigation: prevents accidental expiry while an authorized review is active and alerts admins.
- Every view and decision is permission-checked and audited.

#### 8.23 Admin users — `/admin/users`

- Search, role, account status, wilaya, and date filters.
- Responsive user table with identity, legal business, role, status, verification date, last activity, and property association.
- User detail drawer with profile, verification history, bookings summary, invoice risk, and audit history.
- Suspend/reactivate actions require a reason and confirmation.
- Prevent admins from suspending themselves or removing the last active super admin.
- Do not allow casual direct editing of immutable legal identity fields; route changes through verification.

#### 8.24 Hotel ownership claims — `/admin/claims`

- Queue for providers claiming a seeded/unowned hotel listing.
- Compare claimant legal profile, claimed hotel, submitted evidence, matching signals, and conflicts.
- Approve transfers ownership without duplicating the hotel.
- Reject requires a reason.
- Detect existing ownership/duplicate claims and block unsafe decisions.
- Notify claimant and record audit history.

#### 8.25 Admin monthly invoices — `/admin/invoices`

- Generate previous-month invoices manually and through scheduled execution.
- Generation must be idempotent; repeated execution cannot duplicate invoices or items.
- Filters by period, hotel, status, due date, amount, and visibility state.
- Summary totals for issued, paid, grace, overdue, and platform commission.
- Invoice detail with booking line items and generated PDF.
- Mark settlement paid only with payment reference, verified receipt when required, admin identity, and timestamp.
- Manual visibility override requires a reason and audit entry.
- Reactivate eligible hotel visibility immediately after verified settlement.

#### 8.26 Audit log explorer — `/admin/audit-logs`

- Immutable chronological events for verification, booking, payment, receipt, invoice, visibility, user status, claim, settings, document, and admin actions.
- Filters by actor, action, target type, target ID, date, and outcome.
- Detail drawer displays timestamp, actor, action, target, safe metadata diff, request/correlation ID, and IP/user-agent only when legally and operationally appropriate.
- Redact tokens, passwords, full bank numbers, and private document URLs.
- Export filtered logs to CSV; large exports run asynchronously.

#### 8.27 Notifications — `/notifications`

- Unread/read groups, type filters, timestamps, mark one/all read, and pagination.
- Notification types include booking request, booking rejected, payment window opened, receipt submitted, receipt approved/rejected, payment received, online confirmed, booking expired, refund required, account approved/rejected, document replacement requested, invoice issued/due/overdue/paid, property hidden/restored, and claim decision.
- Clicking a notification routes to the authorized target screen and marks it read.
- Realtime updates where supported, with polling/retry fallback.
- Do not expose sensitive receipt or bank information inside notification bodies.

#### 8.28 Profile — `/profile`

- Avatar/logo upload with safe file handling.
- Representative display name, non-sensitive business display name, phone, language, and contact preferences.
- Show immutable role, account status, legal name, verification status, and verification date.
- Sensitive legal changes use a re-verification request, not direct profile editing.
- Save success/error handling and unsaved-changes protection.

#### 8.29 Settings — `/settings`

Shared settings:

- Language and RTL direction.
- Email/in-app notification preferences by category.
- Password change, active sessions, sign out other sessions, and account security.
- Privacy and data request links.

Role-specific settings:

- Hotel payment window and permitted operational preferences, within admin policy.
- Agency default search/booking preferences where useful.
- Admin-only platform configuration for commission rate, default payment window, invoice due day/grace rules, support contacts, and payment beneficiary instructions. Sensitive changes require confirmation and audit logs.

#### 8.30 Not found, forbidden, error, and maintenance states

- 404 screen with Travex identity, clear message, Back, and role-aware Home/Workspace action.
- 403 screen for authenticated but unauthorized access.
- Root application error boundary with retry and support reference.
- Network/offline state that preserves unsent form data where safe.
- Maintenance/unavailable state when backend health fails.
- Branded route-loading fallback that cannot remain indefinitely.

### 9. Booking and financial state machines

Use explicit server-controlled transitions. Reject invalid transitions and record critical ones.

#### 9.1 Online booking

`draft → pending_online_payment → confirmed → completed`

Failure branches:

- `pending_online_payment → payment_failed`
- `pending_online_payment → cancelled`
- `pending_online_payment → refund_required → refunded`
- Expired checkout releases provisional resources.

#### 9.2 Offline booking

`draft → inventory_held → awaiting_receipt_upload → awaiting_admin_payment_verification → confirmed → completed`

Failure/resolution branches:

- `awaiting_receipt_upload → expired` and atomically release stock.
- `awaiting_admin_payment_verification → receipt_rejected → awaiting_receipt_upload` only while a valid deadline/resubmission extension exists.
- `awaiting_admin_payment_verification → cancelled` only through an authorized, audited resolution that releases stock.

#### 9.3 Inventory guarantees

- Availability is date-range aware, not a single global counter.
- Holds and confirmed allocations must be created transactionally with row locking or an equivalent concurrency-safe database function.
- A failed payment, cancelled booking, expired deadline, or released manual block returns exactly the allocated quantity—never more than physical stock.
- Checkout completion automatically releases occupied inventory after the relevant stay end while preserving historical records.

#### 9.4 Commission invoices and suspension

1. Confirmed/completed bookings generate immutable commission ledger entries at 5% of booking gross value.
2. At month end, aggregate uninvoiced entries by hotel into one monthly invoice with line items.
3. Invoice becomes `issued` with due date and a full-month grace policy defined in configuration.
4. If unpaid after grace, mark `overdue`, set the hotel to `hidden_overdue`, block new bookings, and notify hotel/admin.
5. Existing confirmed stays remain accessible and operational.
6. After admin verifies settlement, set invoice `paid`, store reference/receipt/reviewer, and restore eligible hotel visibility.

Scheduled jobs must be timezone-aware, observable, retry-safe, and idempotent.

### 10. PDF and document requirements

Generate PDFs server-side from versioned templates. Store them privately, expose short-lived signed URLs to authorized users, and regenerate only through an explicit versioned action.

#### 10.1 Booking voucher PDF

- Travex lockup, “Booking Voucher,” unique reference, issue date, and QR/verification identifier where a verification endpoint exists.
- Agency legal name and contact.
- Hotel legal/display name, address, and contact.
- Stay dates, nights, room type, quantity, occupancy, included services, and payment status.
- Total DZD and payment method.
- Important hotel/cancellation instructions and Travex support details.
- A4 layout, print-safe margins, selectable text, English/French/Arabic glyph support, and no clipped RTL content.

#### 10.2 Agency booking receipt/statement PDF

- Document type must be legally accurate: receipt, booking statement, or invoice only when appropriate.
- Booking/payment references, parties, itemized amount, paid date/status, and method.
- Never claim Travex received offline hotel funds when the agency paid the hotel directly.

#### 10.3 Hotel monthly commission invoice PDF

- Unique sequential invoice number.
- Travex configured legal identity and settlement details.
- Hotel legal identity and verified address/tax identifiers.
- Billing month, issue date, due date, status, and currency.
- Line items: booking reference/date, booking gross, commission rate, commission amount.
- Totals and settlement instructions.
- Grace/overdue notice and support contact.
- Preserve the exact underlying line-item snapshot even if profiles later change.

#### 10.4 Uploaded documents

- Business verification documents, offline payment receipts, ownership proofs, and settlement receipts are inputs, not public media.
- Keep private; use signed access and authorization on every view.
- Retain original, validated MIME, checksum, upload/version history, and review decision.
- Provide clear viewer failure and unsupported-file states.

### 11. Data and backend requirements

At minimum, support normalized records for:

- Profiles and roles.
- Business verification applications and versioned documents.
- Hotels, hotel payment settings, verified beneficiary snapshots, amenities, photos, coordinates, and visibility history.
- Room types, room media, physical stock, manual blocks, booking holds, and confirmed allocations.
- Bookings and immutable price/property/room snapshots.
- Online payments, provider events, refunds, and idempotency keys.
- Offline receipts and review versions.
- Commission ledger entries.
- Monthly invoices and invoice items.
- Generated documents and signed-access metadata.
- Hotel ownership claims.
- Notifications.
- Audit logs.
- Configurable platform settings and scheduled-job executions.

Use database constraints, foreign keys, unique/idempotency keys, indexes, transactions, and row-level security. Client code must not be able to update protected role, verification, commission, invoice, payment, ownership, or audit fields directly.

### 12. Security and privacy

- Enforce RBAC, ownership, account status, and hotel visibility in server procedures and database policies.
- Private storage buckets for legal documents, receipts, invoices, and vouchers.
- Validate extension, MIME signature, size, and page/image limits; sanitize filenames; add a malware scanning integration point.
- Use short-lived signed URLs and prevent URL leakage in analytics/logs.
- Rate-limit login, registration, uploads, searches, and mutation endpoints appropriately.
- Use CSRF-safe auth/session patterns, secure cookies where applicable, and webhook signature verification.
- Mask bank/CCP/RIB data except to authorized users inside the necessary transaction context.
- Log security-relevant decisions without logging secrets or complete financial credentials.
- Require confirmation and a written reason for destructive/admin actions.
- Ensure production error messages do not leak database or provider internals.

### 13. Localization and content quality

- Every user-facing string must use the i18n system; no mixed hard-coded English on French/Arabic screens.
- Provide complete French, English, and Arabic translations for navigation, forms, validation, statuses, notifications, PDFs, emails, and error states.
- Set `dir="rtl"` for Arabic and mirror layout-sensitive spacing/icons without mirroring the Travex logo.
- Format DZD consistently and avoid ambiguous decimal/group separators.
- Display both relative and exact timestamps where deadlines matter.
- Correct grammar and spelling. Do not preserve errors from the original PDF wording.
- Do not invent hotel partners, testimonials, contact details, or legal claims.

### 14. Responsive and accessibility requirements

Verify at minimum:

- Mobile: 360×800 and 390×844.
- Tablet: 768×1024.
- Desktop: 1280×800 and 1440×900.
- Wide desktop: 1920×1080.

Accessibility:

- Semantic landmarks and heading order.
- Keyboard access for all actions, menus, tabs, calendars, dialogs, sheets, tables, maps, and uploaders.
- Visible focus rings and logical focus restoration.
- Proper labels, descriptions, errors, and live regions.
- Focus trapping in modal UI and Escape-to-close when safe.
- Sufficient color contrast and non-color status cues.
- Alt text or decorative empty alt as appropriate.
- Reduced-motion support.
- Touch targets around 44px where practical.

### 15. Emails and operational notifications

Create real template-backed notifications for:

- Registration submitted.
- Document replacement requested.
- Account approved/rejected/suspended/reactivated.
- Booking created/held/rejected/confirmed/expired/cancelled.
- Offline receipt submitted/approved/rejected.
- Online payment succeeded/failed/refund required/refunded.
- Invoice issued, approaching due date, overdue, paid.
- Hotel hidden/restored.
- Claim approved/rejected.

Email links must target the correct authorized route. Avoid sensitive financial/document data in email bodies.

### 16. Testing requirements

Add and pass tests proportional to the financial and inventory risk.

Unit tests:

- Date/night and DZD calculations.
- 5% commission and rounding.
- Status transition guards.
- Deadline/grace calculations in `Africa/Algiers`.
- PDF formatting helpers and permission decisions.

Database/integration tests:

- Concurrent inventory hold prevents overselling.
- Expiry releases the correct quantity once.
- Webhook idempotency prevents duplicate confirmation/commission.
- Receipt approval creates one confirmation and one commission entry.
- Invoice generation is idempotent and links each commission once.
- Overdue enforcement hides and verified settlement restores a hotel.
- RLS prevents cross-agency, cross-hotel, and non-admin access.

End-to-end tests:

1. Agency registers, uploads documents, waits, admin approves, and access changes correctly.
2. Hotel registers, configures property/payment settings, creates rooms, and becomes visible only after approval.
3. Agency searches, books online in sandbox, receives confirmation and voucher.
4. Agency books offline, sees countdown, uploads receipt, admin approves, and voucher/commission appear.
5. Offline deadline expires and inventory returns to search.
6. Monthly invoice is issued, becomes overdue, hotel disappears, admin verifies settlement, and hotel returns.
7. Arabic RTL navigation, form, table/card, and PDF smoke test.

Quality gate:

- TypeScript check passes.
- Lint passes.
- Unit/integration/E2E tests pass.
- Production build passes without circular chunk or oversized initial-bundle regressions.
- `git diff --check` passes.
- Browser console and network panels contain no unexplained errors on core flows.

### 17. Implementation sequence

Use this order so the product remains testable:

1. Audit routes, schema, storage, auth, existing UI, and feature gaps.
2. Finalize states, migrations, RLS, storage policies, and server procedures.
3. Complete shared design system, shell, localization, and accessibility foundations.
4. Complete registration and verification.
5. Complete hotel property, room, media, payment, and calendar management.
6. Complete marketplace, hotel detail, and concurrency-safe inventory.
7. Complete online and offline booking/payment flows.
8. Complete agency and hotel operational dashboards.
9. Complete admin queues, invoices, enforcement, and audit logs.
10. Complete PDFs, notifications, scheduled jobs, and recovery paths.
11. Run automated tests and responsive/RTL visual verification.
12. Fix every regression and provide a concise implementation report.

### 18. Final handoff format

When implementation is genuinely complete, report:

- What was implemented, grouped by public, agency, hotel, admin, payments, documents/PDFs, and platform foundations.
- Database migrations and required scheduled jobs.
- Required environment variables without exposing values.
- Tests/checks executed and their results.
- Any remaining blocker that depends on unavailable external credentials, with the completed sandbox behavior and exact activation step.
- Direct links to the key local files.

Do not claim completion for unimplemented features. Do not replace missing work with a new plan or prompt. Continue until the repository satisfies the definition of done or a genuine external-credential/legal-policy blocker is precisely documented.

## END IMPLEMENTATION PROMPT
