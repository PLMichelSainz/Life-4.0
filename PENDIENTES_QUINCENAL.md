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
- Pruebas Vitest: payroll.test.js, overtime.test.js, isr.test.js, imss.test.js.
- IMSS verificado (2.375 % + 0.40 % sobre excedente de 3 UMA, UMA $117.31).
- Horas extra adaptadas al salario diario (ver supuesto 3); se quitó la nota de aviso.
- Revisión estática (tsc): sin nombres no definidos ni imports/exports rotos.

### NO verificado (sin red en el entorno)
- `npm install && npm run build && npm test`. Solo se comprobó sintaxis (tsc) y la lógica con un shim.

### Supuestos (confirmar)
1. Periodo trabajado = quincena calendario; el pago es el mismo día que cierra (desfase 0). Antes: pago 5 días después.
2. Pago el 15/último aunque sea inhábil.
3. HECHO (respuestas del usuario): horas extra siguen con regla 48 h / doble (hasta 9) / triple (hasta 12). Tarifa por hora = salario diario ÷ 9 h efectivas (10 h de turno − 1 h de comida) = $36.67 (`HORAS_EFECTIVAS_DIA` en config.js; sigue al salario editado en Salarios). Las horas ≤48 ya están en el salario: Horas extra muestra y suma solo el pago extra (doble/triple).
4. HECHO: subsidio al empleo corregido a la vigencia 2026 (tope $11,492.66, $535.65/mes feb–dic; Decreto DOF 31/dic/2025). Antes estaba desactualizado ($9,081 / $406.83). Con $9,900 mensual: ISR bruto 361.43 − subsidio 264.30 = ISR neto ≈ $97.13 por quincena. Tarifa mensual ISR 2026 y UMA $117.31 verificadas contra fuentes públicas; conviene contrastar con el Anexo 8 RMF 2026 oficial.
5. HECHO: descansos rotativos (respuesta del usuario): en Transporte se deja el patrón vacío y se marca "Descanso" por día; el patrón fijo sigue disponible.
6. Datos viejos: la clave `salaries.hourlyRate` queda en la nube sin uso; el salario nuevo vive en `salaries.dailyRate`.

### Preguntas abiertas
Ninguna: sin Infonavit/Fonacot (confirmado) y periodo trabajado cierra el día de pago, sin desfase (confirmado). Solo falta compilar y probar (npm install/build/test) en un entorno con red.
