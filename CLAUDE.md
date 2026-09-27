# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es este repo

FlowSync: monorepo TypeScript de punta a punta con dos proyectos independientes (cada uno con su propio `package.json` y `node_modules`; no hay workspace raíz):

- `backend/` — API en **AdonisJS 7** (Lucid ORM sobre SQLite, VineJS, auth por access tokens). Ya existe y en el ejercicio de la sesión 1 **no se modifica**: solo se lee.
- `frontend/` — **React 19 + Vite 8** con **react-router 8** (modo librería), **Tailwind v4** (`@tailwindcss/vite`) y **shadcn/ui** (estilo `base-nova`, sobre Base UI). Aquí es donde se trabaja. Se formatea con Prettier (`.prettierrc.json`: sin `;`, comillas simples), que un hook de `.claude/settings.json` ejecuta tras cada Edit/Write en `frontend/`.

### Arquitectura del frontend

- Imports con alias `@/` → `frontend/src/` (definido en `tsconfig*.json` y `vite.config.ts`).
- `src/components/ui/`: componentes shadcn copiados al repo; se añaden con `npx shadcn@latest add <nombre>` (no a mano) y se editan libremente. Usan `cn` del paquete `cn` (de shadcn).
- `src/lib/api.ts`: `apiFetch<T>()` es la única vía para hablar con el backend. Base `VITE_API_URL` (por defecto `http://localhost:3333/api/v1`), desenvuelve `{ data }` y convierte cualquier fallo en `ApiError { status, fieldErrors, rules }` (status `0` = sin conexión). Las pantallas deciden el mensaje por `status` y por la regla VineJS (`rules[campo]`), nunca muestran el `message` en inglés del backend.
- `src/lib/auth.tsx`: `AuthProvider` / `useAuth()`; el token vive en `localStorage` (`flowsync.token`).
- Rutas en `src/App.tsx`: `GuestRoute` (`/login`, `/signup`) y `ProtectedRoute` (`/profile`) en `src/components/route-guards.tsx`; pantallas en `src/pages/*-page.tsx`. Textos de UI en español.

El `README.md` es la lección del ejercicio (generado, no se edita a mano). `prompts.md` es la plantilla donde el alumno registra los prompts lanzados.

Requiere **Node.js 24+** (con Node 20 el backend falla con `Unknown file extension ".ts"`).

## Comandos

Desde la raíz (macOS, Linux o Windows vía WSL; en WSL, clonar dentro de `~` y no en `/mnt/c`, y `sudo apt install make` si falta):

```bash
make setup   # npm ci en ambos, backend/.env si no existe, APP_KEY si está vacía, migraciones (repetible)
make start   # backend :3333 + frontend :5173 a la vez; Ctrl+C cierra los dos
```

`make start` lo orquesta `scripts/dev.mjs`, no un `a & b & wait`: en el sh de make los procesos en segundo plano ignoran SIGINT y `ace serve --hmr` ignora SIGTERM, así que quedaban servidores huérfanos. Si uno de los dos muere, el script para el otro. `.gitattributes` fuerza LF en el `Makefile` (con CRLF, make falla en WSL).

Backend (`cd backend`):

```bash
npm install
cp .env.example .env && node ace generate:key   # primera vez
node ace migration:run                           # crea backend/tmp/db.sqlite3
npm run dev          # node ace serve --hmr → http://localhost:3333
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run format       # prettier (@adonisjs/prettier-config)
npm test             # node ace test
node ace test functional                        # una suite (unit | functional)
node ace test --files tests/functional/foo.spec.ts   # un solo archivo
```

No hay tests todavía: `tests/` solo tiene `bootstrap.ts`. Las suites están declaradas en `adonisrc.ts` (`tests/unit/**/*.spec.ts`, `tests/functional/**/*.spec.ts`); la suite `functional` arranca el servidor HTTP. `.env.test` usa `SESSION_DRIVER=memory`.

Frontend (`cd frontend`):

```bash
npm install
npm run dev      # vite → http://localhost:5173
npm run build    # tsc -b && vite build (sirve también de typecheck)
npm run lint     # oxlint (.oxlintrc.json)
npm run format   # prettier --write .
```

Sin `make`, backend y frontend se levantan en terminales separadas.

## Arquitectura del backend

Flujo de una petición: `start/routes.ts` → controlador (`app/controllers`) → validador VineJS (`app/validators`) → modelo Lucid (`app/models`) → transformer (`app/transformers`) → `ctx.serialize(...)`.

- **Imports por alias** `#controllers/*`, `#models/*`, `#validators/*`, etc. (definidos en `imports` de `package.json`, apuntan a `.js`).
- **Código generado** en `backend/.adonisjs/` (registro de controladores `#generated/controllers`, tipos de rutas para Tuyau). Lo regeneran los hooks de `adonisrc.ts` al arrancar; no se edita a mano. Las rutas referencian controladores como `[controllers.Profile, 'show']`.
- **Esquema de BD**: las migraciones en `database/migrations/` generan `database/schema.ts` (`UserSchema`), y los modelos extienden de ahí (`compose(UserSchema, withAuthFinder(hash))`). Cambios de esquema = migración nueva, nunca editar la tabla ni `schema.ts`.
- **Serialización**: `providers/api_provider.ts` añade `ctx.serialize()`, que **envuelve toda respuesta en `{ data: ... }`**. Los transformers deciden qué campos salen (el password nunca).
- **Middleware global** (`start/kernel.ts`): `force_json_response` fuerza `Accept: application/json`, así que los errores siempre vuelven como JSON. CORS abierto a cualquier origen en desarrollo (`config/cors.ts`).
- **Auth**: guard por defecto `api` = access tokens en BD (tokens con prefijo `oat_`), enviados como `Authorization: Bearer <token>`. Existe también un guard `web` de sesión, sin uso en las rutas.

### Contrato de la API (`/api/v1`)

| Método | Ruta | Auth | Body |
|---|---|---|---|
| POST | `/auth/signup` | no | `fullName` (string o `null`, pero la clave debe ir: si falta → 422 `required`), `email`, `password` (8–32), `passwordConfirmation` (igual a `password`) |
| POST | `/auth/login` | no | `email`, `password` |
| GET | `/account/profile` | Bearer | — |
| POST | `/account/logout` | Bearer | — (borra el token actual) |

- signup y login responden `{ data: { user, token } }`; profile responde `{ data: user }`. `user` = `id, fullName, email, createdAt, updatedAt, initials`.
- El ticket de producto no menciona `passwordConfirmation` ni `fullName`, pero `signupValidator` (`app/validators/user.ts`) los exige; el email además debe ser único. Consulta el validador antes de diseñar formularios.
- Errores de validación: 422 con `{ errors: [{ field, rule, message }] }` (incluye email ya registrado, regla `database.unique`). Credenciales inválidas en login: 400 `{ errors: [{ message: "Invalid user credentials" }] }`. Sin token en rutas protegidas: 401 `{ errors: [{ message: "Unauthorized access" }] }`.

## Git

Se trabaja sobre un fork; `upstream` es `LIDR-academy/flowsync-ai4devs-202609-seniors-1`. La rama de partida es `s1/start` y la entrega va en una rama `harness-<iniciales>` con PR contra el repo del curso.

## Reglas de proceso
- Antes de tocar código: crear una rama nueva (`git checkout -b feat/<slug>`). Nunca
commitear directo en `main`/`s1/start`.
- Al cerrar la tarea: usar la skill `/commit`, luego `gh pr create` con una descripción
completa de los cambios en el cuerpo del PR.
- Después de abrir el PR: usar el subagente `adversarial-reviewer` sobre él, antes de
darlo por terminado.
- No repitas ese resumen en el chat: la sesión se va a perder, el PR no. Responde solo
con la URL del PR.