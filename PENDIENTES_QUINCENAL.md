# PENDIENTES — migración quincenal + salario diario

## Estado: FASE 1 completa (código); FASE 2 y 3 pendientes

### Hecho en Fase 1
- `src/utils/config.js` (nuevo): sueldo 9,900 → diario 330 → quincenal 4,950; MODO_PERIODO ('pago'), RECORRER_PAGO_A_HABIL (false).
- `src/utils/payroll.js`: `indiceQuincena`, `quincenaPorIndice`, `quincenaDe`, `diasDeQuincena`, `ultimoDiaDelMes`. Las funciones catorcenales siguen (las usan Horas extra y Calendario → Fase 3).
- `src/utils/payroll.test.js` (nuevo, Vitest): 6 pruebas, verificadas con un shim local (todas OK).
- `AppDataContext`: `descansoPatron` (transport.restPattern), `descansoExcepciones` (transport.restOverrides), `setDescansoDia`.
- `TransportExpenses.jsx`: quincenas de 13–16 días, descansos (patrón semanal + casilla por día), versión visible v2026-11-10-B.
- `Budget.jsx`: reseteo de gastos fijos por quincena (índice nuevo, no choca con los viejos).
- i18n es/en/fr de Transporte y Budget.

### NO verificado
- `npm run build` y `npm test`: este entorno no tiene red ni node_modules. Corre `npm install && npm run build && npm test`. Solo se comprobó sintaxis (tsc) y la lógica de payroll con un shim.

### Correcciones al prompt
- Las quincenas miden 13–16 días (feb. no bisiesto: 13), no 14–16.

### Defaults asumidos (confirmar)
- D1 periodo arranca el día de pago · D2 pago el mismo día aunque sea inhábil · D3/D5 descansos = 0 pasajes · patrón de descanso vacío hasta que elijas 2 días.

### Pendiente
- FASE 2: salario diario en Salarios (clave `salaries.dailyRate`, tabla por quincena, ISR/IMSS a 15 días).
- FASE 3: PayrollCalendar, Horas extra (conflicto 10 h × 5 = 50 h/sem vs umbral 48), limpieza de funciones/textos "catorcena" (`grep -ri catorcen src`), revisión visual.
- Preguntas Q1–Q8 del prompt siguen abiertas.
