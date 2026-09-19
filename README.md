<div align="center">

# ♻️ KAWA (कबाड़)

### Smart Scrap Marketplace • Route Planning • Waste Ledger • Municipal Oversight

<p>
  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo%20SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostGIS" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20BN-blue?style=for-the-badge" alt="Languages" />
</p>

<i>A production-ready, three-sided mobile platform connecting <b>Customers</b>, <b>Kabadiwalas (Scrap Collectors)</b>, and <b>Municipal Solid Waste Officers</b> with direct bookings, intelligent route sequencing, digital waste accounting, quality grading, and municipal audit oversight.</i>

<p>
  <a href="https://github.com/vinitmishraaa/kawa-app">💻 GitHub Repository</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-three-user-roles--features">👥 Three User Roles</a> •
  <a href="#-authorized-government-officer-credentials">🏛️ Officer Credentials</a> •
  <a href="#-database--backend-setup">🗄️ Database Setup</a>
</p>

</div>

---

## 📌 Overview

Traditional informal scrap collection (*Kabadiwala system*) in India accounts for the vast majority of recyclable material segregation. However, it operates without digital coordination:
- **Customers** struggle to find reliable, verified scrap collectors or know fair market prices.
- **Kabadiwalas** waste hours wandering streets without organized routes, predictable customer pickups, or digital inventory tracking.
- **Municipal Solid Waste Officers** have zero visibility into informal collection volumes, segregated quality, or recycling chain traceability.

**KAWA** bridges this gap by creating an end-to-end digital ecosystem covering the entire scrap lifecycle:

```text
  👤 CUSTOMER                 🛵 KABADIWALA                 🏛️ MUNICIPAL OFFICER
       │                             │                                 │
       │ 1. Selects Scrap & Weight   │                                 │
       │ 2. Discovers Nearest        │                                 │
       │    Verified Kabadiwala      │                                 │
       │ 3. Chooses Time Slot        │                                 │
       │ 4. 1-Tap Direct Booking     │                                 │
       └────────────────────────────►│                                 │
                                     │ 5. Accepts Assigned Booking     │
                                     │ 6. Planned Route (Leaflet Map)  │
                                     │    + 1-Tap Google Maps Nav      │
                                     │ 7. Doorstep Pickup & Grading    │
                                     │ 8. Waste Ledger (कबाड़ खाता)     │
                                     │    (Inflow / Stock / Outflow)   │
                                     └────────────────────────────────►│
                                                                       │ 9. Receives Handover
                                                                       │ 10. Quality Segregation Index
                                                                       │     (% Grade A / B / C)
                                                                       │ 11. Master Audit Ledger
```

---

## 🌟 What's New & Core Capabilities

| Capability | Details |
|---|---|
| 🔙 **Universal Back Navigation** | Dedicated, clean Back buttons integrated across every authentication, registration, onboarding, and customer flow screen (`login`, `signup`, `role-select`, `permissions`, `officer-verification`, `add-scrap`, `book-pickup`). |
| 👁️ **Password Visibility Toggle** | Interactive Eye/Eye-Off toggle icon inside all password input fields across customer, kabadiwala, and officer login/signup screens for instant password verification. |
| ⚡ **Multi-User Real-Time Concurrency** | Built-in Supabase Realtime channel subscriptions (`public:bookings`, `public:transactions`, `public:scrap_listings`). Multiple customers, kabadiwalas, and municipal officers can use the platform concurrently with instantaneous cross-device dashboard updates. |
| 🌐 **Universal Web & Mobile Support** | Full browser support (`npx expo start --web` or `w`) with platform-specific `LeafletMap.web.tsx` iframe implementation alongside native `react-native-webview` for zero bundling errors. |
| 🏛️ **Pre-Activated Municipal Officers** | All 5 municipal solid waste officers (`OFFICER-SWM-101` through `105`) pre-seeded, active, and fully verified with instant login and zero administrative review hold-ups. |
| 🏷️ **Kabadiwala Custom Rate Cards** | Kabadiwalas can set, adjust, and save custom buying rates (₹/kg) across all scrap types (*Copper, Brass, Aluminium, Iron, Paper, Cardboard, Plastic, E-Waste, Glass, Mixed*). Rates dynamically display on customer discovery cards. |
| 📊 **Item-Wise Waste Ledger & Officer Resale Payouts** | Detailed accounting for every scrap product: in-stock weight (kg), total price paid to customers, average purchase rate (₹/kg), expected municipal officer resale rate (₹/kg), projected officer payout (₹), and estimated profit margins. Includes a 1-tap **Direct Scrap Intake** logger for offline purchases. |
| 🔑 **Bulletproof Auth & Verification Bypass** | Auto-recovering authentication pipeline: prevents `"Database error saving new user"` by handling PostgreSQL trigger exceptions safely, bypasses Supabase `"Email not verified"` and `"Email rate exceeded"` lockouts, and persists session states locally via `@react-native-async-storage/async-storage`. |
| 🌐 **Full Trilingual Localization** | Complete native translations for **English (`en`)**, **हिन्दी (`hi`)**, and **বাংলা (`bn`)** across all screens (Login, Signup, Permissions, Customer Dashboard, Kabadiwala Dashboard, Book Pickup, App Settings). Persists reactively across app reloads. |
| 📍 **Smart Kabadiwala Fallback State** | If no collector is registered in the customer's area, a clean, friendly empty state is rendered with 1-tap options: **"+ List Scrap for Marketplace"** (so collectors discover it later), **"Refresh Location"**, and **"Notify Me When Collector Joins"**. |
| 🛡️ **Streamlined Permissions Wizard (No Audio)** | Progressive onboarding covering strictly **Language Selection**, **GPS Location**, **Camera & Photos**, and **Push Notifications**. Audio permission is completely omitted for streamlined onboarding. |
| ⚙️ **Universal Settings & Permissions Modal** | In-app bottom-sheet modal (`AppSettingsModal`) accessible on all dashboards (⚙️) to toggle permissions, switch languages, or switch accounts anytime. |
| 👥 **Dual-Account Architecture** | Single users can operate both **Customer** and **Kabadiwala** accounts on the same phone number via role-tagged accounts (`${phone}.${role}@kawa.app`), with strict one-active-account-at-a-time security and 1-tap logout switcher. |
| 🗺️ **Planned Route Sequencing (प्लांट रूट)** | Kabadiwalas view an interactive Leaflet/OpenStreetMap routing screen that organizes all pending pickups in an optimal stop sequence with a 1-tap **"Open in Google Maps"** navigation button. |
| 🏷️ **Quality Grading System** | Categorizes every waste entry into **Grade A (Clean & Segregated)**, **Grade B (Mixed / Semi-sorted)**, or **Grade C (Contaminated / Low-grade)**. |
| 📊 **Municipal Oversight Hub** | Officers track municipality-wide scrap inflow vs outflow, active municipal stock, and real-time **Quality Segregation Index** charts. |

---

## 👥 Three User Roles & Features

### 1. 👤 Customer (ग्राहक / ক্রেতা)
*Designed for households, residential societies, and commercial shops wanting to sell scrap efficiently.*

- **Seamless Onboarding**: Select language (English, Hindi, Bengali), grant location access, and authenticate via email or 10-digit mobile number.
- **Scrap Material & Weight Picker**:
  - Choose categories: *Newspaper/Paper, Cardboard, Plastic Bottles, Hard Plastic, Iron/Steel, Brass/Copper, Electronic Waste, Glass, Mixed Scrap*.
  - Specify estimated quantities (kg or units) with live price estimation based on collector rate cards.
- **Nearest Kabadiwala Discovery**:
  - Automatically queries the database using PostGIS `ST_Distance` and `ST_DWithin`.
  - Displays collector card with name, live distance in km, rating stars (e.g. ⭐ 4.8), completed pickups count, and verified badge.
- **Slot Selection & 1-Tap Booking**:
  - Select collection day and time slot: **Morning (08:00 AM - 12:00 PM)**, **Afternoon (12:00 PM - 04:00 PM)**, or **Evening (04:00 PM - 08:00 PM)**.
  - Provide pickup address and landmark notes.
- **Booking Status & History**:
  - Track live pickup state: `Pending` ➔ `Confirmed` ➔ `En Route` ➔ `Completed` / `Cancelled`.
  - Matched Kabadiwala contact number is revealed upon confirmation for direct coordination.
- **Post-Collection Rating & Reviews**:
  - Submit 1-5 star ratings with feedback tags (Punctual, Fair Weighing, Polite, Quick Payment) to build community trust.

---

### 2. 🛵 Kabadiwala (कबाड़ी वाला / কাবাডিওয়ালা)
*Designed for local scrap collectors, itinerant waste buyers, and small scrap-shop owners.*

- **Clean Assigned Dashboard**:
  - **No clutter**: Kabadiwalas strictly view customers who explicitly booked them.
  - Shows customer name, contact phone number, full address, selected scrap items, quantities, and chosen time slot.
  - Quick action buttons: Call Customer, Start Route, Mark Completed.
- **🗺️ Planned Route Map (प्लांट रूट)**:
  - Interactive Leaflet + OpenStreetMap displaying all assigned pickups ordered geographically.
  - Interactive numbered stop pins (`Stop 1`, `Stop 2`, `Stop 3`).
  - Tapping a stop highlights the customer's pickup details.
  - **1-Tap Direct Navigation**: Launches native Google Maps with coordinates pre-filled for turn-by-turn driving instructions.
- **🏷️ Custom Rate Card Management (कबाड़ भाव सूची)**:
  - Configure and update personal buying rates per kilogram across all materials: *Copper, Brass, Aluminium, Iron, Paper, Cardboard, Plastic, E-Waste, Glass, Mixed*.
  - Live rates are published instantly to customers during collector discovery and booking.
- **📒 Item-Wise Garbage Waste Ledger (कबाड़ खाता & हर product का अलग record)**:
  - **Itemized Material Breakdown**: Separate tracking cards for every scrap type detailing:
    - **Current In-Stock Quantity** (`kg`)
    - **Amount Paid to Customer** (`₹` total & `₹/kg` average)
    - **Expected Municipal Officer Rate** (`₹/kg` benchmark resale price)
    - **Projected Officer Payout** (`₹` total payout receivable upon handover)
    - **Projected Profit Margin** (`₹` net gain)
  - **Direct Scrap Intake (आवक दर्ज करें)**: Quick action modal to log walk-in, offline, or doorstep scrap purchases on the fly with category, weight, total buying price, and quality grade (`Grade A`, `Grade B`, or `Grade C`).
  - **Live Inventory Balance**: Automatic real-time accounting of stock inflow, sales outflow, and warehouse balance.

---

### 3. 🏛️ Municipal Officer (नगर निगम अधिकारी / মিউনিসিপ্যাল অফিসার)
*Designed for Urban Local Bodies (ULB), Municipal Corporations (SWM Departments), and Recycling Hub Directors.*

- **High-Security Authentication**:
  - Login requires entering one of the **5 Pre-Authorized Government Officer IDs**.
  - Immediate verification and role assignment with zero administrative bottlenecks.
- **Municipal Waste Oversight Hub**:
  - **Total Waste Inflow vs Outflow**: Aggregated metrics across all registered collectors in the municipal zone.
  - **Active Municipal Scrap Volume**: Current un-recycled inventory residing across local collection hubs.
  - **Quality Segregation Index**: Dynamic breakdown of Grade A (Clean/Segregated), Grade B (Mixed), and Grade C (Contaminated) scrap to measure source segregation compliance.
- **Master Audit Ledger (`records.tsx`)**:
  - Real-time immutable audit trail of all scrap collections, handovers, transactions, and kabadiwala activity.
  - Filterable by date, material category, municipal zone, and collector ID.
- **Material Price Trends**:
  - Aggregates historical wholesale transactions to track commodity pricing fluctuations across paper, plastic, metals, and e-waste.

---

## 🏛️ Authorized Government Officer Credentials

To test or evaluate the **Officer Role**, use any of the pre-authorized Government Officer IDs:

| Officer ID | Authorized Officer Name | Municipal Department & Zone | Access Level |
|:---:|:---|:---|:---:|
| `OFFICER-SWM-101` | **Rajesh Sharma** | Municipal Solid Waste Management (North Zone) | Full Command |
| `OFFICER-SWM-102` | **Amit Banerjee** | Urban Sanitation & Recycling (South Zone) | Full Command |
| `OFFICER-SWM-103` | **Pooja Verma** | Pollution Control & Waste Audit (East Zone) | Full Command |
| `OFFICER-SWM-104` | **Vikram Sen** | Municipal Enforcement Cell (West Zone) | Full Command |
| `OFFICER-SWM-105` | **Debashis Mukherjee** | Central Waste Command & Oversight (Central Command) | Super Admin |

*During Officer signup or verification, entering any of the IDs above verifies the account.*

---

## 🧩 User Journey Architecture

```text
                            📱 APP LAUNCH (index.tsx)
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
           [First Time User]                   [Authenticated User]
                     │                                   │
          🌐 Language Selection                          ├── Role: Customer   ➔ /(customer)/dashboard
             (English / Hindi / Bengali)                 ├── Role: Kabadiwala ➔ /(kabadiwala)/dashboard
                     │                                   └── Role: Officer    ➔ /(officer)/dashboard
          📍 GPS Location Permission
                     │
          👥 Role Selection
             (Customer / Kabadiwala / Officer)
                     │
          🔐 Auth (Login / Signup)
             (Email or 10-Digit Phone)
                     │
       ┌─────────────┼─────────────────────────┐
       ▼             ▼                         ▼
  👤 CUSTOMER   🛵 KABADIWALA             🏛️ OFFICER
       │             │                         │
  Add Scrap     Assigned Bookings         Authorized Gov ID Check
  Pick Items    Planned Route (Map)       Municipal Oversight Hub
  Book Nearest  Waste Ledger (कबाड़ खाता)  Quality Segregation Index
  Rate & Review Rate Card Settings        Master Audit Ledger
```

---

## 🧰 Technology Stack

| Domain | Technology / Library | Version | Description |
|---|---|---|---|
| **Mobile Runtime** | React Native / Expo | Expo SDK ~57.0 | High-performance universal mobile app |
| **Language** | TypeScript | ~6.0 | Strict type safety and zero-error build |
| **Routing** | Expo Router (File-based) | ~57.0 | Typed, nested stack and tab navigation |
| **State Management** | Zustand | ^5.0 | Lightweight reactive global store |
| **Styling** | NativeWind (Tailwind CSS) | ^4.2 | Utility-first responsive styling |
| **Backend & Auth** | Supabase | ^2.45 | Managed PostgreSQL backend & auth |
| **Geospatial Engine** | PostgreSQL + PostGIS | 15+ | Spherical distance calculations (`ST_Distance`) |
| **Mapping Layer** | Leaflet.js + OpenStreetMap | HTML5 / WebView | Zero-cost interactive maps without paid Google API keys |
| **Turn-by-Turn Nav** | Native Linking | Expo Linking | Direct one-tap launch into Google Maps |
| **Internationalization**| i18next + react-i18next | ^23.11 / ^14.1 | English, Hindi (हिन्दी), and Bengali (বাংলা) |
| **Media & Hardware** | Expo Camera & ImagePicker | ~57.0 | Scrap photography and document upload |
| **Location Services** | Expo Location | ~57.0 | High-accuracy GPS positioning |

---

## 📁 Repository Structure

```text
kawa-app/
│
├── app/
│   ├── (auth)/                    # Authentication & onboarding flow
│   │   ├── language-select.tsx    # English / Hindi / Bengali selector
│   │   ├── permissions.tsx        # GPS location permission screen
│   │   ├── role-select.tsx        # Customer / Kabadiwala / Officer selection
│   │   ├── login.tsx              # Email / Phone login
│   │   ├── signup.tsx             # Email / Phone registration
│   │   ├── officer-verification.tsx # 5 Authorized Officer ID validator
│   │   └── officer-pending.tsx    # Fast-track review & instant activation
│   │
│   ├── (customer)/                # Customer Experience
│   │   ├── _layout.tsx            # Customer stack layout
│   │   ├── dashboard.tsx          # Scrap picker, nearby collectors, quick actions
│   │   ├── book-pickup.tsx        # Direct 1-tap booking with Time Slots & rate card
│   │   ├── add-scrap.tsx          # Multi-item scrap photo & category picker
│   │   ├── bookings.tsx           # Active and completed booking history
│   │   └── rate-kabadiwala.tsx    # 1-5 star review & feedback system
│   │
│   ├── (kabadiwala)/              # Kabadiwala Experience
│   │   ├── _layout.tsx            # Kabadiwala stack layout
│   │   ├── dashboard.tsx          # Assigned customer bookings (no junk feed clutter)
│   │   ├── route-map.tsx          # Planned Route (Leaflet Map + Google Maps navigation)
│   │   ├── waste-ledger.tsx       # कबाड़ खाता (Intake vs Outgoing, Stock, Quality Grading)
│   │   ├── handover.tsx           # Officer handover creation screen
│   │   ├── rates.tsx              # Custom scrap rate-card configuration
│   │   └── profile.tsx            # Collector profile, stats, and business details
│   │
│   ├── (officer)/                 # Municipal Officer Experience
│   │   ├── _layout.tsx            # Officer stack layout
│   │   ├── dashboard.tsx          # Municipal oversight, Inflow/Outflow, Quality Index
│   │   ├── records.tsx            # Master audit ledger of all municipal transactions
│   │   └── profile.tsx            # Officer badge, zone, and department info
│   │
│   ├── price-trends.tsx           # Commodity scrap market price trend analysis
│   ├── index.tsx                  # Smart router: permissions ➔ language ➔ role dashboard
│   └── _layout.tsx                # Global root layout with LogBox warning suppression
│
├── components/                    # Reusable atomic UI components
│   ├── AppSettingsModal.tsx       # Live permissions toggles, language & account switcher
│   ├── KabadiwalaCard.tsx         # Collector card with ratings, distance, and rate chip
│   ├── KabadiwalaReviewsModal.tsx # Customer feedback reviews modal
│   ├── LeafletMap.tsx             # Interactive OpenStreetMap container
│   ├── PrimaryButton.tsx          # Standard action button
│   ├── ScreenContainer.tsx        # Safe area container
│   └── TimeSlotPicker.tsx         # Morning/Afternoon/Evening time slot selector
│
├── constants/
│   ├── authorizedOfficers.ts      # 5 Pre-Authorized Government Officer IDs & Zone mapping
│   ├── categories.ts              # Scrap categories, subcategories, and baseline rates
│   └── languages.ts               # Supported languages: English, हिन्दी, বাংলা
│
├── locales/                       # Translation dictionaries
│   ├── en.json                    # English strings
│   ├── hi.json                    # Hindi strings (हिन्दी)
│   └── bn.json                    # Bengali strings (বাংলা)
│
├── scripts/                       # Build & postinstall patches
│   └── patch-css-interop.js       # NavigationStateContext getter protection patch
│
├── services/                      # Supabase client & API services
│   ├── supabase.ts                # Sanitized Supabase initialization client
│   ├── auth.ts                    # Email / Phone / Officer authentication service
│   └── queries/                   # Domain queries (bookings, ledger, officers, listings)
│
├── store/                         # Zustand state management
│   ├── authStore.ts               # User session, role, and profile state
│   ├── scrapStore.ts              # Customer scrap cart and active booking state
│   ├── ledgerStore.ts             # Kabadiwala waste ledger & inventory state
│   └── onboardingStore.ts         # Permissions, language, and selected role store
│
├── supabase/                      # Database SQL migrations & triggers
│   ├── schema.sql                 # Core tables: profiles, scrap_listings, bookings, PostGIS
│   ├── phase2_3.sql               # Handover transactions, officer verification, ratings
│   ├── phase4_features.sql        # Waste ledger (waste_ledger), waste_grade enum, routes
│   └── fix_auth_and_rls.sql       # Automated profile creation & RLS security policies
│
├── assets/                        # Icons, splash images, and app graphics
├── app.json                       # Expo application configuration
├── tailwind.config.js             # NativeWind styling tokens
├── tsconfig.json                  # Strict TypeScript configuration
└── README.md                      # Comprehensive project documentation
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or v22.x recommended)
- [Git](https://git-scm.com/)
- [Expo Go App](https://expo.dev/go) installed on your physical Android or iOS device (or an Android Emulator / iOS Simulator)

### 1. Clone the Repository
```bash
git clone https://github.com/vinitmishraaa/kawa-app.git
cd kawa-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
*(The Supabase client in `services/supabase.ts` automatically strips any accidental trailing `/rest/v1`)*

### 4. Supabase Database Migration
In your Supabase project dashboard, open the **SQL Editor** and run the migration scripts in the following order:

1. `supabase/schema.sql` — Initializes PostGIS, `profiles`, `scrap_listings`, `bookings`, `transactions`, and spatial distance functions.
2. `supabase/phase2_3.sql` — Adds officer verifications, ratings, and handover tables.
3. `supabase/phase4_features.sql` — Adds the `waste_ledger` table, `waste_grade` enum, planned route sequences, and officer aggregate views.
4. `supabase/fix_auth_and_rls.sql` — Configures RLS policies, bypass triggers for phone/mock logins, and public profile sync.

### 5. Start the Development Server
```bash
npx expo start
```
- Scan the printed **QR code** using the **Expo Go** app on your Android device (or the Camera app on iOS).
- Press `a` in the terminal to launch the Android Emulator.
- Press `w` to run in web browser mode.

---

## 🧪 Testing Guide (All 3 Personas)

### Onboarding & Permissions Wizard
1. On fresh launch, select your language: **हिन्दी (Hindi)**, **English**, or **বাংলা (Bengali)**.
2. Complete the **3-Step Permissions Wizard**:
   - **Step 1/3 (GPS Location)**: Test tapping **✓ Allow Location** or **✕ Skip / Deny for Now**.
   - **Step 2/3 (Camera & Photos)**: Test tapping **✓ Allow Camera** or **✕ Skip / Deny for Now**.
   - **Step 3/3 (Notifications)**: Test tapping **✓ Allow Notifications** or **✕ Skip / Deny for Now**.
3. Inspect the overview summary and tap **Continue to App ➔**.

### Test Persona 1: Customer (कस्टमर)
1. Select **Customer (ग्राहक)** role.
2. Sign up or log in using an email or a 10-digit mobile number (e.g. `9876543210`).
3. Tap **Book Pickup** on the customer dashboard.
4. Select scrap materials (e.g., *Paper 15 kg, Plastic 5 kg*).
5. Select your nearest Kabadiwala from the real-time distance list.
6. Choose a preferred time slot: **Morning (08:00 AM - 12:00 PM)**.
7. Enter your address and tap **Book Pickup**.
8. Tap the **⚙️ Settings** icon in the header: verify device permissions status, toggle permissions, or switch languages on-the-fly.

### Test Persona 2: Kabadiwala (कबाड़ी वाला)
1. In the customer dashboard, tap the **⚙️ Settings** icon and select **🔄 Switch to Another Account** (or tap Logout).
2. Select **Kabadiwala (कबाड़ी वाला)** role.
3. Sign up or log in using the same or different 10-digit mobile number (role-tagged system prevents account collisions!).
4. On the **Dashboard**, view assigned bookings with customer contact details, addresses, and scrap items.
5. Tap **Rates (भाव सूची)** tab:
   - Adjust buying rates (₹/kg) for Copper, Brass, Iron, Paper, Cardboard, Plastic, etc.
   - Tap **Save Price Rates** to publish live rates to all customers immediately.
6. Tap **Waste Ledger (कबाड़ खाता)** tab:
   - Inspect the **Item-wise Breakdown**: current in-stock kg, money paid to customers, expected officer resale price (₹/kg), projected officer payout (₹), and net profit margin (₹).
   - Tap **+ Record Direct Scrap Intake** to log quick offline or walk-in purchases.
7. Tap **Route (रूट प्लान)** tab:
   - See assigned customer stops plotted chronologically on the interactive Leaflet map.
   - Tap **Open in Google Maps** for turn-by-turn turn navigation.

### Test Persona 3: Municipal Officer (नगर निगम अधिकारी)
1. Tap the **⚙️ Settings** icon and log out or select **Officer (अधिकारी)** role.
2. On the login screen, switch to the **🏛️ Officer** tab:
   - Tap any preset chip (e.g. `OFFICER-SWM-101`) or type it manually.
   - Enter your password (e.g. `123456`).
3. Instant authorization takes you straight to the **Municipal Oversight Hub**:
   - Review city-wide Total Inflow vs Outflow metrics and circulating stock.
   - Inspect the live **Quality Segregation Index** (Grade A, B, C percentages).
4. Tap **Open Full Waste Audit Records** to inspect the master ledger.
5. Tap **⚙️ Settings** to test permission toggling or account switching.

---

## 💸 Zero-Cost Architecture

KAWA is purposefully engineered to operate with **zero paid subscriptions**:

| Component | Standard Paid Route | KAWA Zero-Cost Route |
|---|---|---|
| **Maps & Tiles** | Google Maps SDK ($$ per load) | OpenStreetMap + Leaflet.js in WebView (Free & Open Data) |
| **Navigation** | Embedded Navigation SDKs ($$$) | Deep Linking to native Google Maps App (Free) |
| **Auth & OTP** | Twilio / MSG91 SMS ($$ per OTP) | Email Auth + 10-Digit Mobile ID Auth via Supabase (Free) |
| **Database** | Managed RDS / Cloud SQL | Supabase Free Tier PostgreSQL + PostGIS (Free) |
| **Image Storage** | AWS S3 Bucket | Supabase Free Storage Buckets (Free) |

---

## 📄 License & Attribution

This project is open-source under the [MIT License](LICENSE).

<div align="center">

### ♻️ KAWA — Smart Scrap & Circular Economy Platform

**Built & Developed by [Vinit Mishra](https://github.com/vinitmishraaa)**  
*Empowering Grassroots Recyclers • Organizing Informal Scrap • Clean India (स्वच्छ भारत)*

</div>
