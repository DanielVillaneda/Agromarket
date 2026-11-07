# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

AgroMarket is an agricultural marketplace: an Ionic 9 / Angular 22 frontend (repo root, also packaged for Android via Capacitor) plus a separate Express + Prisma + PostgreSQL API in `backend/`. Code, comments, UI text, route paths and error messages are all in Spanish. Keep it that way.

## Commands

Frontend (repo root):
```bash
npm start                      # ng serve (dev env points at http://localhost:3000/api)
npm run build                  # production build to www/ (swaps in environment.prod.ts)
npm run lint                   # angular-eslint over src/**/*.ts and src/**/*.html
npm test                       # Vitest via @angular/build:unit-test (jsdom, watch mode)
npx ng test --watch=false      # single run (same as --configuration ci)
npx ng test --watch=false --include src/app/pages/home/home.page.spec.ts   # one spec file
npx cap sync android           # copy www/ into the Android project after a build
```

Backend (`cd backend`, needs Node >= 20 and a `.env` copied from `.env.example`):
```bash
npm run dev                    # tsx watch src/server.ts on :3000 (GET /api/health to check)
npm run build && npm start     # tsc to dist/, then run it
npx prisma migrate dev --name <name>   # after editing prisma/schema.prisma
npm run prisma:seed            # sample data; all seed users use password agromarket123
npx prisma studio
```
Seed accounts include `demo@agromarket.co` (owns products) and `admin@agromarket.co` (role admin, for `/admin`). The backend has no test suite; `npx tsc --noEmit` is the type check.

If `SMTP_USER`/`SMTP_PASS` are empty, account recovery codes are printed to the server console instead of being emailed.

## Architecture

### Frontend (`src/app`)
- Standalone components only, bootstrapped in `src/main.ts`. No NgModules. Every page is lazy loaded through `loadComponent` in `app.routes.ts`. `/login` and `/registro` both render `LoginPage`. Pages that need a session use `authGuard`, and `/admin` uses `adminGuard`.
- Ionicons are registered centrally in `src/app/icons.ts` (imported for side effects in `main.ts`). A new icon has to be added there or it won't render.
- State lives in signals inside root services, not in a store:
  - `AuthService` holds the user signal and keeps the JWT and user in `localStorage` (`AUTH_TOKEN_KEY`).
  - `auth.interceptor.ts` attaches `Authorization: Bearer`. On a 401 it logs out and redirects to `/login`.
  - `ProductsService` wraps every marketplace endpoint (products, favorites, cart, purchases, recently viewed) and exposes read-only signals. An `effect` on `auth.isAuthenticated()` reloads or clears all session-dependent data on login and logout. Pages read those signals directly. After a mutation, update the service's signals instead of keeping local copies.
  - `ProductsService.mapProduct` converts the API shape (`ApiProduct`, with numeric `price`/`quantity`) into the UI `Product` type defined in `components/product-card/product-card.component.ts`, which uses formatted strings.
- Unit conversion (`kilo`/`tonelada`/`libra` convert between each other; `litro` and `unidad` don't convert) is duplicated in `services/products.service.ts` and `backend/src/lib/units.ts`. Keep the two copies in sync.
- Product photos are base64 data URLs sent in JSON bodies. There is no file storage, so the backend JSON limit is set to 15 MB. `services/image-utils.ts` handles client-side processing.
- `src/test-setup.ts` polyfills `window.matchMedia` for jsdom, because Ionic components need it.

### Backend (`backend/src`)
- `app.ts` mounts one router per feature folder under `/api/<feature>`: auth, products, favorites, cart, purchases, recently-viewed, profile, admin. `backend/README.md` has the endpoint table and maps each endpoint to its frontend counterpart.
- Module pattern: `*.routes.ts` uses `asyncHandler`, validates input with Zod schemas from `*.schemas.ts`, parses path ids with `lib/params.parseId`, throws helpers from `lib/httpError` (`badRequest`, `forbidden`, `notFound`, ...), and lets `middleware/errorHandler` format the response. Products go out through `product.serializer.ts` (`productInclude` + `serializeProduct`).
- Auth middleware (`middleware/auth.ts`):
  - `requireAuth` verifies the JWT and also loads the user, so blocked accounts get a 403. It sets `req.userId` and `req.userRole`.
  - `attachUserIfPresent` is for public routes whose behavior changes with a session. For example, `GET /api/products` leaves out the caller's own products unless `?includeMine=true` is passed.
  - `requireAdmin` must run after `requireAuth`.
- `User.role` is a string, either `"user"` or `"admin"`. No public flow grants admin.
- Required env vars (`DATABASE_URL`, `JWT_SECRET`) are checked at startup in `lib/env.ts`. CORS allows the comma-separated `CORS_ORIGIN` list plus any localhost origin.

### Deployment
- The frontend deploys to Vercel (`vercel.json`): it builds `www/`, proxies `/api/*` to the backend on Render (`agromarket-api-5yzi.onrender.com`), and sends every other path to the SPA fallback. That proxy is why `environment.prod.ts` uses the relative `apiUrl: '/api'`. `.vercelignore` excludes `backend/` and `android/`.
- The backend deploys separately (Render) from `backend/`.
