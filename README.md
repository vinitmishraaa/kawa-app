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
| 🌐 **Trilingual Internationalization** | Full native support for **English (`en`)**, **हिन्दी (`hi`)**, and **বাংলা (`bn`)**. Dynamic locale switching with fallback support. |
| 📍 **GPS-First Onboarding** | First app launch initiates **Language Selection ➔ Location (GPS) Permission ➔ Role Selection ➔ Login/Signup**. |
| 📱 **Flexible Authentication** | Sign up and log in using either **Email + Password** or **10-Digit Mobile Phone Number** (or Google OAuth). No mandatory paid SMS OTP dependency. |
| 🛵 **Direct Nearest Kabadiwala Booking** | Customers pick materials, view nearby collectors sorted by real-time distance (PostGIS), inspect their star rating, past pickups, and custom rate cards, and book instantly. |
| ⏰ **Preferred Pickup Time Slots** | Customers choose convenient collection windows: **Morning (08:00 AM - 12:00 PM)**, **Afternoon (12:00 PM - 04:00 PM)**, or **Evening (04:00 PM - 08:00 PM)**. |
| 🗺️ **Planned Route Sequencing (प्लांट रूट)** | Kabadiwalas view an interactive Leaflet/OpenStreetMap routing screen that organizes all pending pickups in an optimal stop sequence with a 1-tap **"Open in Google Maps"** navigation button. |
| 📒 **Garbage Waste Ledger (कबाड़ खाता)** | Dual-entry scrap inventory tracker for Kabadiwalas: **Intake (आवक)** from customers, **Outgoing (निकास / बिक्री)** to recyclers, and live **Net Inventory (स्टॉक)**. |
| 🏷️ **Quality Grading System** | Categorizes every waste entry into **Grade A (Clean & Segregated)**, **Grade B (Mixed / Semi-sorted)**, or **Grade C (Contaminated / Low-grade)**. |
| 🏛️ **Municipal Officer Security Gate** | Enforces instant access control restricted to **5 Pre-Authorized Government Officer IDs** (`OFFICER-SWM-101` to `105`) mapped to municipal zones. |
| 📊 **Municipal Oversight Hub** | Officers track municipality-wide scrap inflow vs outflow, active municipal stock, and real-time **Quality Segregation Index** charts. |
| 🛡️ **Zero-Warning Clean UI** | Auto-filtered development alert pop-ups and full Supabase URL sanitation ensuring a clean user testing experience. |

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
- **📒 Garbage Waste Ledger (कबाड़ खाता)**:
  - **Intake Ledger (आवक)**: Records all collected scrap from app bookings and offline walk-ins with date, customer, category, weight (kg), buying price, and Quality Grade.
  - **Outgoing Ledger (निकास / बिक्री)**: Records all scrap sold to wholesale dealers, recycling factories, or Municipal Officers.
  - **Net Stock Balance**: Real-time calculated inventory showing current scrap held in warehouse by material category.
  - **Quality Grading**: Tag every batch as `Grade A`, `Grade B`, or `Grade C`.
- **Custom Rate Card Management**:
  - Configure purchasing price per kilogram for Paper, Plastic, Metal, E-Waste, Glass, etc.
  - Transparent pricing published directly on the customer discovery view.

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
├── components/                    # Reusable atomic UI components (Button, Input, Card, Modal)
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
├── services/                      # Supabase client & API services
│   ├── supabase.ts                # Sanitized Supabase initialization client
│   ├── auth.ts                    # Email / Phone authentication service
│   └── queries/                   # Domain queries (bookings, ledger, officers, listings)
│
├── store/                         # Zustand state management
│   ├── authStore.ts               # User session, role, and profile state
│   ├── scrapStore.ts              # Customer scrap cart and active booking state
│   └── ledgerStore.ts             # Kabadiwala waste ledger & inventory state
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

### Test Persona 1: Customer (कस्टमर)
1. Launch the app and select **हिन्दी (Hindi)** or **English** or **বাংলা (Bengali)**.
2. Grant Location permission.
3. Select **Customer (ग्राहक)** role.
4. Log in or sign up using your email or a 10-digit mobile number (e.g., `9876543210`).
5. Tap **Book Pickup** on the customer dashboard.
6. Select scrap materials (e.g., *Paper 15 kg, Plastic 5 kg*).
7. Select your nearest Kabadiwala from the real-time distance list.
8. Choose a preferred time slot: **Morning (08:00 AM - 12:00 PM)**.
9. Enter your address and tap **Book Pickup**.

### Test Persona 2: Kabadiwala (कबाड़ी वाला)
1. Switch account or log out from profile.
2. Select **Kabadiwala (कबाड़ी वाला)** role.
3. Log in using your email or 10-digit mobile number.
4. On the **Dashboard**, view the customer booking created above. Tap to call or coordinate.
5. Tap **Planned Route (रूट प्लान)**:
   - See the customer stop plotted on the OpenStreetMap / Leaflet map.
   - Tap **Open in Google Maps** to verify one-click turn-by-turn navigation.
6. Tap **Waste Ledger (कबाड़ खाता)**:
   - View your live stock balance.
   - Record an **Intake (आवक)** entry with quantity and select **Grade A**.
   - Record an **Outgoing (निकास)** entry when selling to recyclers.

### Test Persona 3: Municipal Officer (नगर निगम अधिकारी)
1. Select **Officer (अधिकारी)** role on role selection.
2. Enter your email/phone and provide any of the 5 Authorized Officer IDs:
   - Example: `OFFICER-SWM-101`
3. Instant verification takes you directly to the **Municipal Oversight Hub**.
4. Review:
   - City-wide Total Inflow vs Outflow metrics.
   - Active Municipal Stock.
   - **Quality Segregation Index** (Grade A, B, C percentages).
5. Open **Records** to inspect the complete audit ledger.

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
