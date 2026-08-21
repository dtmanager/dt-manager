// Ofertas de otros clubes (pedido explícito): si al DT del usuario le va
// bien, otros clubes de la misma liga pueden querer robarlo — mismo
// patrón narrativo que un mercado de pases real, pero para el propio DT
// en vez de para un jugador. Se evalúa al cerrar cada temporada, en
// procesarFinDeTemporada. No aplica si la carrera está terminando esa
// misma temporada (despido/descenso — eso lo resuelve generarOfertasRescate
// más abajo, no esto).
//
// CORRECCIÓN (pedido explícito: "que te lleguen también otras ofertas
// según tu GRL y tu rendimiento" — antes sólo miraba idolatría, que es el
// cariño de LA HINCHADA de tu club actual, no tu reputación como
// profesional ni cómo te viene yendo con la directiva). Ahora
// factorRendimiento combina reputación del DT (engine/progresoDT.ts,
// evolucionarReputacionDT) y confianza de la directiva actual — ver
// ambas funciones más abajo.
//
// SEGUNDA CORRECCIÓN (pedido explícito: "siguen sin llegarte ofertas...
// que por lo menos tengas 4, 5 opciones" — antes esto devolvía UN solo
// club como mucho, filtrando SÓLO a los claramente más grandes, así que
// en una liga con pocos clubes por encima del propio nc, o directamente
// jugando con el club más grande de la liga, nunca había candidatos y la
// oferta no llegaba nunca). Ahora es un ARRAY (mismo patrón que
// generarOfertasRescate), la probabilidad de que llegue ALGUNA ronda de
// ofertas es más alta, y el pool de candidatos es mucho más amplio (no
// hace falta ser "claramente más grande" — un lateral similar también
// puede ofrecerte más plata, no sólo un ascenso).
//
// TERCERA CORRECCIÓN (pedido explícito: "no me llegan ofertas de otros
// clubes extranjeros al dt solo de tu liga local, que aparezcan algunas
// tambien segun tu grl de dt" — antes `candidatosOfertaDT` filtraba
// SIEMPRE por `c.liga === ligaNombre`, así que ni con reputación 99
// podía aparecer un club de otro país). `clubes` (el Record que llega
// acá) YA incluye un puñado de clubes extranjeros de otras ligas cada
// temporada — ver generarClubesExtranjeros en mercado.ts, mezclados en
// state.clubes desde iniciarPartidaNueva/finalizarTemporada — sólo
// hacía falta dejar de excluirlos por liga. Gateado por reputación
// (UMBRAL_REPUTACION_EXTRANJERO): un DT todavía sin nombre sólo recibe
// ofertas locales, uno con recorrido empieza a sonar afuera también.
import type { Club, DT } from '../types';
import { clamp, elegirVariosAlAzar } from './random';
import { contratoDTInicial } from './contratoDT';

export interface OfertaDT {
  clubId: string;
  clubNombre: string;
  clubNc: number;
  // Liga REAL del club que ofrece — antes siempre era la del usuario
  // (todas las ofertas eran locales); ahora puede ser una liga distinta
  // (oferta del extranjero, ver nota de arriba).
  clubLiga: string;
  temporada: number;
  // Términos concretos del contrato ofrecido (pedido explícito, tarjetas
  // de oferta estilo "El dado trajo estas ofertas" — necesitan mostrar
  // salario/años reales, no sólo "te quiere como DT"). Calculados UNA vez
  // acá con contratoDTInicial (mismo generador que usa aceptarOfertaDT al
  // confirmar) para que lo que se ve en la tarjeta sea EXACTAMENTE lo que
  // se aplica si se acepta — no un nuevo sorteo que podría no coincidir.
  salarioOfrecido: number;
  duracionOfrecida: number;
}

const PROB_BASE_OFERTAS = 0.18;
const PROB_EXTRA_IDOLATRIA_ALTA = 0.35;
const UMBRAL_IDOLATRIA_ALTA = 70;
const PROB_EXTRA_RENDIMIENTO_MAX = 0.35;
// Ya no exige ser "claramente más grande" (pedido explícito) — un club
// bastante más chico no te ofrece nada, pero uno parecido o algo más
// chico sí puede tentarte con más plata/protagonismo. El pool amplio es
// lo que garantiza que HAYA 4-5 candidatos para elegir en casi cualquier
// liga real (12+ clubes), no sólo en las gigantes.
const DIFERENCIA_NC_MINIMA = -10;
const MIN_OFERTAS = 4;
const MAX_OFERTAS = 5;
// A partir de qué reputación un DT empieza a sonar en el extranjero
// también (pedido explícito, "segun tu grl de dt") — por debajo, sólo
// ofertas locales, como antes.
const UMBRAL_REPUTACION_EXTRANJERO = 55;

// Reputación del DT (0-99) + confianza de la directiva actual (0-100) —
// "rendimiento" en el sentido amplio: qué tan bien te conocen en el medio
// y qué tan contento está tu club actual con vos. 0 (nadie te quiere) a 1
// (el mejor caso posible).
function factorRendimiento(dt: DT, confianzaDirectiva: number): number {
  return clamp(dt.reputacion, 0, 99) / 99 * 0.5 + clamp(confianzaDirectiva, 0, 100) / 100 * 0.5;
}

export function candidatosOfertaDT(
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  ligaNombre: string,
  incluirExtranjeros: boolean,
): Club[] {
  const clubActual = clubes[clubUsuarioId];
  if (!clubActual) return [];
  return Object.values(clubes).filter((c) => (
    c.id !== clubUsuarioId
    && (c.liga === ligaNombre || incluirExtranjeros)
    && !c.esControladoPorUsuario
    && c.nc >= clubActual.nc + DIFERENCIA_NC_MINIMA
  ));
}

// `random` inyectable sólo para tests determinísticos (mismo patrón que
// el resto del motor usa Math.random directo, acá se separa porque el
// resultado es todo-o-nada por temporada, más fácil de testear con un
// valor fijo que forzando mocks de Math.random en cada test).
export function generarOfertasDT(
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  ligaNombre: string,
  dt: DT,
  idolatria: number,
  confianzaDirectiva: number,
  temporada: number,
  random: () => number = Math.random,
): OfertaDT[] {
  const incluirExtranjeros = dt.reputacion >= UMBRAL_REPUTACION_EXTRANJERO;
  const candidatos = candidatosOfertaDT(clubes, clubUsuarioId, ligaNombre, incluirExtranjeros);
  if (candidatos.length === 0) return [];
  const prob = PROB_BASE_OFERTAS
    + (idolatria >= UMBRAL_IDOLATRIA_ALTA ? PROB_EXTRA_IDOLATRIA_ALTA : 0)
    + factorRendimiento(dt, confianzaDirectiva) * PROB_EXTRA_RENDIMIENTO_MAX;
  if (random() >= prob) return [];
  // Entre MIN_OFERTAS y MAX_OFERTAS (pedido explícito: "por lo menos 4, 5
  // opciones"), capeado por cuántos candidatos hay de verdad disponibles
  // (ligas muy chicas pueden no llegar a 4).
  const cantidad = Math.min(candidatos.length, MIN_OFERTAS + Math.floor(random() * (MAX_OFERTAS - MIN_OFERTAS + 1)));
  return elegirVariosAlAzar(candidatos, cantidad).map((elegido) => {
    const contrato = contratoDTInicial(elegido.presupuesto);
    return {
      clubId: elegido.id,
      clubNombre: elegido.nombre,
      clubNc: elegido.nc,
      clubLiga: elegido.liga,
      temporada,
      salarioOfrecido: contrato.salarioAnual,
      duracionOfrecida: contrato.temporadasRestantes,
    };
  });
}

// -------------------- oferta de rescate (pedido explícito) --------------------
//
// "que si te despiden o te descienden sin liga inferior, te llegue una
// oferta de rescate en vez de terminar la carrera ahí directo" — a
// diferencia de generarOfertaDT (seguís activo, sólo clubes más grandes
// te tientan), acá estás sin trabajo: cualquier club de la misma liga es
// candidato, no sólo los más grandes — un DT recién despedido no elige,
// agarra lo que aparece. La probabilidad de conseguir AL MENOS una oferta
// escala con reputación/idolatría/confianza, pero por default (sin
// `garantizada`) nunca llega a 1.
//
// CORRECCIÓN (pedido explícito: primero "hace que si te despiden no
// termine tu carrera que te lleguen otras ofertas tambien", después
// ampliado a "garantizar también la oferta de rescate para descenso"):
// tanto un despido como un descenso sin liga inferior tienden a pasar
// justo cuando reputación/idolatría/confianza están bajas, así que el
// propio motivo de fin de carrera le pegaba dos veces al mismo DT — la
// probabilidad de rescate quedaba pegada cerca del piso justo cuando más
// hacía falta. `garantizada` (ver useGameStore.ts — se pasa `true` para
// los dos motivos que llegan a este punto, despido y descenso) saltea el
// tiro de dados de "hay oferta o no": ninguno de los dos termina la
// carrera de una si hay al menos un club candidato en la misma liga. La
// única forma de que la carrera SÍ termine acá es que no haya ni un solo
// club candidato (`candidatos.length === 0`, ver más abajo).
export interface OfertaRescateDT {
  clubId: string;
  clubNombre: string;
  clubNc: number;
  // Ver la misma nota en OfertaDT — términos reales, no re-sorteados al
  // aceptar.
  salarioOfrecido: number;
  duracionOfrecida: number;
}

const PROB_RESCATE_MIN = 0.25;
const PROB_RESCATE_RANGO = 0.5;
const MAX_OFERTAS_RESCATE = 3;

export function candidatosRescateDT(
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  ligaNombre: string,
): Club[] {
  return Object.values(clubes).filter((c) => (
    c.id !== clubUsuarioId && c.liga === ligaNombre && !c.esControladoPorUsuario
  ));
}

export function generarOfertasRescate(
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  ligaNombre: string,
  dt: DT,
  idolatria: number,
  confianzaDirectiva: number,
  // Ver el comentario grande de arriba — true para despido y descenso
  // (los dos motivos que hoy llegan a esta función). `false` (default)
  // sigue disponible por si en el futuro se agrega otro motivo que SÍ
  // deba conservar el riesgo real de terminar la carrera ahí.
  garantizada: boolean = false,
  random: () => number = Math.random,
): OfertaRescateDT[] {
  const candidatos = candidatosRescateDT(clubes, clubUsuarioId, ligaNombre);
  if (candidatos.length === 0) return [];
  const factor = clamp(dt.reputacion, 0, 99) / 99 * 0.4
    + clamp(idolatria, 0, 100) / 100 * 0.3
    + clamp(confianzaDirectiva, 0, 100) / 100 * 0.3;
  const probabilidad = PROB_RESCATE_MIN + factor * PROB_RESCATE_RANGO;
  if (!garantizada && random() >= probabilidad) return [];
  const cantidad = Math.min(candidatos.length, 1 + Math.floor(factor * MAX_OFERTAS_RESCATE));
  return elegirVariosAlAzar(candidatos, cantidad).map((c) => {
    const contrato = contratoDTInicial(c.presupuesto);
    return {
      clubId: c.id, clubNombre: c.nombre, clubNc: c.nc, salarioOfrecido: contrato.salarioAnual, duracionOfrecida: contrato.temporadasRestantes,
    };
  });
}
