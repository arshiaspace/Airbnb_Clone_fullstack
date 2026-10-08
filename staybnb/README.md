# Staybnb — Airbnb-inspired full-stack marketplace

An independently implemented, Airbnb-inspired educational demo with browsable property listings, live filters, persistent SQLite bookings, guest wishlist, checkout and host listing management. Not affiliated with Airbnb. Payment and user identities are mocked. UI pricing is in **USD**.

## Tech stack
- **Frontend:** Next.js App Router, React, TypeScript, lucide-react, plain responsive CSS.
- **Backend:** Python FastAPI, Pydantic validation, SQLAlchemy ORM.
- **Database:** SQLite (foreign keys enabled, WAL mode); automatically generated and seeded on first API startup.
- **Images:** Hotlinked public Unsplash images (internet connection required).

## Run locally

Requirements: Node.js 20+, Python 3.10+.

### Terminal 1 — API
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Open http://localhost:8000/docs for interactive Swagger API documentation. SQLite file is created at `backend/staybnb.db`.

### Terminal 2 — web app
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
On Windows PowerShell: `Copy-Item .env.example .env.local`.
Open http://localhost:3000. The app connects to `http://localhost:8000` unless changed in `.env.local`.

## Demo user model
Top-right avatar menu switches between **Alex (guest, user 1)**, **Sofia (host, user 2)**, and **Jamie (host, user 3)**. The choice is saved in localStorage. There is NO real authentication: the `user_id` query parameter is intentionally trusted for this assignment demo; never use this authorization strategy in production.

## Supported journeys
1. Explore 16 seeded stays; search by city/title/country, filter by category, price, amenity, guest count, available dates, and paginate.
2. Open a listing to see photo gallery, host, reviews, amenities, booked dates, and price summary.
3. Choose dates and guests, continue to mock checkout, confirm reservation, and view persistent booking in **Trips**. Existing reservations exclude overlapping intervals (`existing.check_in < requested.check_out AND existing.check_out > requested.check_in`); consecutive back-to-back stays remain valid. Seeded reservations on listings 1, 3, and 6 demonstrate unavailable dates.
4. Switch to Sofia/Jamie, create a property with URLs, edit or delete owned listings, and see bookings on the hosting dashboard.
5. Save/unsave favorites using the heart icons; use the Wishlists tab (favorites on currently loaded page).

## Architecture
```
frontend/
  app/                     Next.js routes: home, listings/[id], checkout/[id], trips, host
  components/              Header, ListingCard, Providers (demo user, favorites, toasts)
  lib/api.ts                Typed HTTP client and formatting utilities
backend/
  main.py                   SQLAlchemy models, Pydantic contracts, seeding, routes
  requirements.txt
render.yaml                 Render persistent disk deployment blueprint
```

## SQLite database schema
- `users(id PK, name, avatar)`
- `listings(id PK, host_id FK→users, title, description, location, country, category, price, max_guests, bedrooms, beds, baths, photos_json, amenities_json, rating)`
- `bookings(id PK, listing_id FK→listings ON DELETE CASCADE, guest_id FK→users, check_in, check_out, guests, total, status, created_at)`
- `reviews(id PK, listing_id FK→listings ON DELETE CASCADE, author, body, rating)`
- `favorites(user_id FK→users, listing_id FK→listings, composite PK)`

Listings/booking/user data persist across server restarts. Deleting a listing cascades and deletes its bookings and reviews; UI shows a confirmation. This is acceptable for a demo; production systems should archive listings/bookings instead. `photos_json`/`amenities_json` are simplified serialized lists rather than normalized image/amenity tables. SQLite `BEGIN IMMEDIATE` serializes booking writes so concurrent booking attempts cannot both succeed. For PostgreSQL production usage, use row locks or dedicated exclusion constraints.

## API endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/users` | Demo accounts |
| GET | `/api/listings` | Filter & paginate (`q`, `category`, `min_price`, `max_price`, `guests`, `check_in`, `check_out`, `amenities`, `page`, `limit`) |
| GET | `/api/listings/{id}` | Listing + blocked intervals + reviews |
| POST | `/api/listings?user_id=2` | Create as host |
| PUT | `/api/listings/{id}?user_id=2` | Update as owner |
| DELETE | `/api/listings/{id}?user_id=2` | Delete as owner |
| POST | `/api/bookings?user_id=1` | Validate and reserve |
| GET | `/api/bookings?user_id=1` | Guest trips |
| GET | `/api/host/dashboard?user_id=2` | Listings and incoming bookings |
| GET | `/api/favorites?user_id=1` | Favorite IDs |
| POST | `/api/favorites/{id}?user_id=1` | Toggle favorite |

## Deployment
1. Push the `staybnb` folder as a new **public** repository on GitHub. Do not commit `.env.local`, SQLite files, or `.venv`.
2. Deploy the API on Render using `render.yaml`; provision a **persistent disk** and set `CORS_ORIGINS=https://YOUR-VERCEL-APP.vercel.app`. Render persistent disk availability depends on plan. Do not use ephemeral SQLite in hosted environments if bookings must survive redeploys.
3. Import GitHub repository in Vercel; set **Root Directory** `frontend` and environment variable `NEXT_PUBLIC_API_URL=https://YOUR-RENDER-API.onrender.com` (no trailing slash). Deploy.
4. Update the API's `CORS_ORIGINS` with the deployed Vercel URL, redeploy API, and confirm guest-to-booking flow.
5. Test both frontend/backend URLs before submission. These services are *not* deployed automatically by this zip.

## Constraints and assumptions
- Payments, messaging, login and geolocation are mocked. No actual payment data is stored.
- Check-in date is inclusive and check-out exclusive; service fee is a flat 12% of subtotal; no separate taxes.
- The app provides a date-range experience using two native date inputs rather than a custom visual calendar; booked dates are enforced by the backend and conflicts are shown to guests.
- Photo input supports image URLs, not binary uploads. Category tabs and responsive layout mirror familiar accommodation marketplace patterns without copying any external repository.
- For a production implementation, replace trusted query-string user IDs with authenticated sessions, add migrations and tests, upload images to storage, and use a managed DB.

## Useful commands
```bash
# Frontend static type-check
cd frontend && npm run lint
# Build
cd frontend && npm run build
# Quick backend syntax check
cd backend && python -m py_compile main.py
```
