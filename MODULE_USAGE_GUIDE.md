# KOTS Frontend UI Usage Guide (Users, Admins, Master)

This is a UI-first explanation of how the frontend works: layout behavior, navigation flow, and action-to-API mapping (GET/POST/PUT/DELETE).

## 1. UI Design System (What CSS is doing)

Global visual language:
- Warm paper-style palette from `src/theme.css` (`--color-primary`, `--color-surface`, `--gradient-page`).
- Two-font hierarchy: sans for data (`--font-sans`) and serif for headings (`--font-display`).
- Card-first layout across all modules (`box-shadow: var(--shadow-card)` + bordered panels).
- Sticky headers inside pages (`.content-header`) so title/actions stay visible while scrolling.
- Skeleton loaders (`.skeleton-block`) while API calls are in progress.
- Standard modal behavior in `src/styles.css`:
  - Background is locked when modal is open.
  - Modal header is sticky.
  - Modal body scrolls independently.
- Responsive collapse:
  - Desktop is usually multi-column card grids.
  - Mobile collapses to single column (`@media` rules in each page css).

Global shell behavior:
- Authenticated users see a fixed top header with Home, Bookings, Search, Profile, Logout.
- Role badges (ADMIN/MASTER) appear in header only when account role has access.
- On smaller screens, actions move into compact dropdown menu.

## 2. Route-Level Navigation Map

Defined in `src/app/app.routes.ts`:
- Public: `/`, `/users/login`, `/users/register`
- User module:
  - `/home`
  - `/users/flats/search`
  - `/users/bookings`
  - `/users/buildings/:buildingId/towers`
  - `/users/buildings/:buildingId/towers/:towerId`
  - `/users/buildings/:buildingId/towers/:towerId/flats/:flatId`
- Admin module:
  - `/admins`
  - `/admins/buildings/:buildingId`
  - `/admins/buildings/:buildingId/towers/:towerId`
- Master module:
  - `/master`

Route resolvers prefetch protected data and redirect to `/users/login` on 401 (see `src/app/route_prefetch_resolvers.ts`).

## 3. Users Module UI Usage

### 3.1 Home / Buildings (`/home`)

UI behavior:
- Grid of building cards.
- Each card shows image, address, tower count, total flats, available flats.
- `View Amenities` opens amenities modal for selected building.
- Clicking a building card navigates to towers page.

Navigation:
1. Login/Register
2. `/home`
3. Click building -> `/users/buildings/:buildingId/towers`

API actions:
- `GET /users/buildings`
- `GET /users/profile` (welcome identity)
- `GET /users/buildings/{buildingId}/amenities` (modal)

### 3.2 Building Towers (`/users/buildings/:buildingId/towers`)

UI behavior:
- Tower cards with total flats and available flats.
- Building hero/media card with hover overlay details.
- `View Amenities` opens building amenities modal.
- Click tower card to open flats list.

Navigation:
1. From `/home`, click building
2. Click tower -> `/users/buildings/:buildingId/towers/:towerId`

API actions:
- `GET /users/buildings/{buildingId}/towers`
- `GET /users/buildings`
- `GET /users/buildings/{buildingId}/amenities`

### 3.3 Tower Flats (`/users/buildings/:buildingId/towers/:towerId`)

UI behavior:
- Flat cards in responsive grid.
- Each card shows flat number, floor, BHK, area, rent, deposit, availability status chip.
- `View Amenities` opens building amenities modal.
- Click flat card to open flat detail screen.

API actions:
- `GET /users/buildings/{buildingId}/towers/{towerId}`
- `GET /users/buildings/{buildingId}/towers/{towerId}/flats`
- `GET /users/buildings/{buildingId}/amenities`

### 3.4 Flat Detail + Booking (`/users/buildings/:buildingId/towers/:towerId/flats/:flatId`)

UI behavior:
- Sticky top section with back button and booking action.
- `Book Flat` disabled when unavailable or already booked by current user.
- Flat image gallery with prev/next controls and thumbnail strip.
- Amenities section with amenity detail modal.
- Booking modal confirms booking and shows booking id/status after success.

API actions:
- `GET /users/buildings/{buildingId}/towers/{towerId}/flats/{flatId}`
- `GET /users/buildings/{buildingId}/towers/{towerId}/flats/{flatId}/pictures`
- `GET /users/bookings` (to check already-booked condition)
- `POST /users/flats/{flatId}/bookings`

### 3.5 Search Flats/Buildings (`/users/flats/search`)

UI behavior:
- Sticky search header.
- Dropdown filter panel with two tabs:
  - Flat mode: address/city/state/flat type/rent range/available-only
  - Building mode: name/address/city/state
- Result cards are clickable:
  - Flat result -> flat detail page
  - Building result -> building towers page

API actions:
- `GET /users/flats/search?...`
- `GET /users/buildings/search?...`

### 3.6 My Bookings (`/users/bookings`)

UI behavior:
- Booking cards with status, building/tower/flat, rent/deposit, manager info.
- `View Details` opens booking detail modal.
- Modal includes "View Flat Details" deep link.

API actions:
- `GET /users/bookings`
- `GET /users/bookings/{bookingId}`
- `GET /users/buildings/{buildingId}/towers/{towerId}/flats/{flatId}` (preview/details enrichment)

## 4. Admin Module UI Usage

## 4.1 Admin Home (`/admins`)

UI behavior:
- Building management cards for only "my buildings".
- Top actions:
  - `Create Building` (modal form + optional image upload)
  - `Bookings` (modal list + booking detail modal + status update)
- `Manage Building` navigates to building detail page.

API mapping:
- GET:
  - `GET /admins/buildings/my`
  - `GET /admins/bookings`
  - `GET /admins/bookings/{bookingId}`
- POST:
  - `POST /admins/buildings`
- PUT:
  - `PUT /admins/bookings/{bookingId}/status`

## 4.2 Admin Building Detail (`/admins/buildings/:buildingId`)

UI behavior:
- Building overview card with chips and image.
- Towers section with cards and `Manage Tower`.
- Header action group:
  - Update Building
  - Add Tower
  - Add Amenity
  - View Amenities (list modal with edit/delete)
  - Delete Building

API mapping:
- GET:
  - `GET /admins/buildings/{buildingId}`
  - `GET /admins/buildings/{buildingId}/towers`
  - `GET /admins/buildings/{buildingId}/amenities`
- POST:
  - `POST /admins/buildings/{buildingId}/towers`
  - `POST /admins/buildings/{buildingId}/amenities`
- PUT:
  - `PUT /admins/buildings/{buildingId}`
  - `PUT /admins/amenities/{amenityId}`
- DELETE:
  - `DELETE /admins/buildings/{buildingId}`
  - `DELETE /admins/amenities/{amenityId}`

## 4.3 Admin Tower Detail (`/admins/buildings/:buildingId/towers/:towerId`)

UI behavior:
- Tower overview + flats list.
- Flat action buttons:
  - Manage Pictures
  - Link Amenities
  - Update Flat
  - Delete Flat
- Header actions:
  - Update Tower
  - Add Flat
  - Delete Tower

API mapping:
- GET:
  - `GET /admins/buildings/{buildingId}/towers/{towerId}`
  - `GET /admins/towers/{towerId}/flats`
  - `GET /admins/towers/{towerId}/flats/{flatId}`
  - `GET /admins/flats/{flatId}/pictures`
  - `GET /admins/buildings/{buildingId}/amenities` (for linking)
- POST:
  - `POST /admins/towers/{towerId}/flats`
  - `POST /admins/flats/{flatId}/pictures`
- PUT:
  - `PUT /admins/towers/{towerId}`
  - `PUT /admins/flats/{flatId}`
  - `PUT /admins/flats/{flatId}/pictures/{pictureId}`
  - `PUT /admins/flats/{flatId}/amenities` (link/unlink amenity ids)
- DELETE:
  - `DELETE /admins/towers/{towerId}`
  - `DELETE /admins/flats/{flatId}`
  - `DELETE /admins/flats/{flatId}/pictures/{pictureId}`

## 5. Master Module UI Usage (`/master`)

UI behavior:
- Admin cards list with pagination.
- `Create Admin` modal (email + password).
- Clicking admin card opens admin detail modal.
- Refresh button reloads current page.

API mapping:
- GET:
  - `GET /master/admins?page=...&per_page=10`
  - `GET /master/admins/{adminId}`
- POST:
  - `POST /master/create-admin`

## 6. Profile + Account UI in Global Header

Available from avatar/profile in authenticated header:
- Profile tab:
  - View profile details table
  - Update profile details
  - Upload/remove profile picture
  - Delete profile/account
- Account tab:
  - Update email/password
  - Delete account

API mapping:
- GET:
  - `GET /users/me`
  - `GET /users/profile`
- PUT:
  - `PUT /users/me`
  - `PUT /users/profile`
- POST:
  - `POST /users/profile/picture`
  - `POST /users/logout`
- DELETE:
  - `DELETE /users/me`
  - `DELETE /users/profile/picture`

## 7. Important UX Rules You Already Implemented

- Consistent loading skeletons for every major list and modal.
- Session expiry handling redirects to login across modules.
- Most destructive actions use confirmation or explicit modal steps.
- Data-heavy screens keep headers sticky for quick actions.
- Mobile layouts collapse grids/forms to single-column for readability.
