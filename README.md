# BeSafe Command & Intelligence Console

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Mapbox](https://img.shields.io/badge/Mapbox_GL-v3.28-black?style=flat-square&logo=mapbox)](https://www.mapbox.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.8-010101?style=flat-square&logo=socket.io)](https://socket.io/)

**BeSafe Web** is the tactical emergency response, dispatch telemetry, and incident intelligence dashboard for the BeSafe ecosystem. Built for verified law enforcement divisions, security command posts, emergency response units, and accredited support NGOs.

---

## 🚀 Key Capabilities

### 1. Live Vector Radar & Geospatial Telemetry
- Interactive, GPU-accelerated **Mapbox GL JS** tactical radar.
- Automatic database coordinate centering for authenticated Agency Headquarters.
- Live GPS ping streaming for active SOS victims with automatic route bearing and proximity recalculations.
- Smooth camera reactivity with dynamic coordinate fly-to transitions.

### 2. Real-Time Emergency SOS Queue
- Bidirectional **Socket.IO** websocket integration for instantaneous alert ingestion (`new_alert`, `location_update`, `alert_status_changed`).
- Multi-tier threat classification with AI acoustic confidence scoring, transcribed distress cues, and emergency contact broadcasts.
- Frontline status workflow: `Active Distress` &rarr; `Unit Dispatched` &rarr; `Resolved` / `False Alarm`.

### 3. SafeChat Intelligence & AI Dossiers
- Qualitative report management for harassment, assault, transit hazards, domestic safety, and community concerns.
- Integration with Gemini LLM analytical pipelines for automated incident pattern extraction, timeline urgency evaluation, and severity scoring.
- Forensic evidence vault with attached multimedia and secure investigator notes.

### 4. Multi-Role Agency Administration (RBAC)
- Role-Based Access Control enforcing discrete permission boundaries:
  - **`SUPER_ADMIN`**: Global platform management and inter-agency dispatch matrix.
  - **`AGENCY_ADMIN`**: Agency configuration, staff onboarding, role assignment, and HQ geolocation calibration.
  - **`OPERATOR`**: Frontline telemetry monitoring, alert assignment, and incident resolution.

### 5. Tactical Analytics & Volume Trends
- Aggregated 7-day incident volume trends and threat category distribution charts powered by direct database pipelines.

---

## 🛠️ Technology Stack

| Domain | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19 Server/Client Components) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Dark Glassmorphism Design System |
| **Mapping & GIS** | [Mapbox GL JS v3](https://docs.mapbox.com/mapbox-gl-js/api/) |
| **Real-time Networking**| [Socket.IO Client v4](https://socket.io/docs/v4/client-api/) |
| **State Management** | [Zustand v5](https://zustand-demo.pmnd.rs/) (Auth, Map Telemetry, Active Alert Store) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query/latest) + [Axios](https://axios-http.com/) |
| **Form Handling** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) Validation |
| **PWA & Offline** | Standalone Web Manifest + Cache-First Service Worker Shell |

---

## 📂 Project Architecture

```text
besafe-web/
├── app/                              # Next.js App Router Pages
│   ├── (auth)/                       # Authentication routes (login, register)
│   ├── dashboard/                    # Agency Command Console
│   │   ├── admin/agencies/           # Super Admin Inter-Agency Matrix
│   │   ├── alerts/                   # Live Incident Dispatch & Triage
│   │   ├── map/                      # Full-Screen Tactical Mapbox Radar
│   │   ├── reports/                  # SafeChat Intelligence & AI Dossiers
│   │   ├── settings/                 # Agency Profile, Geolocation & Passcode
│   │   ├── team/                     # Agency Staff & Dispatcher Management
│   │   ├── layout.tsx                # Authenticated Navigation & Header Shell
│   │   └── page.tsx                  # Command Center HUD & Metrics Overview
│   ├── layout.tsx                    # Root Layout, PWA Meta & Providers
│   └── page.tsx                      # Public Tactical Landing Page & Download Showcase
├── components/                       # Reusable UI & Domain Components
│   ├── alerts/                       # Alert Cards, Detail Drawers & Triage Actions
│   ├── dashboard/                    # HUD Metric Widgets, Trend Charts & Live Feeds
│   ├── layout/                       # Agency Sidebar, Topbar, Nav Items & Breadcrumbs
│   ├── map/                          # Mapbox GL Canvas, Custom Markers & Modals
│   ├── pwa/                          # PWA Service Worker Registration
│   ├── reports/                      # SafeChat Dossiers, AI Tags & Timeline Viewer
│   └── ui/                           # Base Design System (Buttons, Badges, Modals, Tabs)
├── hooks/                            # Custom React Hooks (useSocket, useAuth, useAlerts)
├── lib/                              # API Clients, Utilities, WebSocket Singleton & Auth Cookies
├── providers/                        # QueryClientProvider, AuthProvider, SocketProvider
├── public/                           # Static Assets, Manifest, Service Worker & Shield SVG Icons
├── stores/                           # Zustand Stores (authStore, alertStore, telemetryStore)
└── types/                            # TypeScript Domain Definitions (Alert, Agency, Report, User)
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm** / **pnpm** / **yarn**

### 2. Installation
```bash
# Clone the official repository
git clone git@github.com:Besafe-Enterprise/besafe-web-app.git
cd besafe-web-app

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Backend API & WebSocket Endpoint
NEXT_PUBLIC_API_URL=https://besafe-server-production.up.railway.app
NEXT_PUBLIC_SOCKET_URL=https://besafe-server-production.up.railway.app

# Mapbox GL Access Token
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
```


### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the landing page, or navigate to [http://localhost:3000/login](http://localhost:3000/login) to access the Agency Command Portal.

---

## 🏗️ Production Build & Verification

```bash
# Compile and optimize production bundle
npm run build

# Start production server
npm run start
```

---

## 🛡️ Security & Protocol Standards

- **Zero-Trust Token Management**: Agency session tokens stored in secure, SameSite HTTP cookies.
- **WebSocket Reconnection Resiliency**: Auto-reconnect exponential backoff with synchronized offline ping re-querying.
- **Terminology Protocol**: Standardized on **Agency / Support NGO / Emergency Response Unit** terminology across all user-facing interfaces.
