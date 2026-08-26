# Catorcena — Finanzas y Tiempo

App web (Vite + React) para calcular horas extra, consultar catorcenas de pago,
registrar gastos de transporte y llevar una lista de deseos. Persistencia 100%
en el cliente vía `localStorage` (sin backend, ideal para Vercel estático).

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel: **New Project** → importa el repo.
3. Framework detectado automáticamente: **Vite**. Build command: `npm run build`.
   Output directory: `dist`.
4. Deploy. `vercel.json` ya incluye el rewrite SPA necesario.

No se requiere ninguna variable de entorno ni base de datos: todo el estado
(vive en `localStorage` del navegador de cada usuario.

## Estructura

```
src/
  components/       Sidebar, TopBar, StatusBadge
  context/          ThemeContext (modo oscuro), AppDataContext (datos persistidos)
  hooks/            useLocalStorage, useOnlineStatus
  utils/            dates.js, overtime.js (Módulo A), payroll.js (Módulo B)
  modules/
    Overtime/       Módulo A — Calculadora de horas extra
    Payroll/        Módulo B — Calendario de catorcenas
    Transport/      Módulo C — Gastos de transporte
    Wishlist/       Módulo D — Lista de deseos
    Debts/          Módulo E — Deudas
```

## Reglas de negocio implementadas

**Módulo A — Horas extra** (`src/utils/overtime.js`)
- Tarifa ordinaria: $52.76 MXN/hr.
- Jornada ordinaria de referencia: 35 hrs/semana hasta el 30/08/2026, 30 hrs desde
  el 31/08/2026 (se muestra solo como referencia informativa).
- Cálculo de pago (según especificación literal del negocio): las primeras 48
  horas semanales se pagan a tarifa ordinaria; a partir de la hora 48 aplican
  hasta 12 horas extra (1–9 al doble $105.52, 10–12 al triple $158.28). Cualquier
  hora reportada más allá de 60/semana se marca como excedente sobre el límite
  legal y se resalta en rojo.
- ⚠️ Nota para revisión de negocio: esta lectura del requerimiento difiere de la
  regla clásica de la LFT (donde el doble/triple aplica sobre las horas que
  exceden la jornada ordinaria de 35/30, no sobre las que exceden 48). Se
  implementó tal como se redactó en el prompt; si el criterio real es el de la
  LFT clásica, solo hay que ajustar `calcularSemana()` en `overtime.js`.

**Módulo B — Catorcenas** (`src/utils/payroll.js`)
- Referencia: viernes 14/08/2026 = catorcena índice 0.
- `indiceCatorcena()` calcula el índice de cualquier fecha; `catorcenaDe()`
  regresa la catorcena vigente para "hoy".

**Módulo C — Transporte**
- Camión normal $11.00 / Transbordo $5.50.
- Los días de la catorcena en curso anteriores a "hoy" quedan bloqueados
  (`disabled`) para edición.
- Calculadora de recarga (`calcularRecarga()` en `overtime.js`): a partir del
  saldo actual de la tarjeta (persistente, se actualiza libremente) y el
  total necesario de la catorcena, calcula cuánto falta y cuánto transferir
  para que, después de una comisión del 3%, quede cubierto exactamente lo
  que falta (redondeado hacia arriba en centavos para nunca quedar corto).

**Módulo D — Wishlist**
- CRUD completo en `AppDataContext` (`addWishlistItem`, `updateWishlistItem`,
  `removeWishlistItem`, `toggleWishlistItem`) con total general y total
  pendiente por completar. Cada ítem admite un comentario opcional.

**Módulo E — Deudas**
- Varias deudas independientes, cada una con nombre y monto total.
- Historial de pagos por deuda (monto + fecha), se puede quitar un pago si
  fue un error.
- Una deuda se marca automáticamente como "liquidada" cuando la suma de sus
  pagos alcanza el monto total; queda visible al final de la lista.
- Resumen global arriba: total pagado acumulado y total pendiente entre
  todas las deudas.

## Pendientes / siguientes pasos sugeridos

Ver `CONTINUACION.md` para el prompt de continuación y la lista de pendientes.


## Sincronización en la nube

El proyecto conserva `localStorage` como fuente local para que los datos sigan disponibles
sin conexión. Si se configuran `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, `useCloudSync`
verifica que la tabla remota sea accesible y sincroniza automáticamente al volver a estar
disponible. Los cambios pendientes se conservan localmente mientras la nube no responde.

Si la instancia todavía no tiene la tabla, usa `supabase.sql` en el SQL Editor de Supabase.
El indicador superior muestra `ONLINE` únicamente cuando la aplicación puede leer/escribir
en el almacenamiento remoto; de lo contrario muestra `OFFLINE`.

## PWA

El manifest, los iconos y el service worker están en `public/`. Las rutas usan `/` para que
funcionen también después del build y despliegue en Vercel.
