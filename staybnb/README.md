# Staybnb — Airbnb-inspired full-stack booking application

**Live demo:** https://staybnb-airbnb-clone.vercel.app/  
**API documentation:** https://arshiaspace.pythonanywhere.com/docs  
**Source:** https://github.com/arshiaspace/Airbnb_Clone_fullstack

Staybnb is an independently built educational accommodation-booking marketplace inspired by Airbnb's browsing and reservation experience. It supports browsing and filtering properties, viewing listing details, selecting dates, mock checkout, persistent reservations, wishlists, and host listing management. This is a demonstration project, **not affiliated with Airbnb**.

## Tech stack

| Layer | Implementation |
| --- | --- |
| Frontend | Next.js 15 App Router, React 19, TypeScript, lucide-react, CSS |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy ORM |
| Database | SQLite (foreign keys, WAL mode) |
| Frontend hosting | Vercel |
| Backend hosting | PythonAnywhere (experimental ASGI hosting) |
| Images | Public external Unsplash URLs; URL-based host photo input |

## Key features

- Property grid, destination search, category filters, price and amenity filters, guest capacity and availability search, pagination.
- Interactive home search: destination suggestions, two-month date-range picker, adult/child guest counters.
- Listing galleries, amenities, host details, reviews, date availability, 12% service-fee price breakdown.
- Bookings: validate check-in and checkout, prevent overlaps, confirm a mocked checkout and show persistent trips.
- Host dashboard: create/edit/delete owned listings, view reservations and statistics.
- Demo users (Alex guest; Sofia and Jamie hosts), favorites/wishlists and toast notifications.
- Responsive desktop and mobile layouts.

## Repository layout

The GitHub repository has an outer `staybnb/` directory:

```text
Airbnb_Clone_fullstack/
  .gitignore
  README.md                  # this document (recommended location)
  staybnb/
    frontend/
      app/                   # Home, listing detail, checkout, trips, host
      components/            # Header, HomeSearch, AvailabilityCalendar, ListingCard, Providers
      lib/api.ts             # Typed API client
      .env.example
      package.json
    backend/
      main.py                # ORM models, Pydantic schemas, API, seed logic
      requirements.txt
    render.yaml              # Optional alternative hosting blueprint
```

## Run locally

**Prerequisites:** Node.js 20+, Python 3.10+, Git.

In terminal 1, from the repository root:

```powershell
cd staybnb/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows PowerShell
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload
```

On macOS/Linux, activate with `source .venv/bin/activate`. API Swagger docs: http://127.0.0.1:8000/docs.

In terminal 2, from the repository root:

```powershell
cd staybnb/frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

For macOS/Linux use `cp .env.example .env.local`. In `.env.local` set:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Open http://localhost:3000. If using a different local backend origin, set `CORS_ORIGINS` accordingly. Local SQLite defaults to `staybnb/backend/staybnb.db` when running from the backend directory; it is created automatically on the first API startup and should not be committed.

## Database design

SQLAlchemy creates the following SQLite tables at startup:

| Table | Main fields and relationships |
| --- | --- |
| `users` | `id` PK, `name`, `avatar` |
| `listings` | `id` PK, `host_id` FK → users; title, description, location, country, category, price, occupancy, bedroom/bed/bath counts, photos_json, amenities_json, rating |
| `bookings` | `id` PK, `listing_id` FK → listings, `guest_id` FK → users, check_in, check_out, guests, total, status, created_at |
| `reviews` | `id` PK, `listing_id` FK → listings, author, body, rating |
| `favorites` | composite PK `(user_id, listing_id)`, both foreign keys |

A listing belongs to a host; a booking references a listing and guest. Deleting a listing cascades to its bookings and reviews in this demo. Image URLs and amenities are stored as serialized JSON arrays for simplicity. Schema migrations are not implemented; the project initializes tables via SQLAlchemy `create_all`.

### Booking consistency

Dates follow the half-open interval `[check_in, check_out)`: guests may check in on a prior guest's checkout date. Two bookings overlap when:

```text
existing.check_in < new.check_out AND existing.check_out > new.check_in
```

Booking creation validates dates and capacity and uses SQLite `BEGIN IMMEDIATE` to serialize writes before checking overlap and committing. The backend is the final authority for availability, even if the UI showed an earlier available date. Pricing uses nightly subtotal + 12% service fee; real payments and taxes are out of scope.

## API overview

Interactive contract and request/response schemas: [Swagger UI](https://arshiaspace.pythonanywhere.com/docs).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | API health check |
| GET | `/api/users` | Available demo users |
| GET | `/api/listings` | Filtered/paginated listings; parameters include `q`, `category`, `min_price`, `max_price`, `guests`, `check_in`, `check_out`, `amenities`, `page`, `limit` |
| GET | `/api/listings/{listing_id}` | Details, reviews, booked dates |
| POST | `/api/listings?user_id=2` | Create host listing |
| PUT | `/api/listings/{listing_id}?user_id=2` | Update owned listing |
| DELETE | `/api/listings/{listing_id}?user_id=2` | Delete owned listing |
| POST | `/api/bookings?user_id=1` | Create a reservation |
| GET | `/api/bookings?user_id=1` | Guest's trips |
| GET | `/api/host/dashboard?user_id=2` | Host listings and reservations |
| GET | `/api/favorites?user_id=1` | Favorite listing IDs |
| POST | `/api/favorites/{listing_id}?user_id=1` | Toggle a favorite |

## Deployment (current live setup)

**Frontend — Vercel**
1. Import `arshiaspace/Airbnb_Clone_fullstack`.
2. Set **Root Directory** to `staybnb/frontend` and Framework to Next.js.
3. Set build-time environment variable `NEXT_PUBLIC_API_URL=https://arshiaspace.pythonanywhere.com`.
4. Deploy; any change to this public variable needs a fresh frontend build.

**Backend — PythonAnywhere**
1. Clone the GitHub repository and install `staybnb/backend/requirements.txt` into a virtual environment.
2. Use PythonAnywhere's experimental ASGI hosting with Uvicorn bound to `${DOMAIN_SOCKET}`.
3. Configure a SQLite file outside the repository, for example:
   `DATABASE_URL=sqlite:////home/arshiaspace/staybnb-data/staybnb.db`.
4. Set `CORS_ORIGINS=https://staybnb-airbnb-clone.vercel.app,http://localhost:3000,http://127.0.0.1:3000` in the app startup environment.
5. Reload the PythonAnywhere website, then verify `/api/health` and `/api/listings`.

The free PythonAnywhere plan has resource and availability limits; the application is intended as an assignment demo, not a production service. The SQLite database is in persistent account file storage, not an ephemeral container directory. Test persistence after reloads. API source changes require pulling the repository updates on PythonAnywhere and reloading the site.

## Demo accounts and limitations

The avatar menu switches among Alex (guest ID 1), Sofia (host ID 2) and Jamie (host ID 3). Identity is **mocked**: APIs trust the `user_id` query parameter. **This is not secure authentication or authorization for a real public marketplace.** Other mock features include payment, messaging, location-map preview and identity checks. Photo uploads currently use URLs rather than binary storage. Favorite listing display may be limited to the current paginated result set. Display prices are in USD irrespective of the property's location.

## Verification and quality

```bash
# Frontend (from staybnb/frontend)
npm run lint        # TypeScript type check (script runs tsc --noEmit)
npm run build       # Next.js production compilation
npm audit           # Dependency advisories

# Backend (from staybnb/backend, virtualenv active)
python -m pip check
python -m py_compile main.py
```

Functional testing should cover search/filter, date constraints, booking persistence after refresh and service restart, overlap rejection, guest/host views and host create/edit/delete. The frontend was tested with a successful local production build; no automated end-to-end suite is included.

## Future improvements

Authenticated user accounts and authorization, normalized photos/amenities, Alembic migrations, automated integration/e2e tests, a managed transactional database for higher concurrency, binary image uploads and polished maps/reviews.

