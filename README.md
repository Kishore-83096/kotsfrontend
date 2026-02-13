# KOTS Angular Frontend

## Summary
This project is the Angular frontend for the KOTS rental platform.  
It provides a role-aware UI for:
- `user`: authentication, profile/account management, property discovery, search, and bookings.
- `admin`: building/tower/flat/amenity CRUD workflows and booking status operations.
- `master`: admin creation and admin listing/management views.

The app is built with Angular standalone components, Angular Router, reactive forms, and typed API envelopes aligned with the Flask backend.

## Why This Frontend Exists
This frontend is used to turn the backend APIs into an end-to-end operational UI:
- Users can discover flats/buildings visually, search by location/rent/type, and create bookings.
- Admins can manage inventory and booking decisions from dedicated pages.
- Master users can manage admins from a privileged panel.
- Common UX concerns (global loading, skeletons, image loading states, modal flows) are handled consistently across the app.

## Directory Structure
```text
kots_frontend/
  src/
    index.html                # App shell, fonts, favicon
    main.ts                   # Angular bootstrap
    styles.css                # Global styles, skeletons, modal and transition utilities
    theme.css                 # Design tokens (colors, typography, spacing, shadows)

    app/
      app.ts                  # Root app component (authenticated header, profile/search modals, global UI state)
      app.html
      app.css
      app.routes.ts           # Route map and page wiring
      app.config.ts           # Router + HttpClient + interceptor providers
      route_prefetch_resolvers.ts  # Route-level data prefetch and auth redirect logic

      shared/
        http_loading_state.ts
        http_loading_interceptor.ts
        image_preview_state.ts

      users_users/
        api_users.ts
        api_users_auth.ts
        state_users_auth.ts
        typescript_users/type_users.ts
        pages_users_landing/
        pages_users_login/
        pages_users_register/
        pages_users_welcome/
        pages_users_building_towers/
        pages_users_tower_detail/
        pages_users_flat_detail/
        pages_users_bookings/
        pages_users_flat_search/
        pages_users/

      admins_admins/
        api_admins.ts
        typescript_admins/type_admins.ts
        styles_admins/style_admins.css
        pages_admins/
        pages_admins_building_detail/
        pages_admins_tower_detail/

      master_master/
        api_master.ts
        typescript_master/type_master.ts
        styles_master/style_master.css
        pages_master/

      all_health_check/
        pages_all_health_check/

  public/
    favicon.ico
    kots_icon.png
    kots_icon.ico
```

## Tech Stack
- Angular `21.x` (standalone component architecture)
- TypeScript `5.9.x`
- RxJS `7.8.x`
- Angular Router + route resolvers
- Angular Reactive Forms
- Vitest (unit test runner via Angular test target)

## Core Architecture
- **Root shell (`App`)** handles:
  - authenticated global header/navigation
  - global search modal (flat/building modes)
  - profile/account modal with update/delete/picture flows
  - global loading line and image-preview modal
- **Feature-first structure**:
  - users, admins, and master each have dedicated page components + typed API clients.
- **Typed transport layer**:
  - API functions in `api_*.ts` map directly to backend endpoints with typed response envelopes.
- **Cross-cutting services**:
  - `UsersAuthState` for token/session persistence
  - `HttpLoadingState` + interceptor for request lifecycle tracking
  - `ImagePreviewState` for full-screen image preview flow

## Routing
Defined in `src/app/app.routes.ts`.

### Public Routes
- `/` -> user landing page
- `/users/login`
- `/users/register`
- `/all-health-check`

### User Routes
- `/home` (prefetch: users buildings)
- `/users/bookings` (prefetch: user bookings)
- `/users/flats/search` (prefetch: search endpoint warmup)
- `/users/buildings/:buildingId/towers` (prefetch: buildings + towers)
- `/users/buildings/:buildingId/towers/:towerId` (prefetch: tower + flats)
- `/users/buildings/:buildingId/towers/:towerId/flats/:flatId` (prefetch: flat detail + bookings)

### Admin Routes
- `/admins` (prefetch: owned buildings)
- `/admins/buildings/:buildingId` (prefetch: building + towers)
- `/admins/buildings/:buildingId/towers/:towerId` (prefetch: tower + flats)

### Master Routes
- `/master` (prefetch: admins list)

### Fallback
- `**` -> redirects to `/`

## Route Prefetch Strategy
`src/app/route_prefetch_resolvers.ts` preloads critical route data before navigation completes:
- reduces stale-screen flashes during page transitions
- redirects to `/users/login` on backend `401`
- validates route params (`buildingId`, `towerId`, `flatId`) before prefetch calls

## Authentication & Session State
- Stored in `localStorage` via `UsersAuthState`:
  - `kots_users_access_token`
  - `kots_users_last_login_result`
- Login/registration flows set auth state and route to `/home`.
- Unauthorized API responses clear auth state and route user back to `/users/login`.

## Global UX Patterns
- **Loading line**: request-level progress line in authenticated header.
- **Login->Home transition overlay**: welcome-style skeleton shown specifically during public-entry to `/home` navigation.
- **Skeleton loaders**: page and modal placeholders while data is in-flight.
- **Image load tracking**: dynamic image skeleton/loading classes applied by root observer logic.
- **Global search modal**: supports `flat` and `building` search tabs.

## API Integration (Frontend Clients)

### Users Client (`api_users_auth.ts`)
- Auth: register, login, logout
- Profile/account: `/users/me`, `/users/profile`, profile picture upload/remove
- Discovery: buildings, towers, flats, amenities
- Search:
  - `/users/flats/search`
  - `/users/buildings/search`
- Bookings: create booking, list bookings, booking detail

### Admin Client (`api_admins.ts`)
- Building CRUD
- Tower CRUD
- Flat CRUD
- Amenity CRUD + flat-amenity mapping
- Booking list/detail/status update

### Master Client (`api_master.ts`)
- Master health
- List admins
- Create admin
- Admin detail endpoint helper

## Configuration Notes
- Backend base URL is currently hardcoded as `http://127.0.0.1:5000` in pages/root/resolvers.
- Production and component-style budgets are configured in `angular.json`:
  - initial bundle warning/error: `500kB / 1MB`
  - any component style warning/error: `4kB / 8kB`
- Current builds may show warnings for budget overages in some components; these are warnings unless thresholds are exceeded at error level.

## Run & Build
From `kots_frontend/`:

```bash
npm install
npm start
```

App runs at:
- `http://localhost:4200`

Production build:

```bash
npm run build
```

Build output:
- `dist/kots_frontend/`

Unit tests:

```bash
npm test
```

## Backend Dependency
This frontend expects the Flask backend to be running at:
- `http://127.0.0.1:5000`

Recommended startup order:
1. Start Flask backend
2. Start Angular frontend
3. Login and verify `/home`, search, and bookings flows
