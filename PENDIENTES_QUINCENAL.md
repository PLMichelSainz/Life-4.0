# PENDIENTES — migración quincenal + salario diario

## Estado: Fases 1, 2 y 3 hechas en código. Falta verificar build/pruebas en tu máquina.

### Hecho
- `utils/config.js`: 9,900 mensual → 330 diario → 4,950 quincenal; MODO_PERIODO, RECORRER_PAGO_A_HABIL, DESFASE_PAGO_QUINCENA_DIAS.
- `utils/payroll.js`: SOLO lógica quincenal (se eliminaron todas las funciones/anclas de catorcena).
  - Modo 'pago' (Transporte, Presupuesto): arranca el día de pago (15→penúltimo / último→14).
  - Modo 'calendario' (Horas extra, Calendario de pagos): 1–15 se paga el 15; 16–fin se paga el último día.
  - `listaQuincenas`, `semanasQueTocan`.
- `utils/overtime.js`: `calcularSemanaParcial` (semanas lunes–domingo partidas entre dos quincenas; las horas > 48 se pagan en la quincena donde ocurren).
- Módulos migrados: Transporte (+ descansos), Presupuesto, Horas extra (3–4 semanas por quincena, días de otra quincena bloqueados), Captura de horario, Calendario de pagos, Salarios (sueldo mensual → diario → quincena, ISR/IMSS a 15 días).
- Textos es/en/fr, marca "Quincena" (título, sidebar, README). `grep -ri catorcen src` = sin resultados.
- Pruebas Vitest: payroll.test.js, overtime.test.js.

### NO verificado (sin red en el entorno)
- `npm install && npm run build && npm test`. Solo se comprobó sintaxis (tsc) y la lógica con un shim.

### Supuestos (confirmar)
1. Periodo trabajado = quincena calendario; el pago es el mismo día que cierra (desfase 0). Antes: pago 5 días después.
2. Pago el 15/último aunque sea inhábil.
3. Tarifas de HORAS EXTRA siguen en $52.76/h y umbral de 48 h (`utils/overtime.js`): NO se tocaron porque el salario nuevo es diario. Falta definir tarifa/hora del nuevo trabajo (depende de las horas efectivas del turno 10–20).
4. Subsidio al empleo en `utils/isr.js` usa tope $9,081 / $406.83 mensual: verificar vigencia 2026 (con 9,900 mensual queda sin subsidio).
5. Días de descanso: elige 2 en Transporte (patrón vacío por defecto).
6. Datos viejos: la clave `salaries.hourlyRate` queda en la nube sin uso; el salario nuevo vive en `salaries.dailyRate`.

### Preguntas abiertas
Q3 horas efectivas del turno · Q4 descansos fijos o rotativos · Q6 ¿sigue el módulo de horas extra? y con qué tarifa · Q7 otras deducciones.
