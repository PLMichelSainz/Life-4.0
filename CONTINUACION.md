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

Todos los archivos fuente están en `src/`. La lógica de negocio está aislada
en `src/utils/` para que sea fácil de probar y ajustar sin tocar los
componentes de UI.
