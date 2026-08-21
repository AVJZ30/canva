# Canvasolucion

Sistema privado de gestión de revendedores y créditos para el proceso manual de
agregar correos a Canva. Construido con **React + Vite + TypeScript + Tailwind CSS**
en el frontend y **Supabase** (Auth, Postgres, RLS, Realtime, Edge Functions) como backend.

---

## 1. Requisitos

- Node.js 18+
- Una cuenta de [Supabase](https://supabase.com) (ya tienes el proyecto configurado:
  `https://ktmolgqoktuulvdwuoum.supabase.co`)
- (Opcional, recomendado) [Supabase CLI](https://supabase.com/docs/guides/cli) para
  desplegar las Edge Functions

---

## 2. Configurar variables de entorno

Copia `.env.example` a `.env` (ya viene creado con los valores del proyecto):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://ktmolgqoktuulvdwuoum.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_7Iak8ieWaPh6GC0rXL2PRQ_LI-PSeqp
```

`.env` está en `.gitignore`. Nunca subas la **Service Role Key** al repositorio ni la
uses en el frontend: solo se usa desde el script de bootstrap del administrador y
dentro de las Edge Functions (ver secciones 4 y 5).

---

## 3. Aplicar el esquema de base de datos

1. Entra a tu proyecto de Supabase → **SQL Editor** → **New query**.
2. Pega el contenido completo de [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo.

Esto crea:

- Tablas: `profiles`, `canva_requests`, `credit_transactions`, `activity_logs`
- Funciones RPC seguras (`create_canva_request`, `resolve_canva_request`,
  `adjust_credits`, `refund_request_credit`, `heartbeat`, `get_login_email`,
  `create_reseller_profile`)
- Triggers de `updated_at`
- Row Level Security (RLS) y policies para cada tabla
- Publicación de Realtime sobre las tablas relevantes

El descuento de créditos se hace de forma **atómica** dentro de
`create_canva_request()` usando bloqueo de fila (`FOR UPDATE`), por lo que dos
solicitudes simultáneas del mismo revendedor nunca pueden gastar el mismo crédito.

---

## 4. Crear el administrador inicial

Supabase Auth requiere contraseñas hasheadas por su propio servicio (GoTrue), por lo
que el administrador se crea con un script que usa la **Admin API** (Service Role Key),
nunca desde el frontend.

```bash
cd scripts
npm init -y >/dev/null 2>&1   # si no tienes package.json en /scripts
npm install @supabase/supabase-js

SUPABASE_URL="https://ktmolgqoktuulvdwuoum.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY" \
ADMIN_USERNAME="solucionesavj" \
ADMIN_PASSWORD="solucionesavj" \
node create-admin.mjs
```

La Service Role Key se obtiene en **Project Settings → API → service_role**.
Guárdala solo localmente; **nunca** la publiques ni la incluyas en el frontend.

Al terminar, podrás iniciar sesión en la app con:

- **Usuario:** `solucionesavj`
- **Contraseña:** `solucionesavj`

> Alternativa manual: ver instrucciones paso a paso en
> [`supabase/seed.sql`](./supabase/seed.sql).

---

## 5. Desplegar las Edge Functions (creación/eliminación de revendedores)

Crear o eliminar un revendedor implica crear/eliminar un usuario en `auth.users`, lo
cual requiere privilegios de administrador. Para no exponer la Service Role Key en el
navegador, esto se hace mediante dos Edge Functions:

```bash
supabase login
supabase link --project-ref ktmolgqoktuulvdwuoum

supabase functions deploy create-reseller
supabase functions deploy delete-reseller

# Las funciones necesitan la Service Role Key como secreto del entorno
# (SUPABASE_URL y SUPABASE_ANON_KEY ya están disponibles automáticamente):
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="TU_SERVICE_ROLE_KEY"
```

El panel de administrador llama a estas funciones vía
`supabase.functions.invoke('create-reseller' | 'delete-reseller', ...)`, enviando el
JWT del administrador autenticado. Cada función verifica en el servidor que quien
llama sea realmente un administrador antes de hacer nada.

---

## 6. Ejecutar el proyecto en desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Inicia sesión con las credenciales del administrador
creadas en el paso 4.

---

## 7. Compilar para producción

```bash
npm run build
```

El resultado queda en `dist/`, listo para desplegar en **Netlify** o **Vercel**.

### Despliegue en Vercel

1. Importa el repositorio en Vercel.
2. Framework preset: **Vite**.
3. Agrega las variables de entorno `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY` en **Project Settings → Environment Variables**.
4. Deploy.

### Despliegue en Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Agrega las mismas variables de entorno en **Site settings → Environment variables**.
4. Como es una SPA con rutas de cliente, agrega un archivo `public/_redirects` con:
   ```
   /*  /index.html  200
   ```

---

## 8. Estructura del proyecto

```
src/
  components/
    ui/            Botones, tarjetas, badges, modales, inputs, skeletons...
    layout/         Logo, Sidebar, navegación móvil, encabezados de página
    ProtectedRoute.tsx
  contexts/
    AuthContext.tsx     Sesión, perfil, login/logout, heartbeat de presencia
  hooks/
    useRealtimeTable.ts Suscripción genérica a cambios en tiempo real
  layouts/
    AdminLayout.tsx
    ResellerLayout.tsx
  pages/
    Login.tsx
    admin/     Dashboard, Resellers, ResellerDetail, Requests, Credits, History,
               Activity, Settings
    reseller/  Dashboard, AddEmail, MyRequests, History, Profile
  services/
    auth.service.ts       Login por usuario, logout, cambio de contraseña
    resellers.service.ts  CRUD de revendedores (crear/eliminar vía Edge Functions)
    requests.service.ts   Crear y resolver solicitudes Canva (RPC atómico)
    credits.service.ts    Agregar créditos, listar movimientos
    activity.service.ts   Registro de actividad
    presence.service.ts   Heartbeat y cálculo de online/offline
  lib/
    supabase.ts    Cliente de Supabase (usa la Publishable Key)
    utils.ts       Formateo de fechas, clases, iniciales
  types/
    database.ts    Tipos de dominio (Profile, CanvaRequest, CreditTransaction...)

supabase/
  schema.sql               Esquema completo: tablas, RLS, funciones, triggers
  seed.sql                 Instrucciones para crear el administrador
  functions/
    create-reseller/       Edge Function: crea usuario + perfil de revendedor
    delete-reseller/       Edge Function: elimina usuario + perfil
    _shared/cors.ts

scripts/
  create-admin.mjs   Script de bootstrap del administrador inicial
```

---

## 9. Cómo funciona el flujo principal

1. El revendedor entra a **Agregar correo a Canva**, escribe un correo y pulsa
   **Enviar solicitud**.
2. La función RPC `create_canva_request` valida el correo, bloquea la fila del
   perfil, verifica créditos disponibles, descuenta 1 crédito y crea la solicitud
   con estado `PENDIENTE`, todo en una sola transacción atómica.
3. El administrador ve la solicitud en tiempo real (Supabase Realtime) en
   **Solicitudes Canva**.
4. El administrador agrega el correo a Canva **manualmente, fuera de la app**.
5. Vuelve a Canvasolucion y pulsa **Aprobar** (correo agregado correctamente) o
   **Rechazar** (debe indicar un motivo).
6. El revendedor recibe la actualización en tiempo real y ve el nuevo estado en
   **Mis solicitudes**.
7. Si una solicitud rechazada debía devolver el crédito, el administrador pulsa
   **Devolver crédito** desde la sección de solicitudes.

---

## 10. Seguridad — verificación

- **RLS activo en las 4 tablas.** Un revendedor solo puede `SELECT` su propio
  `profile`, sus propias `canva_requests` y sus propias `credit_transactions`.
  No tiene policies de `INSERT`/`UPDATE` directas sobre solicitudes ni créditos:
  todo pasa por funciones `SECURITY DEFINER` que validan el rol y son las únicas
  con privilegios para escribir.
- **Ningún dato sensible se guarda en texto plano.** Las contraseñas las gestiona
  Supabase Auth (bcrypt), nunca se guardan en `profiles`.
- **La Service Role Key nunca está en el frontend.** Solo existe en:
  - el script local `scripts/create-admin.mjs` (ejecución manual, una vez), y
  - las variables de entorno/secretos de las Edge Functions.
- **Protección de rutas:** `ProtectedRoute` redirige a `/login` si no hay sesión, y
  redirige al dashboard correspondiente si el rol no coincide con la ruta
  (`/admin` vs `/reseller`). Aunque un revendedor edite la URL manualmente a
  `/admin`, las policies de RLS igual le impiden leer o modificar datos de otros
  revendedores o de administración — la protección real vive en la base de datos,
  no solo en el frontend.
- **Concurrencia de créditos:** resuelta con bloqueo de fila (`FOR UPDATE`) dentro
  de `create_canva_request`, evitando condiciones de carrera si el mismo
  revendedor hace clic varias veces rápido o desde varias pestañas.
- **Presencia online/offline:** se basa en un heartbeat (`heartbeat()` RPC) que
  actualiza `last_seen` cada 45s mientras la pestaña está activa; el frontend
  considera "activo" a quien tuvo actividad en los últimos 2 minutos — no depende
  de un campo manual.

---

## 11. Notas

- El login se hace con **usuario**, no con correo. Internamente, la función
  `get_login_email` traduce el username a un correo interno
  (`usuario@canvasolucion.local` para los revendedores creados desde el panel) y
  luego se autentica normalmente contra Supabase Auth.
- `npm run build` fue verificado sin errores de TypeScript ni de compilación antes
  de la entrega.
