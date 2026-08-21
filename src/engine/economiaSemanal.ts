// Economía semanal real (pedido explícito: "desglose real de Ingresos/
// Sueldos/Gastos semana a semana" — hasta ahora sólo había datos reales a
// fin de temporada, ver economia.ts). Reparte el MISMO total anual que ya
// usaba economia.ts (mismo calcularTaquilla/calcularSueldosTemporada, no
// se inventa una economía nueva) en cuotas semanales, sólo para el club
// del usuario — los clubes de la IA se quedan con el liquidado de una
// sola vez a fin de temporada (procesarFinDeTemporada), no hace falta
// rastrear su economía semana a semana para nada que se le muestre al
// jugador.
//
// Sueldos: se pagan TODAS las fechas del fixture de liga, jueguen o no de
// local esa semana (el plantel cobra igual). Taquilla: sólo en las
// fechas que el club juega de LOCAL en la liga — un fixture ida y vuelta
// balanceado siempre tiene la misma cantidad de partidos de local que de
// visitante, así que alcanza con totalFechasLiga/2.
import type { Club } from '../types';
import { calcularSueldosTemporada, calcularTaquilla } from './economia';

export interface MovimientoSemanal {
  semana: number;
  ingresos: number;
  gastos: number;
  // Presupuesto resultante DESPUÉS de aplicar este movimiento — no hace
  // falta recalcularlo en la UI, ya viene resuelto.
  presupuesto: number;
}

// Se recalcula sobre el plantel ACTUAL (no un promedio fijo de principio
// de temporada) para que un fichaje o una venta a mitad de temporada
// ajusten la cuota semanal sola, sin arrastrar un número viejo.
export function sueldosDeLaSemana(club: Club, totalFechasLiga: number): number {
  if (totalFechasLiga <= 0) return 0;
  return Math.round(calcularSueldosTemporada(club) / totalFechasLiga);
}

export function taquillaDeLaSemana(club: Club, totalFechasLiga: number): number {
  const partidosDeLocal = totalFechasLiga / 2;
  if (partidosDeLocal <= 0) return 0;
  return Math.round(calcularTaquilla(club.nc, club.liga) / partidosDeLocal);
}

export function calcularMovimientoSemanal(
  club: Club,
  semana: number,
  esLocalEstaFecha: boolean,
  totalFechasLiga: number,
): MovimientoSemanal {
  const gastos = sueldosDeLaSemana(club, totalFechasLiga);
  const ingresos = esLocalEstaFecha ? taquillaDeLaSemana(club, totalFechasLiga) : 0;
  return {
    semana, ingresos, gastos, presupuesto: club.presupuesto + ingresos - gastos,
  };
}
