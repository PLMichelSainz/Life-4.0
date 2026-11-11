// Parámetros del esquema quincenal / salario diario. Un solo lugar, nunca repetidos.
export const SUELDO_MENSUAL_BRUTO = 9900
export const DIAS_BASE_MES = 30 // convención para salario diario
export const SALARIO_DIARIO = SUELDO_MENSUAL_BRUTO / DIAS_BASE_MES // 330
export const BRUTO_QUINCENAL = SALARIO_DIARIO * 15 // 4,950
export const TURNO = { entrada: '10:00', salida: '20:00' }
export const DESCANSOS_POR_SEMANA = 2

// D1: 'pago'      -> la quincena arranca el día de pago (15 -> penúltimo día / último -> 14).
//     'calendario' -> quincenas 1–15 y 16–fin de mes (el pago es el último día de cada una).
export const MODO_PERIODO = 'pago'

// D2: si true, un pago que cae en sábado/domingo se adelanta al viernes anterior.
export const RECORRER_PAGO_A_HABIL = false

// Periodo TRABAJADO (Horas extra y Calendario de pagos): quincena calendario,
// 1–15 se paga el 15 y 16–fin de mes se paga el último día. Días entre el cierre
// del periodo y el pago (0 = se paga el mismo día en que cierra).
export const DESFASE_PAGO_QUINCENA_DIAS = 0

// Horas efectivas por día en el turno 10:00–20:00 (10 h presenciales − 1 h de comida no laborada).
export const HORAS_EFECTIVAS_DIA = 9
// Tarifa por hora derivada del salario diario (usada para horas extra): 330 ÷ 9 = 36.67
export const TARIFA_HORA = SALARIO_DIARIO / HORAS_EFECTIVAS_DIA
