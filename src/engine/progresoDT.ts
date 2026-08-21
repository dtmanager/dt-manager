// Progreso del DT propio (pedido explícito, mecánica 5 de
// docs/que-le-falta-profundidad.md): "una evolución chica de 1-2 puntos
// por temporada en el/los atributos relacionados con lo que más usaste
// esa temporada (si fichaste mucho, sube mercado; si desarrollaste
// canteranos, sube desarrollo)". A propósito sólo estos dos casos
// concretos que menciona el documento — no se inventa una fórmula
// genérica de progreso para el resto de los 10 atributos del DT.
import type { DT } from '../types';
import { clamp } from './random';

export interface ActividadTemporadaDT {
  fichajesRealizados: number;
  canteranosAceptados: number;
}

export function actividadTemporadaVacia(): ActividadTemporadaDT {
  return { fichajesRealizados: 0, canteranosAceptados: 0 };
}

const SUBA_MIN = 1;
const SUBA_MAX = 2;

function subaAlAzar(): number {
  return Math.random() < 0.5 ? SUBA_MIN : SUBA_MAX;
}

function subirAtributo(dt: DT, atributo: 'mercado' | 'desarrollo'): DT {
  return { ...dt, [atributo]: Math.min(99, dt[atributo] + subaAlAzar()) };
}

// El DT sube el atributo de lo que más se usó esta temporada — si no hubo
// actividad real en ninguno de los dos frentes (o empataron en cero), el
// DT queda exactamente igual: no se inventa progreso de la nada.
export function evolucionarDT(dt: DT, actividad: ActividadTemporadaDT): DT {
  const { fichajesRealizados, canteranosAceptados } = actividad;
  if (fichajesRealizados === 0 && canteranosAceptados === 0) return dt;
  if (fichajesRealizados > canteranosAceptados) return subirAtributo(dt, 'mercado');
  if (canteranosAceptados > fichajesRealizados) return subirAtributo(dt, 'desarrollo');
  // Empate con actividad real de los dos lados: sube los dos atributos.
  return subirAtributo(subirAtributo(dt, 'mercado'), 'desarrollo');
}

// Reputación del DT propio (pedido explícito: "que te lleguen también
// otras ofertas según tu GRL y tu rendimiento" — ver engine/ofertasDT.ts.
// Sin esto la reputación quedaba fija desde que se generaba el DT, así
// que usarla como señal de largo plazo para atraer ofertas no tenía
// sentido). A diferencia de mercado/desarrollo (suben, nunca bajan), acá
// SÍ puede bajar si no cumplís el objetivo — es la reputación "de
// mercado" del DT, no un progreso personal garantizado. Sólo cuenta el
// título de LIGA de este cierre (ver llamada en useGameStore.ts) — los de
// copa ya impactaron carreraDT/idolatría durante la temporada.
const REPUTACION_POR_TITULO_LIGA = 3;
const REPUTACION_OBJETIVO_CUMPLIDO = 1;
const REPUTACION_OBJETIVO_INCUMPLIDO = -2;

export function evolucionarReputacionDT(dt: DT, campeonLiga: boolean, objetivoCumplido: boolean): DT {
  const delta = (campeonLiga ? REPUTACION_POR_TITULO_LIGA : 0)
    + (objetivoCumplido ? REPUTACION_OBJETIVO_CUMPLIDO : REPUTACION_OBJETIVO_INCUMPLIDO);
  return { ...dt, reputacion: Math.round(clamp(dt.reputacion + delta, 0, 99)) };
}
