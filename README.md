# Kawa — KabadiWala Marketplace

> A role-based digital scrap collection and recycling marketplace connecting **Customers, Kabadiwalas, and Officers** through one mobile application.

Kawa is being built as a practical end-to-end platform for managing the scrap lifecycle — from a customer creating a scrap listing, to a nearby Kabadiwala accepting and collecting it, to an Officer managing verified handovers and material records.

The project is built with **Expo + React Native + TypeScript** on the mobile side and **Supabase** for authentication, database, storage, Row Level Security, and backend functions.

---

## Project Vision

Traditional scrap collection is often informal, fragmented, and difficult to track. Kawa aims to bring the complete workflow into a single digital platform where:

- Customers can list scrap from their phone.
- Kabadiwalas can discover nearby collection opportunities and manage bookings.
- Officers can verify participants and maintain collection/handover records.
- Transactions, ratings, material quantities, and price trends can be tracked digitally.
- The system can gradually evolve into a larger recycling and circular-economy platform.

---

## Current Project Status

| Area | Status |
|---|---|
| Customer workflow | Implemented |
| Kabadiwala workflow | Implemented |
| Officer verification | Implemented |
| Officer dashboard & records | Implemented |
| Customer ratings & feedback | Implemented |
| Kabadiwala → Officer handover | Implemented |
| Transaction ledger & RLS | Implemented |
| Nearby Kabadiwala discovery | Implemented |
| Material price trends | Implemented |
| Pull-to-refresh & error states | Implemented |
| Push notification integration | Implemented as best-effort / development-build feature |
| Advanced analytics | Future scope |
| AI-powered features | Future scope |
| Production notification infrastructure | Future scope |

---

# Core User Roles

## 1. Customer

The Customer is the person who wants to sell or dispose of scrap through Kawa.

### Customer capabilities

- Role selection and account creation.
- Login/logout and persistent authentication.
- Language selection.
- Permission onboarding for camera, microphone, photos and location.
- Add one or multiple scrap items in a listing.
- Capture/select scrap photos.
- Select material category and sub-category.
- Enter quantity.
- Submit scrap listings.
- See listing status.
- View matched Kabadiwala information after the relevant booking/match exists.
- See agreed collection price after collection.
- Submit rating and feedback after collection.
- Refresh dashboard data.

### Customer flow

```text
Sign Up / Login
      ↓
Select Customer
      ↓
Add Scrap
      ↓
Photo + Category + Quantity
      ↓
Submit Listing
      ↓
Wait for Kabadiwala
      ↓
Kabadiwala Books Pickup
      ↓
Collection
      ↓
Agreed Price
      ↓
Rating & Feedback
```

---

# 2. Kabadiwala

The Kabadiwala receives nearby scrap collection opportunities and manages the pickup lifecycle.

### Kabadiwala capabilities

- Kabadiwala registration/login.
- Nearby scrap listing discovery.
- Location-based listing sorting.
- Map-based discovery.
- Distance information in kilometres.
- View scrap category, quantity and listing information.
- Book a pickup.
- Enter the agreed price.
- Mark a pickup as collected.
- Access matched customer information where permitted by the workflow.
- Sell/hand over collected material to an approved Officer.
- Select Officer, material, quantity and price for a handover.
- View relevant transaction/collection records.
- Refresh dashboard and records.

### Kabadiwala flow

```text
Login
  ↓
Nearby Listings
  ↓
View Scrap Details
  ↓
Book Pickup
  ↓
Agree Price
  ↓
Collect Scrap
  ↓
Transaction Recorded
  ↓
Sell / Handover to Officer
```

---

# 3. Officer

The Officer role adds a verification and material-handover layer to the platform.

### Officer capabilities

- Officer registration.
- Upload identity/verification documents.
- Pending verification state.
- Approved/rejected verification state.
- Access controlled by the officer's verification status.
- View collection/handover records.
- Filter records.
- Receive Kabadiwala handover transactions.
- Track material category, quantity and price.
- View basic material price trends.
- Refresh records and trend data.

### Officer verification flow

```text
Officer Sign Up
      ↓
Upload Identity Documents
      ↓
Pending Verification
      ↓
Admin / Supabase Verification
      ↓
Approved / Rejected
      ↓
Approved Officer Dashboard
```

For the current MVP, officer approval is performed through Supabase Table Editor by setting the officer profile's `verified` field to `true` and updating the corresponding verification record.

---

# Major Features

## Authentication & Role Management

- Supabase Authentication.
- Role-based onboarding.
- Customer, Kabadiwala and Officer roles.
- Persistent sessions.
- Protected role-specific navigation.
- Profile-based verification state.

## Scrap Listing System

Customers can create scrap listings containing:

- Scrap category.
- Scrap sub-category.
- Quantity.
- Scrap image/photo.
- Collection location.
- Listing status.

Multiple items can be added before submitting listings.

## Location & Nearby Discovery

Kawa uses location-aware discovery for Kabadiwalas.

- Customer listing location is stored in the database.
- Kabadiwalas can discover nearby listings.
- Listings can be ordered by distance.
- Nearby Kabadiwala lookup is supported through a Supabase/PostGIS function.
- Distance is returned in metres and displayed in kilometres where appropriate.

## OpenStreetMap-Based Map

The project uses an OpenStreetMap-based map through `Leaflet.js` inside a React Native WebView.

This approach was selected so the application does not depend on a Google Maps API key for its map implementation.

## Booking & Collection

The pickup lifecycle is represented digitally:

```text
Waiting for Kabadiwala
        ↓
Booked / Accepted
        ↓
Collected
        ↓
Completed
```

The agreed collection price is stored as part of the transaction workflow.

## Transaction Ledger

Transactions connect the different roles and record:

- From user.
- To user.
- From role.
- To role.
- Material category.
- Quantity.
- Price.
- Timestamp.

Transaction insertion is protected with Row Level Security policies so authenticated users cannot freely create arbitrary ledger records.

## Officer Verification

Officer documents are stored in a private Supabase Storage bucket.

The current system includes policies that restrict officer document insertion and reading to the authenticated user's own folder.

## Ratings & Feedback

After an eligible customer collection:

- Customer can submit a rating.
- Customer can provide feedback.
- Kabadiwala rating summary can be displayed on the matched Kabadiwala card.

## Kabadiwala → Officer Handover

Kabadiwalas can transfer collected material to an approved Officer.

The flow includes:

1. Select an approved Officer.
2. Select material.
3. Enter quantity.
4. Enter price.
5. Record the transaction.
6. Officer can view the resulting record.

## Material Price Trends

Kawa includes a basic price-trend screen backed by the `get_price_trend` database function.

The current implementation supports a 90-day material price view and can filter trends by material category.

## Push Notifications

The application includes an Expo push notification integration designed around:

- Push-token storage in `profiles.push_token`.
- Notification permission handling.
- Expo push-token registration.
- Notification delivery for relevant workflow events.
- Best-effort failure handling so notification problems do not stop the main application flow.

**Important:** Android remote push notification functionality is not available through standard Expo Go for newer Expo SDK workflows. Remote notification testing should use an Expo development build / production build on a physical device.

## Multi-language Foundation

The project contains an i18n setup and locale resources so the application can support multiple languages as the interface grows.

---

# Tech Stack

### Mobile Application

- **React Native**
- **Expo SDK 57**
- **Expo Router**
- **TypeScript**
- **NativeWind / Tailwind CSS**
- **Zustand** for application state
- **React Native Gesture Handler**
- **React Native Safe Area Context**
- **React Native WebView**

### Device Features

- Expo Camera
- Expo Image Picker
- Expo Location
- Expo Notifications
- Expo Secure Store
- Expo File System
- Expo Splash Screen

### Backend / Cloud

- **Supabase Auth**
- **Supabase PostgreSQL**
- **Supabase Storage**
- **Row Level Security (RLS)**
- **PostGIS** for location-based queries
- PostgreSQL functions / RPC

### Mapping

- OpenStreetMap
- Leaflet.js
- WebView-based map rendering

The current dependency set is defined in `package.json`, including Expo SDK 57, Supabase JS, Zustand, NativeWind and the Expo device modules used by the app.

---

# Architecture

```text
                    ┌──────────────────────┐
                    │     Kawa Mobile App  │
                    │ Expo / React Native  │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
        Customer          Kabadiwala          Officer
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │       Supabase       │
                    ├──────────────────────┤
                    │ Auth                 │
                    │ PostgreSQL           │
                    │ Storage              │
                    │ RLS Policies         │
                    │ PostGIS              │
                    │ Database Functions   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ OpenStreetMap /      │
                    │ Leaflet Map Layer    │
                    └──────────────────────┘
```

---

# Database Layer

The Supabase database currently revolves around the following major entities:

| Table / Component | Purpose |
|---|---|
| `profiles` | User profile, role, verification, location and push-token data |
| `scrap_listings` | Customer-created scrap listings |
| `bookings` | Customer ↔ Kabadiwala pickup workflow |
| `transactions` | Financial/material handover ledger |
| `ratings` | Customer ratings and feedback |
| `officer_verifications` | Officer verification workflow |
| `listing-photos` | Storage bucket for scrap listing photos |
| `officer-documents` | Private storage bucket for officer identity documents |
| `get_nearby_listings` | Nearby scrap listing discovery |
| `get_nearby_kabadiwalas` | Nearby verified Kabadiwala discovery |
| `get_price_trend` | Material price trend aggregation |

The Phase 2 + 3 migration is located at `supabase/phase2_3.sql` and is intended to run after the original Phase 1 schema.

---

# Security & Data Protection

The project uses Supabase Row Level Security to control access to important operations.

Current protections include:

- Authenticated access for application data.
- Role-aware transaction policies.
- Customer ↔ Kabadiwala transaction checks against valid bookings.
- Kabadiwala → Officer transaction checks against verified Officers.
- Private Officer document storage.
- User-folder restrictions for Officer document uploads/reads.
- Officer access controlled by the profile's verification state.

### Production hardening planned

The current MVP intentionally keeps some matching/profile access simple. Before a large public deployment, sensitive contact information should be moved behind dedicated security-definer RPCs/views and the complete RLS model should be reviewed against the final product requirements.

---

# Project Structure

```text
kawa-app/
│
├── app/
│   ├── (auth)/              # Authentication & onboarding screens
│   ├── (customer)/          # Customer application flow
│   ├── (kabadiwala)/        # Kabadiwala application flow
│   ├── (officer)/           # Officer application flow
│   ├── _layout.tsx          # Root navigation/layout
│   ├── index.tsx             # Entry screen
│   └── price-trends.tsx     # Material price trend screen
│
├── components/              # Reusable UI components
├── constants/               # Application constants
├── locales/                 # i18n locale files
├── services/                # Supabase queries & application services
├── store/                   # Zustand application stores
├── supabase/                # Database schema and migrations
├── assets/                  # Images and static assets
│
├── global.css
├── app.json / eas.json
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── babel.config.js
├── metro.config.js
└── README.md
```

---

# Getting Started

## Requirements

- Node.js 22.13+
- Git
- VS Code or another code editor
- A Supabase project
- Expo Go for basic application testing
- Android Studio + Java 17 if using an Android emulator
- An Expo development build for remote push notification testing

## Install

```bash
git clone https://github.com/vinitmishraaa/kawa-app.git
cd kawa-app
npm install
npx expo install --fix
```

## Configure Environment Variables

Create `.env` from `.env.example` and add your Supabase project URL and public anonymous key.

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Never commit `.env` or private Supabase/service-role credentials.

## Supabase Setup

### Phase 1 schema

Run the original schema first in the Supabase SQL Editor:

```text
supabase/schema.sql
```

### Phase 2 + 3 migration

After the Phase 1 schema is installed, run:

```text
supabase/phase2_3.sql
```

The migration adds the Phase 2/3 database pieces including push-token support, officer-document storage policies, transaction policies and database functions for nearby Kabadiwalas and price trends.

## Start the application

```bash
npx expo start
```

For a development build:

```bash
npx expo start --dev-client
```

---

# Testing Checklist

## Customer

- [ ] Create customer account.
- [ ] Complete language/permission onboarding.
- [ ] Add scrap photo.
- [ ] Select category/sub-category.
- [ ] Enter quantity.
- [ ] Add multiple scrap items.
- [ ] Submit listing.
- [ ] Verify listing status.
- [ ] Complete booking/collection flow.
- [ ] Verify agreed price.
- [ ] Submit rating and feedback.

## Kabadiwala

- [ ] Create/login as Kabadiwala.
- [ ] View nearby listings.
- [ ] Verify map/list distance.
- [ ] Book a pickup.
- [ ] Enter agreed price.
- [ ] Mark pickup collected.
- [ ] Verify transaction.
- [ ] Open Officer handover flow.
- [ ] Select approved Officer.
- [ ] Enter material, quantity and price.
- [ ] Verify Officer record.

## Officer

- [ ] Create Officer account.
- [ ] Upload verification documents.
- [ ] Confirm pending state.
- [ ] Approve Officer in Supabase for MVP testing.
- [ ] Open Officer dashboard.
- [ ] View/filter records.
- [ ] Verify Kabadiwala handover.
- [ ] Open material price trends.

## Notifications

- [ ] Configure EAS project ID.
- [ ] Create/install development build.
- [ ] Test on physical Android/iOS device.
- [ ] Grant notification permission.
- [ ] Register push token.
- [ ] Trigger booking/collection/handover event.
- [ ] Verify notification delivery.

---

# Future Scope / Roadmap

Kawa is designed so the current MVP can grow into a larger digital recycling ecosystem.

## 1. AI-Powered Scrap Recognition

- Identify scrap type from a photo.
- Automatically suggest category/sub-category.
- Estimate approximate material quantity from images where technically feasible.
- Detect mixed-material scrap.
- Provide smart listing assistance.

## 2. Smart Price Prediction

- Use historical transaction data to estimate expected scrap prices.
- Predict price movement for different materials.
- Show regional price differences.
- Suggest a reasonable price range before a customer confirms a transaction.

## 3. Intelligent Matching

Move beyond simple proximity-based matching by considering:

- Distance.
- Kabadiwala availability.
- Material specialization.
- Historical acceptance behaviour.
- Ratings.
- Estimated pickup time.
- Current workload.

## 4. Real-Time Pickup Tracking

- Live pickup status.
- Kabadiwala ETA.
- Route tracking.
- Customer pickup notifications.
- Completion confirmation.

## 5. Digital Payments

A future version can integrate secure digital payments for completed transactions, including:

- UPI.
- Payment status tracking.
- Digital receipts.
- Transaction history.
- Refund/dispute workflows where required.

## 6. Digital Receipts & Invoices

Automatically generate receipts containing:

- Customer.
- Kabadiwala.
- Material.
- Quantity.
- Rate.
- Total amount.
- Date/time.
- Transaction reference.

## 7. Advanced Officer Dashboard

- Regional collection analytics.
- Material-volume analytics.
- Kabadiwala activity.
- Customer activity.
- Verification queue.
- Fraud/anomaly indicators.
- Exportable reports.

## 8. Recycling & Environmental Impact Tracking

Kawa can eventually calculate environmental impact from recorded material flows, such as:

- Approximate waste diverted from landfill.
- Recyclable material volume.
- Material-specific recycling statistics.
- Estimated carbon/waste reduction indicators.

## 9. Business / Enterprise Accounts

Future support can include:

- Apartments and housing societies.
- Offices.
- Schools and colleges.
- Restaurants and commercial establishments.
- Factories and warehouses.
- Bulk scrap generators.

These organizations could schedule recurring pickups and manage multiple locations.

## 10. Scheduled & Recurring Pickups

- Daily/weekly/monthly pickup schedules.
- Automatic reminders.
- Recurring scrap generation profiles.
- Bulk pickup requests.

## 11. In-App Communication

A controlled communication layer could provide:

- Customer ↔ Kabadiwala chat.
- Pickup-related messages.
- Automated status messages.
- Support communication.

## 12. Fraud & Trust System

Potential future mechanisms include:

- Suspicious transaction detection.
- Duplicate listing detection.
- Abnormal price detection.
- Account reputation signals.
- Stronger identity verification.
- Dispute resolution workflow.

## 13. Admin Panel

A dedicated web-based administration dashboard can manage:

- Users.
- Officers.
- Kabadiwalas.
- Verification requests.
- Listings.
- Transactions.
- Complaints/disputes.
- Material categories.
- Pricing data.
- Platform analytics.

## 14. Production-Grade Notifications

The notification architecture can be expanded with a server-side notification service for:

- Booking updates.
- Pickup reminders.
- Collection confirmation.
- Officer handover alerts.
- Price alerts.
- Verification status changes.
- System announcements.

## 15. Multi-City / Multi-Region Expansion

The current architecture can be extended to support multiple cities and regions with localized:

- Material prices.
- Service availability.
- Languages.
- Pickup zones.
- Officer administration.
- Recycling partners.

---

# Product Roadmap

```text
PHASE 1
│
├── Authentication
├── Customer scrap listing
├── Kabadiwala discovery
├── Booking
├── Collection
└── Basic transaction flow
        │
        ▼
PHASE 2
│
├── Officer verification
├── Officer dashboard
├── Customer ratings
├── Kabadiwala ↔ Officer handover
├── Stronger transaction rules
└── Contact/matching improvements
        │
        ▼
PHASE 3
│
├── Push notification integration
├── Price trends
├── Refresh/error states
└── Improved reliability
        │
        ▼
FUTURE
│
├── AI scrap recognition
├── Smart price prediction
├── Intelligent matching
├── Live pickup tracking
├── Digital payments
├── Digital receipts
├── Admin panel
├── Enterprise accounts
├── Environmental impact analytics
├── Fraud detection
└── Multi-city expansion
```

---

# Cost & Infrastructure Notes

The core development stack is based on free/open-source or free-tier services.

| Technology | Current role |
|---|---|
| Expo / React Native | Mobile application |
| Supabase | Auth, database, storage and backend functions |
| PostgreSQL / PostGIS | Application data and location queries |
| OpenStreetMap | Map data |
| Leaflet | Map rendering |
| GitHub | Source control |

Production costs will depend on scale, database/storage usage, notification infrastructure, app-store distribution and any third-party services added later.

---

# Development Principles

Kawa is being developed around a few core principles:

- **Mobile-first:** the primary workflow should remain simple on a phone.
- **Role separation:** Customer, Kabadiwala and Officer experiences are distinct.
- **Data security:** sensitive operations are protected with Supabase RLS.
- **Low infrastructure dependency:** use open technologies where practical.
- **Incremental development:** features are introduced in phases instead of overloading the MVP.
- **Production scalability:** current database and service boundaries are designed to allow future expansion.

---

# Repository

**GitHub:** [vinitmishraaa/kawa-app](https://github.com/vinitmishraaa/kawa-app)

---

# License

This project is currently maintained as a personal/student software project. Licensing and public contribution guidelines can be defined as the project moves toward wider release.
