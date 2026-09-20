<div align="center">

# ♻️ KAWA (कबाड़)

### Smart Scrap Marketplace • Route Optimization • Waste Accounting • Municipal Oversight

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Tailwind CSS](https://img.shields.io/badge/NativeWind_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://nativewind.dev/)
[![Languages](https://img.shields.io/badge/Languages-EN%20%7C%20HI%20%7C%20BN-4A7C59?style=for-the-badge)](https://github.com/vinitmishraaa/kawa-app)

*A production-ready, three-sided platform connecting **Citizens**, **Grassroots Scrap Collectors (Kabadiwalas)**, and **Municipal Waste Enforcement Officers** with real-time bookings, interactive routing, transparent price indexing, and zero-mock waste accounting.*

[Explore Features](#-three-user-roles) • [Officer Access](#-authorized-municipal-officers) • [Quick Start](#-quick-start) • [Tech Stack](#-technology-stack)

</div>

---

## 📌 Executive Overview

The informal scrap sector in India handles over 80% of recyclable material segregation but lacks digitized coordination. **KAWA** unites all three stakeholders into a transparent, circular economy loop:

```text
  👤 CUSTOMER                   🛵 KABADIWALA                 🏛️ MUNICIPAL OFFICER
       │                              │                                 │
       │  1. Select Scrap & Weight    │                                 │
       │  2. Direct Nearby Booking    │                                 │
       └─────────────────────────────►│                                 │
                                      │  3. Accept & Route Navigation   │
                                      │  4. Doorstep Weigh & Grade      │
                                      │  5. 0-kg Base Stock Accounting  │
                                      └────────────────────────────────►│
                                                                        │  6. Scrap Price Index & Margins
                                                                        │  7. Monitor Overdue Stock (>7d)
                                                                        │  8. Issue Legal SWM Notices
```

---

## ⚡ Recent Upgrades & Highlights

- **🧹 Zero Mock Data**: All hardcoded stock, sample collectors, and dummy notices purged. The app strictly displays real registered users and actual database transactions.
- **⚖️ 0 kg Clean Initial Stock**: Kabadiwala inventory starts strictly at `0 kg` and `₹0`. Stock accumulates only when genuine customer pickups or direct intakes are logged.
- **🏛️ Streamlined Officer Login (Web & Mobile)**: Simplified authentication requiring only Officer ID and Password (with eye toggle). Renders an in-page authorization card with 1-tap **"Open Officer Dashboard"** and auto-redirect.
- **💰 Scrap Price Index & Margin Tracking**: Officers inspect real-time benchmark Customer Buy Rates (₹/kg), Municipal Resale Rates (₹/kg), and calculated Collector Margins across all 10 scrap commodities.
- **📜 Overdue Stock & Municipal Legal Notices**: Officers track real collector stock and days overdue. Officers can dispatch formal legal notices under Section 12 SWM by-laws with high-priority push notifications.
- **🚨 Urgent Compliance Banner**: Automatically alerts a Kabadiwala when an official notice is issued, with a direct 1-tap **"Handover Stock to Officer"** flow.
- **📞 Direct Call & WhatsApp Coordination**: Instant 1-tap dialer and pre-filled WhatsApp chat buttons on customer booking cards and collector dashboards.
- **🔄 Fresh App Launch**: App starts clean at Role Selection on restart/refresh for immediate persona testing without auto-login lockouts.
- **🚪 Rock-Solid Logout**: Multi-key cache purge (`AsyncStorage`, Supabase Auth, Zustand) with seamless web browser alert compatibility.

---

## 👥 Three User Roles

### 1. 👤 Customer (ग्राहक / ক্রেতা)
- **Scrap Catalog**: Pick materials (*Paper, Cardboard, Plastics, Iron, Copper, Brass, E-Waste, Glass, Mixed*) and estimated weights with live price estimates.
- **Nearby Collector Discovery**: PostGIS-powered geo-queries identify nearest verified Kabadiwalas with distance, ratings, and custom price cards.
- **Slot Booking**: Select preferred pickup slots (*Morning / Afternoon / Evening*) and track live status (`Pending` ➔ `Confirmed` ➔ `Completed`).
- **Direct Coordination**: 1-tap Call and WhatsApp buttons to coordinate with the assigned collector.
- **Rating System**: 1-5 star reviews with quality feedback tags (Punctual, Polite, Fair Weighing).

---

### 2. 🛵 Kabadiwala (कबाड़ी वाला / কাবাডিওয়ালা)
- **Assigned Bookings Feed**: Clean list of bookings assigned specifically to this collector with pickup details and customer contacts.
- **🗺️ Planned Route Map**: Interactive Leaflet / OpenStreetMap sequencing all customer stops with a 1-tap **"Open in Google Maps"** navigation button.
- **🏷️ Custom Rate Card**: Edit and publish individual buying rates (₹/kg) across all scrap types, updated live for prospective customers.
- **📒 Item-Wise Waste Ledger**: Complete material-by-material breakdown of in-stock weight (`kg`), money spent, expected municipal payout, and projected profit.
- **Direct Scrap Intake**: Rapid logger for offline/walk-in purchases with category, weight, and quality grading (`Grade A`, `Grade B`, `Grade C`).
- **Physical Yard Photo**: Capture or update scrap shop photo displayed on customer discovery cards.

---

### 3. 🏛️ Municipal Officer (नगर निगम अधिकारी)
- **Government Authorization**: Instant verification for the 5 official municipal officer credentials.
- **Scrap Price Index & Collector Margins**: Complete visibility into buy rates, resale benchmarks, and collector profit percentages.
- **Active Collector Monitoring**: Audit registered collection centers, real held stock (`kg`), and days since last municipal handover.
- **Municipal Legal Notice Dispatcher**: Send formal compliance warnings or final legal orders under Section 12 SWM bylaws with push alerts.
- **Quality Segregation Index**: Municipal-wide analytics measuring percentages of Grade A (Segregated), Grade B (Mixed), and Grade C (Contaminated) scrap.
- **Master Audit Ledger**: Immutable transaction records filterable by date, collector, zone, and waste commodity.

---

## 🏛️ Authorized Municipal Officers

Use any of these 5 pre-authorized Government Officer IDs to access the **Officer Dashboard**:

| Officer ID | Name | Department & Municipal Zone | Access Level |
|:---:|:---|:---|:---:|
| `OFFICER-SWM-101` | **Rajesh Sharma** | Municipal Solid Waste Management (North Zone) | Full Command |
| `OFFICER-SWM-102` | **Amit Banerjee** | Urban Sanitation & Recycling (South Zone) | Full Command |
| `OFFICER-SWM-103` | **Pooja Verma** | Pollution Control & Waste Audit (East Zone) | Full Command |
| `OFFICER-SWM-104` | **Vikram Sen** | Municipal Enforcement Cell (West Zone) | Full Command |
| `OFFICER-SWM-105` | **Debashis Mukherjee** | Central Waste Command & Oversight (Central Command) | Super Admin |

*Default test password: `123456` (or any custom configured password).*

---

## 🧰 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React Native (Expo SDK 57), Expo Router (File-based navigation) |
| **Language & Typings** | TypeScript (~6.0) with strict compilation |
| **Styling & UI** | NativeWind v4 (Tailwind CSS), Vector Icons |
| **State Management** | Zustand (Global reactive stores) |
| **Backend & Database** | Supabase (PostgreSQL 15+, PostGIS geospatial extension, Row Level Security) |
| **Mapping & Routing** | Leaflet.js + OpenStreetMap (WebView & Web iframe) + Google Maps Deep Linking |
| **Localization** | i18next (English, हिन्दी, বাংলা) |
| **Storage & Media** | Expo Camera, Expo ImagePicker, Supabase Storage |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/vinitmishraaa/kawa-app.git
cd kawa-app
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Database Setup (Supabase)
Run the migration scripts in the **SQL Editor** of your Supabase dashboard:
1. `supabase/schema.sql` (Core tables, PostGIS extensions, profiles, bookings)
2. `supabase/phase2_3.sql` (Transactions, ratings, officer verifications)
3. `supabase/phase4_features.sql` (Waste ledger, waste grading, route schemas)
4. `supabase/fix_auth_and_rls.sql` (RLS policies, officer accounts seed, trigger handlers)

### 4. Run the Application
```bash
# Start Metro bundler (Universal)
npx expo start

# Run directly on Web
npx expo start --web

# Run on Android
npx expo start --android
```

---

## 💸 Zero-Cost Architecture

KAWA is architected to run with **zero ongoing API costs or paid subscriptions**:

| Component | Standard Approach | KAWA Zero-Cost Solution |
|---|---|---|
| **Map Rendering** | Paid Google Maps SDK | OpenStreetMap + Leaflet.js |
| **Turn-by-Turn Navigation** | Paid Navigation SDKs | Deep Linking to native Google Maps app |
| **Geospatial Distance** | Paid Matrix APIs | PostGIS `ST_Distance` on PostgreSQL |
| **Authentication** | Paid SMS OTP gateways | Email & 10-Digit Mobile ID via Supabase |
| **Cloud Database** | Costly Dedicated RDS | Supabase Free-Tier Managed PostgreSQL |

---

## 📄 License & Author

Distributed under the **MIT License**.

<div align="center">

**Developed by [Vinit Mishra](https://github.com/vinitmishraaa)**  
*Organizing Informal Recycling • Clean India (स्वच्छ भारत) • Circular Economy*

</div>
