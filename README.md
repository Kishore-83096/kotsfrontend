# KOTS Angular Frontend

## Summary
This project is the Angular frontend for the KOTS rental platform.  
It provides a role-aware UI for:
- `user`: authentication, profile/account management, property discovery, search, and bookings.
- `admin`: building/tower/flat/amenity CRUD workflows and booking status operations.
- `master`: admin creation and admin listing/management views.

The app is built with Angular standalone components, Angular Router, reactive forms, and typed API envelopes aligned with the Flask backend.

## Project Section
- **Main Live App (Frontend):** https://kots-frontend-445482244619.asia-south1.run.app
- **Live API (Backend):** https://kots-flask-445482244619.asia-south1.run.app
- **Deployment Platform:** Google Cloud Run (Docker)
- **Project Explanation:** KOTS is a rental management platform frontend where users can discover and book flats, admins can manage inventory and booking workflows, and master users can control admin access. The project focuses on role-based UX, reliable API integration, and production-oriented flows for property operations.

## Quick Run Modes
### 1) Normal Local Run (Frontend)
```bash
cd KOTS/angular/kots_frontend
npm install
npm start
```

### 2) Local Backend Run Reference (`run.py`)
```bash
cd KOTS/flask
python run.py
```

### 3) Dockerized Run (Local Frontend)
```bash
cd KOTS/angular/kots_frontend
docker compose up -d --build
docker compose logs -f frontend
```

### 4) Google Cloud Deployment (Mumbai)
#### Deploy Frontend (Docker -> Cloud Run)
```bash
docker build --build-arg APP_MODE=production --build-arg BACKEND_BASE_URL=https://<BACKEND_SERVICE_URL> -t asia-south1-docker.pkg.dev/<PROJECT_ID>/kots-flask-repo/kots-frontend:v1-india .
docker push asia-south1-docker.pkg.dev/<PROJECT_ID>/kots-flask-repo/kots-frontend:v1-india
gcloud run deploy kots-frontend --image asia-south1-docker.pkg.dev/<PROJECT_ID>/kots-flask-repo/kots-frontend:v1-india --region asia-south1 --platform managed --allow-unauthenticated --port 80
```

## Recent Backend-Driven Updates (Feb 2026)
- Backend response envelope was simplified:
  - Success: `status_code + data`
  - Error: `status_code + error`
- Backend now applies image-aware API caching for `GET` responses and returns `ETag`/`Cache-Control` headers.
- Backend now applies static asset cache policy (when assets are served via Flask):
  - `index.html` uses revalidation (`no-cache`)
  - hashed/static assets (`.js`, `.css`, fonts, images) use long immutable caching.
- Backend upload pipeline now compresses images to roughly `100KB` before Cloudinary upload.
- Search endpoints now use word-based address matching and ranking for better address discovery.

## Recent Frontend Updates (Mar 2026)
- Base URL `/` now redirects to `/home` (buildings-first entry).
- User browse flows are guest-accessible (no forced login for discovery pages).
- Global header is visible on browse pages for guests and shows `Not logged in`.
- Header login/register actions now route to the landing auth experience.
- Auth routes are unified on landing:
  - `/users/auth` -> landing (login tab)
  - `/users/login` -> landing (login tab)
  - `/users/register` -> landing (register tab)
- Flat detail booking flow for guests now opens a modal with login/register options.
- Post-auth redirect is supported with `returnUrl`:
  - users return to the same flat URL after login/register.
- Home page now includes a dedicated flats section (separate grid from buildings):
  - shows all flats with image, address, rent, security deposit, tower, building, and availability status.
- Home page section order updated:
  - flats section appears above buildings section.
- Flats section filters added:
  - `All`, `Available`, `Unavailable`.
- Home section pagination:
  - separate pagination for flats and buildings
  - page size set to `9` for both sections.
- Flats filter behavior improved:
  - filter is now global across pages (server-side status filtering)
  - filter labels show total counts (`All`, `Available`, `Unavailable`) for full result set, not just current page.
- Flats card amenities action:
  - button renamed to `Flat Amenities`
  - modal now shows amenities attached to that specific flat (same behavior as flat detail page)
  - flat amenities button is pinned consistently at the same card position.
- UI spacing/header polish:
  - fixed overlap between global header and page headers when header is active.
  - improved spacing/divider gap between flats and buildings sections.
- Search UX aligned to backend relevance:
  - typo-tolerant address search
  - closest matches first
  - unrelated address results excluded
- End-user error messages are more specific across key API flows:
  - clearer upload failures (for example: unable to upload image)
  - clearer auth/search/CRUD failure messaging in page-level error areas.
- Booking presentation updates:
  - user and admin booking views now show `Booking Date` and `Booking Time` labels
  - format: date `dd/mm/yy`, time `hh:mm am/pm`
  - time is displayed in IST (`Asia/Kolkata`) for consistency.
- Admin booking identity display:
  - admin booking UI shows `User` (`user_display`) and `User Email` instead of only `user_id`.

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
- `/` -> redirects to `/home`
- `/users/auth` (landing auth page)
- `/users/login` (landing auth page, login tab)
- `/users/register` (landing auth page, register tab)
- `/all-health-check`

### User Routes
- `/home` (prefetch: users buildings)
- `/users/bookings` (prefetch: user bookings)
- `/users/flats/search` (prefetch: search endpoint warmup)
- `/users/buildings/:buildingId/towers` (prefetch: buildings + towers)
- `/users/buildings/:buildingId/towers/:towerId` (prefetch: tower + flats)
- `/users/buildings/:buildingId/towers/:towerId/flats/:flatId` (prefetch: flat detail)

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
- redirects to `/users/login` on backend `401` for protected routes
- public browse routes prefetch without forcing auth redirects
- validates route params (`buildingId`, `towerId`, `flatId`) before prefetch calls

## Authentication & Session State
- Stored in `localStorage` via `UsersAuthState`:
  - `kots_users_access_token`
  - `kots_users_last_login_result`
- Login/registration flows set auth state and route to `returnUrl` when provided; fallback is `/home`.
- Unauthorized API responses clear auth state and route user back to `/users/login`.

## Global UX Patterns
- **Loading line**: request-level progress line in global header.
- **Login->Home transition overlay**: welcome-style skeleton shown specifically during public-entry to `/home` navigation.
- **Skeleton loaders**: page and modal placeholders while data is in-flight.
- **Image load tracking**: dynamic image skeleton/loading classes applied by root observer logic.
- **Global search modal**: supports `flat` and `building` search tabs.
- **Guest booking prompt**: flat-book action opens login/register modal for non-auth users.

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
- Backend base URL is generated into `src/app/shared/app_env.ts` by `scripts/generate-app-env.mjs` from `.env` or Docker build args.
- Google Cloud backend URL: `https://kots-flask-445482244619.asia-south1.run.app`
- Production and component-style budgets are configured in `angular.json`:
  - initial bundle warning/error: `500kB / 1MB`
  - any component style warning/error: `4kB / 8kB`
- Current builds may show warnings for budget overages in some components; these are warnings unless thresholds are exceeded at error level.

## Cloud Run Deploy Notes (PowerShell)
- Use PowerShell syntax while deploying from Windows:
  - variable assignment: `$TAG = "v2-mar-2026"`
  - multiline continuation: backtick (`` ` ``), not `\`
- Ensure `BACKEND_BASE_URL` build arg points to your active backend Cloud Run URL.

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

## Dockerized Run Guide
Use Docker Compose from `KOTS/angular/kots_frontend`.

### Prerequisites
- Docker Desktop installed and running.
- `docker-compose.yml` for containerized Nginx/production-style run.
- `docker-compose.dev.yml` for hot-reload development run.
- Optional `.env` with:
  - `FRONTEND_PORT` (default `4200`)
  - `FRONTEND_ALT_PORT` (default `10000`)
  - `BACKEND_BASE_URL` (example: `https://kots-flask-445482244619.asia-south1.run.app`)
  - `APP_MODE` (`development` or `production`)

### Production-Style Container Run (`docker-compose.yml`)
- Build and start:
```bash
docker compose up -d --build
```
- Start without rebuild:
```bash
docker compose up -d
```
- Stop:
```bash
docker compose stop
```
- Start stopped container:
```bash
docker compose start
```
- Restart:
```bash
docker compose restart
```
- Remove container + network:
```bash
docker compose down
```

### Development Container Run (`docker-compose.dev.yml`)
- Start dev server in Docker (with polling + live code mount):
```bash
docker compose -f docker-compose.dev.yml up -d
```
- Rebuild and start dev container:
```bash
docker compose -f docker-compose.dev.yml up -d --build
```
- Stop/remove dev container:
```bash
docker compose -f docker-compose.dev.yml down
```

### Useful Docker Commands
- Check status:
```bash
docker compose ps
```
- Tail frontend logs:
```bash
docker compose logs -f frontend
```
- Tail dev logs:
```bash
docker compose -f docker-compose.dev.yml logs -f frontend
```
- Open shell in frontend container:
```bash
docker compose exec frontend sh
```
- Fresh rebuild (no cache):
```bash
docker compose build --no-cache
docker compose up -d
```

### Access URLs
- Frontend: `http://127.0.0.1:4200`
- Alternate port (if configured): `http://127.0.0.1:10000`

## Backend Dependency
This frontend expects the Flask backend to be running at:
- `https://kots-flask-445482244619.asia-south1.run.app`

Recommended startup order:
1. Start Flask backend
2. Start Angular frontend
3. Login and verify `/home`, search, and bookings flows
