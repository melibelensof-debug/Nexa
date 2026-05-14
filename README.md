# Nexa

Aplicación web para conectar pymes de distintas regiones, facilitando la búsqueda y colaboración entre emprendimientos similares por categoría.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM con SQLite (desarrollo)

## Primeros pasos

```bash
npm install
npm run db:push      # crea la base de datos SQLite y aplica el schema
npm run db:seed      # carga categorías, regiones y negocios de ejemplo
npm run dev
```

Abre http://localhost:3000

## Estructura

```
prisma/
  schema.prisma      # Modelos: Region, Category, Business
  seed.ts            # Datos iniciales
src/
  app/
    page.tsx                    # Home con buscador
    businesses/                 # Listado y detalle de negocios
    categories/                 # Listado y detalle por categoría
    api/businesses/route.ts     # Endpoint JSON con filtros
  lib/
    prisma.ts        # Cliente Prisma singleton
    utils.ts         # Helpers (slugify)
```

## Scripts

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción
- `npm run db:push` — sincroniza el schema con la DB
- `npm run db:seed` — carga datos iniciales
- `npm run lint` — ejecuta ESLint
