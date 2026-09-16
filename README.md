# Kawa (KabadiWala) — Phase 1

A three-sided scrap-collection marketplace (Customer → Kabadiwala → Officer),
built with Expo/React Native + Supabase. Zero paid subscriptions anywhere in
this stack — see the cost notes at the bottom.

This is **Phase 1**: role selection, signup/login, customer "Add Scrap",
kabadiwala nearby-listings + booking, and marking a pickup collected. Officer
role, ratings, and push notifications are stubbed for Phase 2/3.

## One deviation from the original brief, worth knowing up front

The brief asked for `react-native-maps` with OpenStreetMap tiles so there'd
be no Google Maps API key needed. In practice `react-native-maps` renders its
base map through the **Google Maps SDK on Android no matter what tiles you
overlay** — so that combination still needs a Google Cloud API key (and a
billing-enabled account) on Android. To keep this genuinely zero-key on both
platforms, the map screen (`components/LeafletMap.tsx`) instead renders
OpenStreetMap through **Leaflet.js inside a WebView**. Same open map data,
no account, no key, works identically on iOS and Android.

## Prerequisites (all free)

1. **Node.js 22.13+** — check with `node -v`.
2. **Git**
3. A code editor (VS Code or similar)
4. **Docker Desktop** — only if you want to run Supabase fully locally
   (free for individual/student use). Optional — you can use the hosted
   free tier instead, see below.
5. **Expo Go** app on your Android/iOS phone (from the Play Store / App
   Store) — for instant testing without a native build. Note: because this
   project uses a WebView (for the map) and the camera, plain Expo Go
   works for every Phase-1 screen — you do **not** need a custom dev build
   for this phase.
6. **Java JDK 17** + **Android Studio** — only needed if you want an Android
   emulator instead of testing on your own phone.

## 1. Install dependencies

```bash
cd kawa-app
npm install

# Expo will have opinions about exact package versions for SDK 57 —
# this corrects any of mine that drift from what Expo actually ships:
npx expo install --fix
```

## 2. Set up Supabase

Pick **one** of these two options.

### Option A — Hosted free tier (simplest)

1. Create a free account/project at [supabase.com](https://supabase.com)
   (no card required for the free tier).
2. In your project's **SQL Editor**, paste the entire contents of
   `supabase/schema.sql` and run it. This creates every table, enables
   PostGIS, sets up Row Level Security policies, creates the
   `listing-photos` storage bucket, and creates the `get_nearby_listings`
   function used by the kabadiwala dashboard.
3. Go to **Authentication → Providers → Email** and **turn off "Confirm
   email"** for development (otherwise every signup needs an email click
   before the user can log in — fine for production, annoying while
   testing on a phone with no easy inbox access).
4. Go to **Project Settings → API** and copy your **Project URL** and
   **anon public key**.
5. Copy `.env.example` to `.env` and paste those two values in.

### Option B — Fully local (zero account, needs Docker)

```bash
npm install -g supabase
supabase init      # if not already initialized
supabase start     # spins up Postgres + Auth + Storage in Docker
```

This prints a local API URL and anon key — put those in `.env` instead.
Then apply the schema:

```bash
supabase db execute -f supabase/schema.sql
```

(Local Supabase auth has email confirmation off by default, so you can
skip that step in this option.)

## 3. Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Or press
`a` for an Android emulator / `i` for the iOS simulator if you have one set
up.

## What to test, screen by screen

1. **Role select → Signup** — create one **customer** account and, in a
   second Expo Go session (or after logging out), one **kabadiwala**
   account. (Tapping "Officer" should show a "coming soon" screen — that's
   expected, it's Phase 2.)
2. **Language select → Permissions** — pick a language, tap "Allow all",
   confirm the OS permission dialogs appear for camera/mic/photos/location.
3. **Customer → Add Scrap** — take a photo, pick a category + sub-category,
   enter a quantity, tap "Add another item" to add a second one, then
   "Submit listing(s)". Confirm both show up on the customer dashboard as
   "Waiting for a kabadiwala".
4. **Kabadiwala dashboard** — confirm the listing(s) you just created show
   up on the map and in the list below it, sorted nearest-first, with a
   distance in km. Tap "Book this pickup".
5. **Booking detail (kabadiwala side)** — enter an agreed price, tap "Mark
   as collected".
6. **Customer dashboard** — confirm the listing now shows "Collected", and
   opening it shows the same agreed price.
7. In the Supabase Table Editor, confirm a new row appeared in
   `transactions` with both user ids, the category, and the price.

If something in that chain breaks, that's the exact screen/step to tell me
about.

## Cost reality check

| Piece | Free tier | The one thing to watch |
|---|---|---|
| Expo / React Native | Open source, no limits | — |
| Supabase hosted | 500MB DB, 1GB storage, 50k MAUs | Free projects pause after 7 days idle — just restore from the dashboard |
| Supabase local (Docker) | Unlimited | Needs Docker Desktop installed |
| OpenStreetMap tiles | Free, no signup | Fair-use policy at heavy production traffic — not a concern at this scale |
| EAS Build | 30 builds/month | `eas build --local` is unlimited if you exceed that |
| Google Play listing | — | $25 one-time — only if you publish |
| Apple Developer Program | — | $99/year — only if you install on a real iPhone or publish |

Building and testing this end-to-end (including on your own Android phone)
costs nothing. The two costs above only apply at publishing time.


# Kawa Phase 2 + 3

## What was added

### Phase 2
- Officer signup with private identity-document upload.
- Pending / approved / rejected officer verification state.
- Officer dashboard and filterable collection records.
- Kabadiwala → Officer handover flow with officer contact revealed only after the handover is recorded.
- Customer matched-Kabadiwala contact card after booking.
- Customer rating + feedback after collection.
- Rating summary shown on the matched Kabadiwala card.
- Hardened transaction insert rules so users cannot create arbitrary ledger rows.

### Phase 3
- Expo push-token registration (best effort, no paid notification provider).
- Push events for booking and collection changes, plus Kabadiwala → Officer handovers.
- Basic 90-day material price trend view.
- Pull-to-refresh on role dashboards and records/trend screens.
- Loading, empty and retry/error handling.

## Supabase migration

Your Phase 1 schema is already present, so run:

`supabase/phase2_3.sql`

once in the Supabase SQL Editor.

For officer approval, use Supabase Table Editor:
1. Find `profiles`.
2. Set the officer's `verified` to `true`.
3. Set the latest `officer_verifications.status` to `approved`.
4. Optionally set `reviewed_at` to the current time.

The app reads `profiles.verified` as the final access gate.

## Notifications

Notifications stay subscription-free. The app stores the Expo push token in `profiles.push_token` and sends through Expo's push endpoint.

A configured EAS project ID is required for remote Expo push-token registration. Run `eas build:configure` / `eas init` when you are ready for a development or production build.

Remote push testing should be done on a real device/dev build rather than relying on the Phase 1 Expo Go workflow.

## Phase 2 test order

1. Create an Officer account and upload one or more ID images.
2. Confirm the account stops at the pending screen.
3. In Supabase, approve the officer.
4. Log back in and confirm the Officer dashboard opens.
5. Create/use a Kabadiwala account and open "Sell to Officer".
6. Select the approved officer, material, quantity and price.
7. Confirm the transaction appears in the Officer records.
8. Open a completed customer booking and submit a rating.
9. Confirm the customer sees the Kabadiwala rating/contact only after the match exists.

## Phase 3 test order

1. Pull-to-refresh the dashboards and records screens.
2. Add several Officer handovers and open Price Trends.
3. Configure an EAS project and install a development build.
4. Sign in on a physical device and grant notification permission.
5. Trigger a booking / collection / officer handover from another account and verify the notification.

## Important MVP notes

- Officer discovery is currently a simple approved-officer list; distance sorting is not used because the officer role does not require a stored location in the original data model.
- Profile rows are readable to authenticated users because Phase 1 needs basic matching/contact data. The UI only reveals phone numbers after a booking/handover match; a production deployment should move this contact check behind a dedicated security-definer RPC/view.
