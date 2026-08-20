# AGENTS.md — Development & Architecture Guidelines

This document provides context, technical constraints, and development guidelines for AI agents, assistants, and software engineers contributing to the **BeSafe Web** application.

---

## 🏛️ Domain Architecture & Concepts

BeSafe is an enterprise emergency response platform connecting citizens in distress directly to verified law enforcement command centers, emergency units, and accredited support NGOs.

### Key Domain Entities:
- **Agency**: A verified emergency organization (e.g., Police Command, Fire & Rescue, Crisis NGO). Has physical GPS coordinates (`latitude`, `longitude`) used as the command center base for proximity routing.
- **Alert**: A high-priority SOS distress package triggered by a citizen (via manual trigger, continuous voice threat recognition, or safety check-in timeout). Contains real-time GPS coordinates, AI threat score, transcribed cues, and emergency contact list.
- **SafeChat Report**: A structured qualitative intelligence report submitted by a citizen (or stored in their local phone vault) regarding harassment, assault, transit danger, or domestic disturbance, analyzed by Gemini AI pipelines.
- **Staff / User Roles**:
  - `SUPER_ADMIN`: Global oversight of all registered agencies and server telemetry.
  - `AGENCY_ADMIN`: Manages agency metadata, geolocation coordinates, and staff rosters.
  - `OPERATOR`: Frontline dispatcher handling incoming distress alerts and case assignments.

---

## 💻 Tech Stack & Key Conventions

- **Framework**: Next.js 16 (App Router) + React 19.
- **Styling**: Tailwind CSS v4 using CSS variables and modern HSL dark theme.
- **State Management**: Zustand for client-side transient state (active alerts, telemetry, auth state). TanStack Query for server data synchronization and cache invalidation.
- **Realtime**: Socket.IO client (`socket_instance`) listening to events (`new_alert`, `location_update`, `alert_status_changed`, `staff_assigned`).

---

## ⚠️ Critical Development Rules

### 1. Terminology Compliance
- **Rule**: NEVER use the word "Station" in user-facing copy, headers, badges, or navigation.
- **Correct**: Always use **"Agency"**, **"Agency Headquarters"**, **"Response Unit"**, or **"Support NGO"**.

### 2. Mapbox GL JS DOM Marker Rule
- **Rule**: Never apply CSS `hover:scale-*`, `transition-transform`, or custom `transform` styles directly to the root element passed to `new mapboxgl.Marker({ element })`.
- **Reason**: Mapbox uses inline `transform: translate(x, y)` on the root container to position markers. Applying transform classes to the root element will break coordinate positioning and cause hover flickering.
- **Correct Implementation**:
  ```tsx
  // Wrapper for Mapbox positioning
  const wrapper = document.createElement("div");
  // Inner child handles visual styling, scaling, and hover effects
  const inner = document.createElement("div");
  inner.className = "transition-all duration-200 hover:scale-110";
  wrapper.appendChild(inner);
  new mapboxgl.Marker({ element: wrapper }).setLngLat([lng, lat]).addTo(map);
  ```

### 3. Coordinate Normalization
- Coordinates from backend endpoints or socket events may appear as `gps_lat`/`gps_lng` or `latitude`/`longitude` or nested `location: { latitude, longitude }`.
- Always use fallback extraction:
  ```ts
  const lat = alert.gps_lat ?? alert.location?.latitude ?? alert.latitude;
  const lng = alert.gps_lng ?? alert.location?.longitude ?? alert.longitude;
  ```

### 4. Production API & Socket Endpoints
- Production Backend: `https://besafe-server-production.up.railway.app`
- Always verify `.env.local` references `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL`.

---

## 🧪 Verification & Build Commands

Always run build checks before committing code:
```bash
# Verify TypeScript and Next.js bundle compilation
npm run build

# Run linter
npm run lint
```
