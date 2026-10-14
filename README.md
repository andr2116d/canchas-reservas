# La Previa

Sistema web de reservas y gestión de canchas deportivas (fútbol 5 y 7).

- `client/` Next.js 16, Tailwind v4, TanStack Query
- `server/` NestJS 12, Prisma 7, PostgreSQL 17

La documentación del proyecto (specs, tareas, reglas y diseño) está en el Notion del equipo.

## Requisitos

- Node 24 o superior
- Docker Desktop abierto

## Primera vez

```bash
git clone https://github.com/andr2116d/canchas-reservas.git
cd canchas-reservas
git checkout dev
npm install
npm run setup
npm run dev
```

`npm run setup` crea los `.env`, levanta Postgres en Docker, aplica las migraciones y carga los datos de demo.

- Client: http://localhost:3000
- Server: http://localhost:3001/api/salud

## Usuarios de demo

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@laprevia.pe | Admin12345 |
| Recepcionista | recepcion@laprevia.pe | Recepcion123 |
| Jugador | jugador1@laprevia.pe | Jugador123 |

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta la base, aplica migraciones y corre client y server |
| `npm test` | Pruebas de client y server |
| `npm run lint` | Lint de client y server |
| `npm run build` | Build de client y server |
| `npm run db:migrate` | Crea una migración después de cambiar `schema.prisma` |
| `npm run db:reset` | Borra la base local y la vuelve a crear con el seed |
| `npm run db:studio` | Abre Prisma Studio para ver los datos |
| `npm run db:stop` | Detiene el contenedor de Postgres |

Las pruebas del server se corren siempre con `npm test -w server`, no con `npx jest` directo.

## Flujo de trabajo

1. Rama desde `dev`: `feature-<tu-nombre>`.
2. Commits con el formato `tipo: descripción` (`feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `ci`).
3. PR hacia `dev`. El CI debe pasar y Andreé aprueba.
4. Al cerrar cada sprint, `dev` se mergea a `main` y se despliega a producción.

No se suben archivos `.env`, carpetas de build ni archivos de agentes de IA.
