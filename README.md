<div align="center">

# ♻️ KAWA (कबाड़)
### Bridging Informal Scrap Aggregators with Authorized Recyclers
**Under the E-Waste (Management) Rules, 2022 & CPCB Extended Producer Responsibility (EPR) Framework**

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo_SDK_52+-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![PostGIS](https://img.shields.io/badge/PostGIS-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Native Audio TTS](https://img.shields.io/badge/Expo_Speech-100%25_Free_TTS-4A7C59?style=for-the-badge)](https://docs.expo.dev/versions/latest/sdk/speech/)
[![Zero Subscriptions](https://img.shields.io/badge/Cost-100%25_Open_Source-brightgreen?style=for-the-badge)](https://github.com/vinitmishraaa/kawa-app)

*A production-ready circular economy platform designed to transition India's informal scrap collectors (Kabadiwalas & waste-pickers) into formal, traceable supply chains for CPCB/SPCB authorized e-waste recyclers — preventing toxic backyard processing, securing critical raw materials (Li, Co, Nd, Ga, Au), and providing fair benchmark pricing.*

[Problem Context](#-the-challenge--regulatory-context) • [Key Features](#-core-capabilities--e-waste-upgrades) • [Unit Economics](#-unit-economics--financial-viability) • [Datasets](#-structured-datasets) • [Authorized Officers](#-authorized-recycler--officer-credentials) • [Quick Start](#-quick-start)

</div>

---

## 📌 The Challenge & Regulatory Context

Over **90% of India’s end-of-life electronics (e-waste) is collected by the informal sector** due to their extensive last-mile reach. However, informal collectors remain largely excluded from the formal recycling chain envisioned by the **E-Waste (Management) Rules, 2022**.

### The Consequences of the Gap:
1. **Hazardous Backyard Processing**: Informal collectors resort to open-air cable burning (releasing carcinogenic dioxins & furans), nitric acid/cyanide leaching of circuit boards, and battery puncture without protective equipment.
2. **Loss of Critical Raw Materials**: While crude burning recovers some copper, over **95% of strategic raw materials**—including **Lithium (Li), Cobalt (Co), Neodymium (Nd), Gallium (Ga), Tantalum (Ta), and Indium (In)**—are permanently lost in toxic ash or slag.
3. **Information Asymmetry**: Informal dealers lack access to transparent market pricing, safe handling guidance, and legal handover channels to authorized facilities.

### The KAWA Solution:
KAWA bridges this gap with an intuitive, multi-lingual, voice-enabled mobile platform operating on **100% free and open-source infrastructure** (zero paid subscriptions or proprietary APIs required).

```text
  🏠 CITIZEN / PRODUCER           🛵 INFORMAL COLLECTOR              🏭 AUTHORIZED RECYCLER
           │                              │                                      │
           │  1. Doorstep E-Waste Booking │                                      │
           │  2. Direct Geo-Discovery     │                                      │
           └─────────────────────────────►│                                      │
                                          │  3. Low-Literacy Pictorial Sorting   │
                                          │  4. Native Voice Price Check         │
                                          │  5. 0-kg Waste Accounting Ledger     │
                                          └─────────────────────────────────────►│
                                                                                 │  6. Verifiable Lot Manifest (LOT-EW-...)
                                                                                 │  7. +20-35% Formal Price Premium
                                                                                 │  8. CPCB EPR Credit Generation
```

---

## 🌟 Core Capabilities & E-Waste Upgrades

### 1. 🗣️ Low-Literacy Vernacular & Voice Price Board
- **4 Vernacular Languages**: Fully localized in **English**, **हिन्दी (Hindi)**, **मराठी (Marathi)**, and **বাংলা (Bengali)** via `i18next`.
- **🔊 Native Voice Rate Readouts**: Integrated with `expo-speech` for **100% free, offline, zero-subscription voice readouts**. Collectors can simply tap the speaker icon to listen to benchmark rates in Hindi, Marathi, or English.

### 2. 🛡️ Pictorial & Voice Safety Guidance Module
- Dedicated **Safety Hub (`/(kabadiwala)/safety-guidance`)** with visual, high-contrast hazard cards:
  - ❌ **Prohibited Backyard Hazards**: Open cable burning, nitric acid stripping, CRT glass breakage, battery puncture.
  - ✅ **Safe Handling Protocols**: Heavy-duty PPE, dry shaded storage, battery terminal taping, and direct handover to CPCB units.
- **Audio Voice Explanations**: 1-tap playback narrates safety precautions aloud for low-literacy collectors.

### 3. 📜 Verifiable Lot Tracking & EPR Digital Manifests
- **Digital Handover Manifest (`sell-to-officer.tsx`)**: Generates unique, tamper-resistant Lot IDs (`LOT-EW-YYYYMMDD-XXXX`) complying with Rule 13(1) and Form 6 manifests of the E-Waste Rules 2022.
- **Chain of Custody**: Links the collector's intake to the authorized recycler’s weighbridge receipt, creating verifiable proof that material was not burned in backyards.

### 4. 🏷️ E-Waste Rules 2022 Scrap Taxonomy & Rate Cards
- Complete catalog of high-value and hazardous streams:
  - **PCBs / Circuit Boards** (Au, Ag, Cu, Ga, Ta)
  - **Lithium & Lead Batteries** (Li, Co, Ni, Pb)
  - **CRT Monitors & Display Panels** (In, Leaded Glass)
  - **Copper Cables & Wire Harnesses** (Electrolytic Cu)
  - **Motors, Compressors & Magnets** (Nd, Dy, Cu)
  - *Plus traditional Paper, Plastics, Iron, and Brass.*

### 5. 🗺️ Route Optimization & Offline-Friendly Mapping
- Interactive route preview using **Leaflet.js + OpenStreetMap** (100% open-source, zero Google Maps API costs).
- Deep-links to native Google Maps for seamless turn-by-turn driving directions.

### 6. 🏛️ Authorized Recycler & Municipal Oversight Portal
- Portal for authorized e-waste dismantling facilities and municipal enforcement officers.
- Real-time audit logs of incoming waste batches, quality grading distribution (Grade A Clean, Grade B Semi-sorted, Grade C Mixed), and overdue stock tracking (>7 days) with statutory municipal notice dispatchers.

---

## 📊 Unit Economics & Financial Viability

A complete economic model is documented in [`docs/unit_economics.md`](docs/unit_economics.md).

### Summary Comparison (Per 100 kg Mixed E-Waste Batch):
| Metric | 🧪 Informal Backyard Extraction | ♻️ KAWA Formal Recycler Handover | Benefit / Difference |
|:---|:---:|:---:|:---:|
| **Gross Intake Cost** | ₹21,000 | ₹21,000 | Baseline doorstep cost |
| **Precious & Critical Metal Yield** | <25% (Li, Co, Nd 100% lost) | >95% (Hydrometallurgical) | High industrial extraction |
| **Gross Sale Revenue** | ₹28,500 | **₹34,200** | **+₹5,700 (+20%)** |
| **Hazardous Chemical Costs** | -₹2,400 (Acids, blowtorch) | **₹0** (Zero chemicals) | **₹2,400 saved** |
| **Net Profit to Collector** | **₹4,100** | **₹12,550** | **+₹8,450 (+206% net gain)** |

> **Why Recyclers Pay More**: CPCB authorized units capture precious trace metals (Au, Ag, Pd, Ga) that burn away in backyards, and earn **statutory EPR compliance credits** from electronics manufacturers, enabling them to offer higher rates to collectors.

---

## 📁 Structured Datasets

Located in the [`datasets/`](datasets/) folder:

1. **[`datasets/material_dataset.json`](datasets/material_dataset.json)**: Detailed taxonomy of 5 core e-waste streams, constituent critical raw materials (PPM concentrations), chemical hazards of backyard processing, and formal recovery efficiencies.
2. **[`datasets/price_dataset.json`](datasets/price_dataset.json)**: Real benchmark pricing across key Indian scrap hubs (Mayapuri, Seelampur, Kurla, Peenya, Chandni Chowk) comparing informal backyard rates vs. Kawa formal recycler rates.
3. **[`datasets/recycler_dataset.json`](datasets/recycler_dataset.json)**: Directory of verified CPCB/SPCB authorized recycling facilities across North, West, South, and East zones with valid registration numbers, capacities, and recovery technologies.
4. **[`datasets/traceability_dataset.json`](datasets/traceability_dataset.json)**: Sample Form 6 Chain-of-Custody manifest tracing scrap from citizen doorstep pickup to recycler hydrometallurgical batch extraction and CPCB EPR credit issuance.

---

## 🏛️ Authorized Recycler / Officer Credentials

Use any of these pre-configured authorized credentials to test the **Authorized Recycler Hub**:

| Officer / Recycler ID | Facility / Department | SPCB / CPCB Registration | Zone |
|:---:|:---|:---|:---:|
| `OFFICER-SWM-101` | **EcoEx Green Tech E-Waste Facility** | `DPCC/EPR/2022/REC-901` | North Zone (Delhi NCR) |
| `OFFICER-SWM-102` | **Maharashtra State E-Waste Refiners** | `MPCB/EPR/2022/REC-902` | West Zone (Mumbai MMR) |
| `OFFICER-SWM-103` | **Karnataka Urban CleanTech Recovery** | `KSPCB/EPR/2022/REC-903` | South Zone (Bengaluru) |
| `OFFICER-SWM-104` | **Bengal Environmental Resources Hub** | `WBPCB/EPR/2022/REC-904` | East Zone (Kolkata) |
| `OFFICER-SWM-105` | **Central Waste Command & Oversight** | `CPCB/HQ/EPR-CENTRAL-01` | National Oversight |

*Password: `123456` (or any custom configured password).*

---

## 🧰 100% Free & Open-Source Technology Stack

| Layer | Technology | Cost / License |
|---|---|---|
| **Mobile & Web Framework** | React Native (Expo SDK 52+), Expo Router | Free & Open-Source (MIT) |
| **Audio Voice Engine** | `expo-speech` (Native OS speech synthesis) | **100% Free / Zero API cost** |
| **Interactive Maps** | Leaflet.js + OpenStreetMap | **100% Free / Zero Tile cost** |
| **Cloud Database & Auth** | Supabase (PostgreSQL 15+ & PostGIS) | Free-Tier Compatible |
| **Styling** | NativeWind v4 (Tailwind CSS) | Open-Source |
| **State Management** | Zustand (Global reactive store) | Open-Source |
| **Multi-Language (i18n)** | `i18next` (EN, HI, MR, BN) | Open-Source |

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/vinitmishraaa/kawa-app.git
cd kawa-app
npm install
```

### 2. Configure Environment
Create `.env` in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Universal App
```bash
# Start Expo Metro Bundler
npx expo start

# Run in Web Browser
npx expo start --web

# Run on Android Device / Emulator
npx expo start --android
```

---

## 📄 License & Mission

Distributed under the **MIT License**.

<div align="center">

**Developed by [Vinit Mishra](https://github.com/vinitmishraaa)**  
*Formalizing Informal Waste • Protecting Grassroots Workers • Recovering Critical Raw Materials*  
*In alignment with the E-Waste (Management) Rules, 2022*

</div>
