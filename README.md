# NEXUS GPU — gestión de hardware e inteligencia artificial

Aplicación web para una tienda especializada en placas gráficas, componentes de PC y equipos para inteligencia artificial. Incluye ventas, catálogo y stock, clientes con cuenta corriente y usuarios con permisos. Las facturas son comprobantes internos sin validez fiscal. La identidad visual usa una paleta oscura con acentos verdes, inspirada en el mundo del hardware y la IA.

## Entrega

- **Repositorio:** https://github.com/AleGalarze21/Tp5-Parcial2
- **Aplicación publicada:** https://tp5-parcial2.vercel.app/login
- **Integrantes:** Francisco Palacios (legajo 61024), Cristian Ledesma (legajo 62523) y Alejandro Galarze (legajo 63142).

## Tecnologías

- Next.js con App Router y TypeScript
- Route Handlers REST
- Tailwind CSS y componentes de interfaz basados en shadcn/ui
- SQLite local y libSQL/Turso remoto, con Drizzle ORM y migraciones
- Zod para validar formularios y operaciones del servidor con esquemas compartidos
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

### Actualizar solo el catálogo en Turso

En PowerShell, cargá la URL y el token de la base Turso y ejecutá el seed en modo catálogo. Este modo actualiza productos y categorías sin crear clientes de prueba ni facturas:

```powershell
$env:TURSO_DATABASE_URL = "libsql://<base>-<organizacion>.turso.io"
$env:TURSO_AUTH_TOKEN = "<token-de-turso>"
$env:SEED_CATALOG_ONLY = "true"
corepack pnpm run db:seed
Remove-Item Env:SEED_CATALOG_ONLY -ErrorAction SilentlyContinue
```

Usá la URL `libsql://` de Turso, no `file:local.db`. El token se obtiene desde la configuración de conexión de la base y no debe subirse a GitHub.

### Reiniciar todos los datos de demostración

Este comando borra clientes, facturas, pagos, movimientos, productos, categorías y secuencias de la base indicada, y después carga datos de prueba nuevos para NEXUS GPU. Conserva los usuarios existentes para mantener sus accesos. Usalo únicamente cuando quieras reemplazar por completo el resto de los datos.

```powershell
$env:TURSO_DATABASE_URL = "libsql://<base>-<organizacion>.turso.io"
$env:TURSO_AUTH_TOKEN = "<token-de-turso>"
$env:RESET_DATABASE = "true"
$preload = (Resolve-Path .\scripts\preload-tsx-windows.cjs).Path.Replace('\', '/')
$env:NODE_OPTIONS = "--require=$preload"
corepack pnpm run db:reset-demo
Remove-Item Env:RESET_DATABASE, Env:TURSO_DATABASE_URL, Env:TURSO_AUTH_TOKEN, Env:NODE_OPTIONS -ErrorAction SilentlyContinue
```

Para reiniciar la base local, omití `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. La protección `RESET_DATABASE=true` es obligatoria para ejecutar el borrado.

## Usuarios de prueba

| Rol | Email | Contraseña |
| --- | --- | --- |
| Administrador | `laura@nexusgpu.test` | `0987654321@Ale` |
| Vendedor | `pablo@nexusgpu.test` | `0987654321@Ale1` |

El seed también carga 5 categorías, 30 productos de hardware, 10 clientes y hasta 50 facturas distribuidas en los últimos 30 días. Cambiá las contraseñas de prueba antes de publicar el sistema.

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
