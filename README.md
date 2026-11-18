# Mostrador — sistema de gestión comercial

Aplicación web para ventas, catálogo y stock, clientes con cuenta corriente y usuarios con permisos. Las facturas son comprobantes internos sin validez fiscal.

## Entrega

- **Repositorio:** https://github.com/AleGalarze21/Tp5-Parcial2
- **Aplicación publicada:** pendiente de configurar Vercel y Turso.
- **Integrantes:** completar con nombres y números de legajo.

## Tecnologías

- Next.js con App Router y TypeScript
- Route Handlers REST
- Tailwind CSS y componentes de interfaz basados en shadcn/ui
- SQLite local y libSQL/Turso remoto, con Drizzle ORM y migraciones
- Zod para validar operaciones del servidor
- Chart.js para el tablero
- Sesiones firmadas en cookie `httpOnly`; contraseñas con bcrypt

## Requisitos

- Node.js 20.9 o posterior
- pnpm 12.21.0 (Corepack puede activarlo con `corepack enable`)

## Puesta en marcha local

En PowerShell:

```powershell
corepack enable
pnpm install
Copy-Item .env.example .env
pnpm run db:migrate
pnpm run db:seed
pnpm run dev
```

Abrí `http://localhost:3000`. `db:migrate` crea el esquema SQLite local en `local.db`. `db:seed` agrega datos de ejemplo de forma idempotente.

## Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `laura@ferreteria.test` | `Admin123!` |
| Vendedor | `pablo@ferreteria.test` | `Vendedor123!` |

El seed también carga 5 categorías, 30 productos, 10 clientes y hasta 50 facturas distribuidas en los últimos 30 días. Cambiá las contraseñas de prueba antes de publicar el sistema.

## Variables de entorno

`.env.example` contiene la configuración local. Para producción, configurá estas variables en Vercel:

| Variable | Uso |
| --- | --- |
| `TURSO_DATABASE_URL` | URL `libsql://...` de la base remota; en local usa `file:local.db` |
| `TURSO_AUTH_TOKEN` | Token de acceso a Turso; vacío para la base local |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 bytes para firmar sesiones |
| `NEXT_PUBLIC_BUSINESS_NAME` | Nombre que aparece en los comprobantes |
| `NEXT_PUBLIC_BUSINESS_ADDRESS` | Domicilio opcional del comercio |
| `NEXT_PUBLIC_BUSINESS_PHONE` | Teléfono opcional del comercio |

Podés generar un secreto con:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

No subas `.env` ni tokens al repositorio. Para desplegar, creá la base libSQL en Turso, cargá la URL y el token en las variables de entorno de Vercel, ejecutá `pnpm run db:migrate` y `pnpm run db:seed` contra esa base, e importá el repositorio en Vercel. El build de Vercel usa `pnpm run build`.

## Funcionalidades

- Tablero con ventas diarias, formas de pago, productos más vendidos y stock bajo.
- Venta a consumidor final o cliente registrado; efectivo, tarjeta o cuenta corriente.
- Validación de stock y crédito en el servidor; factura, movimientos de stock y cuenta se guardan en una transacción.
- Comprobantes imprimibles, numeración correlativa y anulación con motivo.
- Catálogo, categorías, ajustes de stock e historial de movimientos.
- Fichas de clientes, cuenta corriente, registro de pagos y recibos imprimibles.
- Roles de administrador y vendedor, gestión de usuarios y cambio de contraseña.
- Listados con filtros, estados vacíos y paginación.

## Comandos útiles

```bash
pnpm run db:generate   # genera una migración desde el esquema
pnpm run db:migrate    # aplica migraciones
pnpm run db:seed       # carga datos iniciales
pnpm run dev           # servidor local
pnpm run build         # build de producción
pnpm run start         # sirve el build
```

## Arquitectura

- `src/app/api`: adaptadores REST y rutas de autenticación.
- `src/lib/services`: reglas de negocio y transacciones del dominio.
- `src/lib/db/schema.ts`: esquema Drizzle.
- `drizzle/`: migraciones versionadas.
- `src/app/(private)`: pantallas que exigen sesión válida.

Los cambios se separan en commits por funcionalidad. El historial de GitHub contiene los avances publicados en `main`.
