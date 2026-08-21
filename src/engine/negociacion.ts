// Negociación en rondas (pedido explícito: "diseñar cómo podría ser un
// sistema de ofertas/negociación de fichajes más profundo" — ver
// docs/sistema-oferta-fichajes.md). Funciones puras compartidas entre
// mercado.ts (fichajes) y contratos.ts (renovaciones) — evita el ciclo de
// imports que tendría poner esto en cualquiera de los dos (mercado.ts ya
// importa de contratos.ts).
//
// Ojo con el alcance (sección 3.2 del documento): esto NO modela cuotas
// de pago, cláusulas de recompra, ni negociación de rol/minutos con el
// jugador — sólo lo que hace falta para que ofertar se sienta una
// negociación en rondas en vez de una moneda al aire. Las fórmulas de
// probabilidad de aceptación (probabilidadAceptarOferta/
// probabilidadAceptarRenovacion) NO cambian — esto sólo decide CUÁNTAS
// veces y CON QUÉ feedback se llaman.
import type { Jugador } from '../types';
import { randomUniforme } from './random';

export type ResultadoOferta = 'aceptada' | 'rechazada_cerca' | 'rechazada_lejos';

export interface RespuestaOferta {
  resultado: ResultadoOferta;
  contraofertaSugerida?: number;
}

// Tope de rondas totales (pedido explícito: "para que no se vuelva un
// loop infinito de micro-ajustes").
export const CANTIDAD_MAX_RONDAS = 3;

// Por debajo de este umbral de probabilidad, el rechazo es "de lleno" (sin
// contraoferta orientativa) — evita que una oferta insultante se pueda ir
// subiendo de a poco sin límite, mismo criterio de FM26 sobre ofertas
// "derisorias" (sección 1 del documento de diseño).
const UMBRAL_RECHAZO_CERCA = 0.15;

// Tira la probabilidad de aceptación UNA vez (mismo criterio que el
// esquema viejo) y traduce el resultado a 3 niveles en vez de un booleano
// seco. El monto se usa sólo para calcular la contraoferta sugerida, no
// afecta la probabilidad (esa ya viene calculada de afuera).
export function evaluarOferta(monto: number, probabilidadAceptacion: number): RespuestaOferta {
  if (Math.random() < probabilidadAceptacion) return { resultado: 'aceptada' };
  if (probabilidadAceptacion < UMBRAL_RECHAZO_CERCA) return { resultado: 'rechazada_lejos' };
  return { resultado: 'rechazada_cerca', contraofertaSugerida: Math.round(monto * randomUniforme(1.08, 1.2)) };
}

// Presión de una oferta rival (pedido explícito, sección 3.1 punto 4):
// puramente cosmética/de presión — NO compite de verdad contra el
// usuario por el jugador (evitar construir un motor de IA comprando en
// simultáneo, ver sección 3.2 "qué NO se propone"). Sólo empuja a decidir
// rápido: si la negociación se extiende más de una ronda, se le resta un
// poco a la probabilidad de aceptación de las rondas siguientes.
const UMBRAL_GRL_INTERES_RIVAL = 82;
const PROB_OFERTA_RIVAL = 0.35;
export const PENALIZACION_PRESION_RIVAL = 0.1;

// Se sortea UNA sola vez al iniciar la negociación (no en cada ronda) —
// el caller debe guardar el resultado y reusarlo, no volver a llamar esto.
export function hayOfertaRival(jugador: Jugador): boolean {
  if (jugador.grl < UMBRAL_GRL_INTERES_RIVAL) return false;
  return Math.random() < PROB_OFERTA_RIVAL;
}

export interface FranjaEstimada {
  min: number;
  max: number;
}

// "Consultar" antes de ofertar (sección 3.1 punto 1) — una franja
// orientativa a partir del valor de referencia real (valorMercado en
// fichajes, salarioJusto en renovaciones), con ruido para que no sea
// exactamente el número que después decide la probabilidad (si fuera
// exacto, no habría ninguna razón para no ofertar justo el mínimo de la
// franja).
export function franjaEstimada(valorReferencia: number): FranjaEstimada {
  return {
    min: Math.round(valorReferencia * randomUniforme(0.85, 0.95)),
    max: Math.round(valorReferencia * randomUniforme(1.1, 1.3)),
  };
}
