<div align="center">

# ♻️ KAWA

### KabadiWala • Scrap Marketplace • Circular Economy

<p>
  <img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo%20SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostGIS" />
  <img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge" alt="Zustand" />
</p>

<i>A mobile-first three-sided scrap-collection marketplace connecting Customers, Kabadiwalas and Officers through digital listings, nearby discovery, bookings, collection records and recycling handovers.</i>

<p>
  <a href="https://github.com/vinitmishraaa/kawa-app">💻 GitHub Repository</a>
</p>

</div>

---

## 🚀 About KAWA

**KAWA (KabadiWala)** is a cross-platform mobile application designed to bring the informal scrap-collection workflow into a connected digital marketplace.

Instead of treating scrap collection as a single transaction, KAWA models the complete material journey:

```text
👤 CUSTOMER
     │
     │ Creates Scrap Listing
     ▼
♻️ SCRAP LISTING
     │
     │ Nearby Discovery
     ▼
🛵 KABADIWALA
     │
     │ Books + Collects
     ▼
💰 TRANSACTION
     │
     │ Sells / Hands Over
     ▼
🏛️ OFFICER
     │
     ▼
📊 COLLECTION RECORD
```

The application is built for **Android and iOS**, with a simple, icon-heavy interface designed to keep important actions easy to understand and operate.

---

## 🎯 Project Vision

Traditional scrap collection can be fragmented across customers, local Kabadiwalas and larger collection points. KAWA aims to create a digital layer over this ecosystem.

The platform is designed to make it easier to:

- list scrap from a mobile phone,
- discover nearby collection opportunities,
- book and manage pickups,
- record quantities and prices,
- connect Kabadiwalas with verified Officers,
- maintain transaction and collection history,
- collect customer feedback, and
- gradually build a data-driven recycling ecosystem.

---

## ✨ Key Features

| Feature | What KAWA Includes |
|---|---|
| 👥 **Three User Roles** | Customer, Kabadiwala and Officer workflows. |
| 🔐 **Email Authentication** | Supabase email + password authentication. |
| ♻️ **Scrap Listings** | Category, sub-category, quantity, photo and location. |
| 📷 **Camera / Image Picker** | Capture or select scrap photos from the device. |
| 📍 **Nearby Discovery** | Location-aware scrap discovery for Kabadiwalas. |
| 🗺️ **OpenStreetMap** | Open map data through Leaflet/WebView. |
| 📦 **Booking System** | Kabadiwalas can book available scrap listings. |
| 🤝 **Collection Workflow** | Booking → collection → transaction lifecycle. |
| 💰 **Transaction Ledger** | Material, quantity, price, participants and timestamp. |
| 🏛️ **Officer Verification** | Identity-document upload with pending/approved/rejected states. |
| 🏭 **Officer Handover** | Kabadiwala → verified Officer material handover. |
| 📋 **Officer Records** | Filterable collection and transaction records. |
| ⭐ **Ratings & Feedback** | Customer feedback for completed Kabadiwala interactions. |
| 📞 **Matched Contact Sharing** | Contact information becomes available after the relevant match. |
| 📈 **Price Trends** | Basic historical material-price trend view. |
| 🔄 **Pull to Refresh** | Refresh support across major data screens. |
| 🌐 **English + Hindi** | i18n foundation with English and Hindi locale files. |
| 🔔 **Push Notification Layer** | Expo notification integration prepared for development builds. |
| 🛡️ **Row Level Security** | Supabase RLS for protected database operations. |

---

## 🧩 How It Works

```text
                         KAWA MARKETPLACE
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
        👤 Customer        🛵 Kabadiwala       🏛️ Officer
             │                  │                  │
             ▼                  ▼                  ▼
        Add Scrap          Find Nearby        Verify Identity
             │                  │                  │
             ▼                  ▼                  ▼
        Listing Created     Book Pickup       Approval Gate
             │                  │                  │
             └──────────────┬───┴──────────────────┘
                            ▼
                     ♻️ COLLECTION
                            │
                            ▼
                     💰 TRANSACTION
                            │
                            ▼
                   📊 DIGITAL RECORD
```

---

# 👤 Customer Experience

Customers are the starting point of the scrap lifecycle.

### Customer Flow

```text
Role Selection
      ↓
Email + Password Signup/Login
      ↓
Language Selection
      ↓
Permissions
      ↓
Customer Dashboard
      ↓
📷 Add Scrap
      ↓
Category + Subcategory + Quantity
      ↓
Add More Items (optional)
      ↓
Submit Listing
      ↓
Wait for Kabadiwala
      ↓
Booking / Collection Status
      ↓
⭐ Rating + Feedback
```

### Customer Features

- Create one or multiple scrap items.
- Capture or select scrap photos.
- Select material category and sub-category.
- Enter approximate quantity.
- Store collection location.
- Track listing and booking status.
- View agreed collection information.
- See matched Kabadiwala contact details after booking.
- Submit a rating and feedback after eligible collection.

---

# 🛵 Kabadiwala Experience

Kabadiwalas form the collection layer between Customers and Officers.

### Customer → Kabadiwala

```text
📍 Nearby Listings
       ↓
View Scrap Details
       ↓
📦 Book Pickup
       ↓
Matched Customer
       ↓
Agree Price
       ↓
🤝 Collect Scrap
       ↓
💰 Record Transaction
```

### Kabadiwala Features

- Discover available nearby scrap listings.
- View distance and listing details.
- See scrap category, quantity and photo.
- Book a customer pickup.
- Enter agreed collection price.
- Mark a booking as collected.
- Access matched customer information after the appropriate workflow state.
- View relevant collection records.
- Sell collected material to an approved Officer.
- Select material, quantity and price for an Officer handover.

---

# 🏛️ Officer Experience

Officers represent the government/wholesale collection side of KAWA.

Officers **do not directly collect from Customers**. Their interaction is with Kabadiwalas who hand over collected material.

### Officer Verification

```text
Officer Signup
      ↓
Identity Document Upload
      ↓
⏳ Pending Review
      ↓
Admin Review
   ┌──┴──┐
   ▼     ▼
Approved Rejected
   │
   ▼
Officer Dashboard
```

### Officer Features

- Create an Officer account.
- Upload verification documents.
- Wait in a pending state until approval.
- Access the dashboard only after approval.
- Receive material handovers from Kabadiwalas.
- View collection records.
- Filter records by material and amount.
- View basic material price trends.

For the current MVP, Officer approval can be performed through the Supabase Table Editor by updating the relevant verification/profile state.

---

# ♻️ Scrap Lifecycle

KAWA models the movement of scrap through multiple stages instead of storing only a final sale.

```text
┌─────────────┐
│ SCRAP LISTED│
└──────┬──────┘
       ↓
┌─────────────┐
│    BOOKED   │
└──────┬──────┘
       ↓
┌─────────────┐
│  COLLECTED  │
└──────┬──────┘
       ↓
┌─────────────┐
│ TRANSACTION │
└──────┬──────┘
       ↓
┌─────────────┐
│  HANDOVER   │
└──────┬──────┘
       ↓
┌─────────────┐
│   OFFICER   │
└─────────────┘
```

Every stage is backed by application state and database records.

---

# 📍 Location & Nearby Discovery

KAWA uses **PostgreSQL + PostGIS** for geographic operations.

```text
Device Location
      ↓
Latitude / Longitude
      ↓
PostGIS Geography Point
      ↓
ST_DWithin
      ↓
ST_Distance
      ↓
Nearby Results
      ↓
Nearest First
```

The map layer uses **OpenStreetMap data rendered through Leaflet inside a React Native WebView**, avoiding dependence on a Google Maps API key for the current map implementation.

---

# ⭐ Ratings & Feedback

After a valid Customer ↔ Kabadiwala interaction is completed:

```text
Collection Completed
        ↓
Customer Rating
        ↓
Feedback
        ↓
Rating Record
        ↓
Kabadiwala Rating Summary
```

This gives Customers a feedback mechanism while giving Kabadiwalas a visible reputation signal within the marketplace workflow.

---

# 💰 Transactions & Records

KAWA keeps a structured transaction ledger containing information such as:

```text
From User
To User
From Role
To Role
Material Category
Quantity
Price
Timestamp
```

The same transaction layer supports both sides of the marketplace:

```text
Customer → Kabadiwala
        ↓
Collection Transaction
        ↓
Kabadiwala → Officer
        ↓
Handover Transaction
```

---

# 📈 Material Price Trends

The application includes a basic historical price-trend layer backed by the `get_price_trend` database function.

```text
Kabadiwala → Officer Transactions
                ↓
          Material Category
                ↓
        Historical Transactions
                ↓
       Average Price / Quantity
                ↓
             📈 Trend
```

The current feature is intended for historical visibility, not guaranteed future-price prediction.

---

# 🔔 Notifications

KAWA includes an Expo-based notification layer for workflow events such as:

```text
New Booking
    ↓
Booking Status Change
    ↓
Collection Completed
    ↓
Officer Handover
```

Push-token storage is supported through the profile system.

**Development note:** Android remote push notifications are not supported through standard Expo Go for newer Expo SDK workflows. Remote push testing should use an Expo development build on a physical device.

---

# 🔐 Authentication & Security

KAWA intentionally uses **email + password authentication** rather than phone OTP, avoiding a dependency on a paid SMS provider.

```text
              SUPABASE
                  │
       ┌──────────┴──────────┐
       ▼                     ▼
     AUTH                 DATABASE
       │                     │
Email + Password             RLS
       │                     │
       └──────────┬──────────┘
                  ▼
           Role-Based Access
```

Security mechanisms include:

- Supabase Authentication.
- Row Level Security policies.
- Role-aware transaction checks.
- Verified-Officer checks for Officer handovers.
- Private Officer document storage.
- User-folder restrictions for Officer documents.
- Protected role-specific navigation.

Production deployments should additionally harden sensitive contact-data access behind dedicated server-side security policies/RPCs.

---

# 🗄️ Database Architecture

Core entities:

```text
                    profiles
                       │
       ┌───────────────┼────────────────┐
       │               │                │
       ▼               ▼                ▼
scrap_listings       ratings     officer_verifications
       │
       ▼
    bookings
       │
       ▼
  transactions
```

| Component | Purpose |
|---|---|
| `profiles` | User identity, role, verification, contact/location and push-token data. |
| `scrap_listings` | Customer-created scrap listings. |
| `bookings` | Customer ↔ Kabadiwala pickup workflow. |
| `transactions` | Material and financial transaction ledger. |
| `ratings` | Customer ratings and feedback. |
| `officer_verifications` | Officer identity verification workflow. |
| `listing-photos` | Scrap listing image storage. |
| `officer-documents` | Private Officer verification-document storage. |
| `get_nearby_listings` | Nearby scrap discovery. |
| `get_nearby_kabadiwalas` | Nearby verified Kabadiwala lookup. |
| `get_price_trend` | Historical material price aggregation. |

---

# 🏗️ Architecture

```text
                         ┌────────────────────────┐
                         │      KAWA MOBILE       │
                         │   React Native + Expo  │
                         └───────────┬────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
              Expo Router       Zustand          Device APIs
                    │                │          Camera / Location
                    └────────────────┼────────────────┘
                                     ▼
                           ┌──────────────────┐
                           │ Supabase Client  │
                           └────────┬─────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
        Supabase Auth          PostgreSQL              Storage
                                    │
                           ┌────────┴────────┐
                           ▼                 ▼
                        PostGIS              RLS
                           │                 │
                           └────────┬────────┘
                                    ▼
                           KAWA Marketplace
                                    │
                                    ▼
                         OpenStreetMap / Leaflet
```

---

# 🧰 Technology Stack

| Layer | Technology |
|---|---|
| Mobile | React Native |
| Framework | Expo SDK 57 |
| Language | TypeScript |
| Navigation | Expo Router |
| State | Zustand |
| Styling | NativeWind + Tailwind CSS |
| Authentication | Supabase Auth |
| Database | PostgreSQL |
| Geo Queries | PostGIS |
| Storage | Supabase Storage |
| Camera | Expo Camera |
| Images | Expo Image Picker |
| Location | Expo Location |
| Maps | OpenStreetMap + Leaflet/WebView |
| i18n | i18next + react-i18next |
| Notifications | Expo Notifications |
| Platform | Android + iOS |

---

# 📁 Repository Structure

```text
kawa-app/
│
├── app/
│   ├── (auth)/              # Login, signup & Officer verification
│   ├── (customer)/          # Customer workflow
│   ├── (kabadiwala)/        # Kabadiwala workflow
│   ├── (officer)/           # Officer workflow
│   ├── price-trends.tsx     # Material price trends
│   ├── index.tsx            # Application entry
│   └── _layout.tsx          # Root navigation/layout
│
├── components/              # Reusable UI components
├── constants/               # App constants
├── locales/                 # English + Hindi translations
├── services/                # Supabase queries & services
│   └── queries/             # Role/domain-specific queries
├── store/                   # Zustand stores
├── supabase/                # Schema + migrations
│   ├── schema.sql
│   └── phase2_3.sql
├── assets/                  # Static assets
├── global.css
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
├── .env.example
└── README.md
```

---

# 🛠️ Development Roadmap

## Phase 1 — Core Marketplace

```text
✅ Role Selection
✅ Email / Password Auth
✅ Customer Onboarding
✅ Kabadiwala Onboarding
✅ Add Scrap
✅ Camera / Image Picker
✅ Categories + Subcategories
✅ Multiple Items per Session
✅ Location-Aware Listings
✅ Nearby Discovery
✅ Booking
✅ Collection Status
✅ Transaction Creation
✅ Customer Booking Tracking
```

## Phase 2 — Trust & Officer Layer

```text
✅ Officer Registration
✅ Identity Document Upload
✅ Pending / Approved / Rejected Verification
✅ Officer Dashboard
✅ Officer Records
✅ Kabadiwala → Officer Handover
✅ Contact Sharing After Match
✅ Ratings + Feedback
✅ Rating Summary
```

## Phase 3 — Intelligence & Polish

```text
✅ Price Trend View
✅ Pull-to-Refresh
✅ Loading States
✅ Empty States
✅ Retry / Error Handling
🔧 Push Notification Development-Build Integration
```

---

# 🔮 Future Scope

KAWA is designed to grow beyond the current marketplace MVP into a broader digital recycling ecosystem.

### 🤖 AI Scrap Recognition

```text
Scrap Photo
    ↓
Computer Vision
    ↓
Material Detection
    ↓
Category / Subcategory Suggestion
    ↓
Smart Listing
```

Potential future capabilities include automatic scrap classification, mixed-material detection and listing assistance.

### 💰 Smart Price Intelligence

Combine historical transactions, material type and region to provide indicative price ranges and market insights.

### 🧠 Intelligent Matching

Future matching can consider distance, availability, material categories, response time, completed collections and rating history.

### 📍 Live Pickup Tracking

```text
Booking Confirmed
       ↓
Kabadiwala En Route
       ↓
Live Location
       ↓
Pickup Reached
       ↓
Collection Completed
```

### 💳 Digital Payments

Optional digital payment support can be added for completed transactions while keeping the payment layer separate from the core marketplace.

### 🧾 Digital Receipts

Generate receipts containing material, quantity, price, participants, timestamp and collection/handover details.

### 🏛️ Admin Dashboard

A dedicated administration platform can support Officer verification, user management, listing monitoring, transaction analytics, disputes and platform activity.

### 🌱 Environmental Impact Tracking

```text
Material Collected
       ↓
Recycled Weight
       ↓
Waste Diverted
       ↓
Estimated Environmental Impact
```

### 🛡️ Trust & Fraud Detection

Future safeguards can identify unusual booking, listing and transaction patterns and flag suspicious activity for review.

### 🌐 Multi-City Expansion

The platform can be extended with city-specific collection networks, material categories, regional pricing and local recycling partners.

---

# 🎯 Long-Term Vision

```text
       DISCOVER
          ↓
       CONNECT
          ↓
         BOOK
          ↓
       COLLECT
          ↓
       RECORD
          ↓
        SELL
          ↓
       RECYCLE
          ↓
    MEASURE IMPACT
```

The long-term vision of KAWA is to provide a digital infrastructure layer for scrap collection where material can move through the recycling chain with better **discovery, coordination, transparency, records and environmental visibility**.

---

# 🚀 Getting Started

## Prerequisites

- Node.js 22.13+
- Git
- npm
- Expo Go for basic mobile testing
- Supabase hosted project or self-hosted Supabase
- Android Studio + Java 17 for Android emulator testing
- Expo development build for remote push-notification testing

## Clone

```bash
git clone https://github.com/vinitmishraaa/kawa-app.git
cd kawa-app
```

## Install

```bash
npm install
npx expo install --fix
```

## Environment Variables

Create `.env` from `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit `.env` or private/service-role credentials.

## Supabase

Run the Phase 1 database schema:

```text
supabase/schema.sql
```

After the Phase 1 schema is installed, apply the Phase 2/3 migration when needed:

```text
supabase/phase2_3.sql
```

## Run KAWA

```bash
npx expo start
```

For a development build:

```bash
npx expo start --dev-client
```

---

# 🧪 Testing Checklist

### Customer

- [ ] Signup/login
- [ ] Language selection
- [ ] Permissions
- [ ] Add scrap photo
- [ ] Category/subcategory
- [ ] Quantity
- [ ] Multiple items
- [ ] Submit listing
- [ ] Track booking
- [ ] View matched contact
- [ ] Rate Kabadiwala

### Kabadiwala

- [ ] Signup/login
- [ ] Nearby listings
- [ ] Map + distance
- [ ] Book pickup
- [ ] Agree price
- [ ] Mark collected
- [ ] Verify transaction
- [ ] Sell to approved Officer
- [ ] Verify Officer handover

### Officer

- [ ] Signup
- [ ] Upload documents
- [ ] Pending state
- [ ] Approval
- [ ] Officer dashboard
- [ ] Collection records
- [ ] Filters
- [ ] Price trends

### Notifications

- [ ] Configure EAS project
- [ ] Create development build
- [ ] Install on physical device
- [ ] Grant notification permission
- [ ] Register push token
- [ ] Trigger workflow event
- [ ] Verify notification

---

# ⚠️ Current Limitations

- Officer discovery is currently based on approved Officer records; distance sorting is not part of the current Officer data model.
- Android remote push testing requires a development/production build rather than standard Expo Go.
- Contact-data access should receive additional server-side hardening before large-scale production deployment.
- Price trends represent historical transaction data and are not guaranteed market predictions.
- OpenStreetMap-based services should follow their usage/fair-use policies at production scale.

---

# 💸 Free / Open-Source Development Approach

KAWA is designed around a **zero-subscription development stack**.

| Component | Role | Approach |
|---|---|---|
| React Native | Mobile UI | Open source |
| Expo | Development framework | Open source ecosystem |
| TypeScript | Application language | Open source |
| Zustand | State management | Open source |
| NativeWind | Styling | Open source |
| Supabase | Auth / DB / Storage | Open source + free hosted option |
| PostgreSQL | Database | Open source |
| PostGIS | Geo queries | Open source |
| OpenStreetMap | Map data | Open data |
| Leaflet | Map rendering | Open source |
| i18next | Internationalisation | Open source |

Production hosting, app-store accounts and third-party infrastructure can introduce separate costs; they are not required for the core local development workflow.

---

# 📌 Project Status

```text
Phase 1  ████████████████████  Complete
Phase 2  ████████████████████  Complete
Phase 3  ███████████████████░  In Progress / Integration
Future   ░░░░░░░░░░░░░░░░░░░░  Planned
```

---

<div align="center">

### ♻️ KAWA — KabadiWala

<i>Connect • Collect • Record • Recycle</i>

<p>
  <a href="https://github.com/vinitmishraaa/kawa-app">💻 GitHub Repository</a>
</p>

**B&D by Vinit Mishra**

</div>
