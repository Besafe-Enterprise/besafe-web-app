# CLAUDE.md — BeSafe Web Quick Reference

## Commands
- `npm run dev`: Start Next.js development server on `http://localhost:3000`
- `npm run build`: Compile and validate production bundle (run before any git commit)
- `npm run lint`: Run ESLint checks

## Core Architecture
- **Next.js 16 (App Router)** + **React 19** + **TypeScript 5**
- **Tailwind CSS v4**: Dark slate command center theme (`#070B14`, `#0F172A`, Primary `#353FAB`, Accent `#8B93FF`, Emerald `#10B981`)
- **Mapbox GL JS**: Tactical Radar canvas in `components/map/MapboxView.tsx` and `app/dashboard/map/page.tsx`
- **Socket.IO**: Real-time alerts and live GPS tracking in `lib/socket.ts` and `providers/socket-provider.tsx`
- **State**: Zustand stores (`stores/auth-store.ts`, `stores/alert-store.ts`) + TanStack Query

## Critical Rules
1. **Terminology**: Use **Agency**, **Agency HQ**, **Response Unit**, and **NGO** (NEVER "Station").
2. **Mapbox Markers**: Never apply `transition-transform` or `hover:scale-*` to the root marker element. Always wrap inside an inner child container to prevent map coordinate translation flickering.
3. **Coordinates**: Always normalize `gps_lat`/`gps_lng` alongside `location.latitude`/`location.longitude`.
4. **Backend URL**: Production is `https://besafe-server-production.up.railway.app`.
