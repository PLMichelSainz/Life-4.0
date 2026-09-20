# Prompt de continuación

Copia y pega esto en una nueva ventana de conversación (adjuntando el proyecto
`finanzas-app`) para continuar el trabajo:

---

Tengo un proyecto Vite + React llamado "finanzas-app" (adjunto/subido) que ya
implementa 4 módulos funcionales: Calculadora de horas extra, Calendario de
catorcenas, Gastos de transporte y Lista de deseos, con persistencia en
localStorage, modo oscuro y badge de estado de red. El build (`npm run
build`) ya pasa correctamente.

Quiero que continúes con lo siguiente, en este orden:

1. **Confirmar la regla de pago de horas extra**: revisa la nota en el README
   bajo "Módulo A" sobre la interpretación del umbral de 48 horas vs. la
   jornada ordinaria (35/30 hrs). Pregúntame cuál es la interpretación
   correcta y ajusta `src/utils/overtime.js` si es necesario.
2. **Pruebas unitarias básicas** para `src/utils/overtime.js` y
   `src/utils/payroll.js` (por ejemplo con Vitest), cubriendo: cálculo de
   semana con 0, 40, 48, 55 y 65 horas; y cálculo de catorcena para fechas
   antes/después de la referencia y cambios de año.
3. **Resumen consolidado**: una pantalla o sección que muestre, para la
   catorcena en curso, el total combinado de horas extra + transporte +
   avance de wishlist (una vista "todo en uno").
4. **Exportar/backup de datos**: botón para exportar todo el localStorage a
   JSON y para importarlo de vuelta (útil porque hoy los datos solo viven en
   el navegador del usuario).
5. **Revisión visual**: correr `npm run dev`, tomar capturas en escritorio y
   móvil, y pulir espaciados/contrastes en modo claro (el modo oscuro fue el
   que más se probó visualmente).
6. (Opcional) Evaluar si vale la pena migrar de localStorage a Vercel KV /
   Supabase si el usuario necesita sincronizar datos entre dispositivos.

---

## Pendiente adicional (se perdió por corte de sesión, nunca se entregó en un zip)

Copia y pega esto en una nueva ventana para retomarlo:

---

Tengo el proyecto "finanzas-app" (adjunto/subido) con los módulos Horas extra,
Catorcenas, Transporte, Wishlist y Deudas funcionando, incluyendo la
calculadora de recarga de tarjeta con comisión y el bloqueo/reseteo de días
pasados en Transporte. Necesito que retomes dos cosas que se habían empezado
antes pero se perdieron por un corte de sesión (nunca llegaron a
entregarse en un zip):

1. **Navegación por catorcenas futuras en el módulo de Transporte**: hoy el
   módulo de Transporte (`src/modules/Transport/TransportExpenses.jsx`) solo
   muestra la catorcena actual (`catorcenaDe(hoy)`), sin poder avanzar a
   catorcenas futuras. Agrega botones "Catorcena anterior" / "Siguiente"
   igual que ya existen en `src/modules/Overtime/OvertimeCalculator.jsx`
   (usa `catorcenaPorIndice` e `indiceCatorcena` de `src/utils/payroll.js`
   como referencia de cómo se hizo ahí). Importante: al navegar a una
   catorcena distinta a la actual, el bloqueo/reseteo de "día ya
   transcurrido a 0" debe seguir aplicando solo a días anteriores a HOY
   (no a todos los días de una catorcena futura, que no han pasado).

2. **Sincronización en la nube con Supabase, usando un PIN personal (sin
   cuentas)**: para que los datos de mi PC y mi celular sean los mismos.
   Quiero: instalar `@supabase/supabase-js`, un cliente en
   `src/utils/supabaseClient.js` que lea `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` desde variables de entorno de Vite (si no están
   configuradas, la app debe seguir funcionando 100% local con
   localStorage, sin romperse). Un nuevo módulo "Sincronización" en el
   sidebar donde pueda escribir un PIN y conectar mi dispositivo: al
   conectar, si ya hay datos guardados en la nube con ese PIN, se
   descargan y reemplazan los locales; si no hay, se sube lo que tengo
   localmente. Después de conectado, cualquier cambio en horas, transporte,
   wishlist, deudas o saldo de tarjeta debe subirse solo (con un pequeño
   retraso tipo debounce) a una tabla de Supabase. Incluye también:
   - Un archivo `SUPABASE_SETUP.md` con instrucciones paso a paso para
     crear la cuenta/proyecto en Supabase, crear la tabla con SQL, y
     configurar las variables de entorno tanto en local (`.env.local`)
     como en Vercel.
   - Un `.env.example` con las dos variables vacías.
   - Actualiza `.gitignore` para que `.env.local` nunca se suba a GitHub.

Por favor lee primero el código actual del proyecto (no lo reescribas
completo) y ve aplicando los cambios de forma incremental, verificando con
`npm run build` que todo compile antes de entregarme el zip final.

