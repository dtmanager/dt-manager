// M5 — mercado de pases (sección 6). Funciones puras: calculan
// necesidad/ofertas/probabilidades, pero no tocan el store — eso lo hace
// useGameStore.

import type { Club, DT, Jugador, Partido, Posicion } from '../types';
import { clamp, elegirVariosAlAzar, randomEntero, randomUniforme } from './random';
import { hayCupo } from './contratos';
import { LIGAS, paisDeLiga } from '../data/ligas';
import { generarClub } from './liga';
import { generarNombreJugador } from './nombres';

// La spec describe la "necesidad" en palabras ("si tiene pocos jugadores
// buenos en esa posición respecto al resto del plantel") sin fórmula
// exacta — se implementó como qué tan por debajo está el promedio de esa
// posición respecto al promedio general del plantel, normalizado 0-1.
export function calcularNecesidad(club: Club, posicion: Posicion): number {
  const jugadoresPosicion = club.plantel.filter((j) => j.posicion === posicion);
  const promPosicion = jugadoresPosicion.length
    ? jugadoresPosicion.reduce((a, j) => a + j.grl, 0) / jugadoresPosicion.length
    : 0;
  const promPlantel = club.plantel.length ? club.plantel.reduce((a, j) => a + j.grl, 0) / club.plantel.length : 0;
  if (promPlantel === 0) return 0;
  return clamp((promPlantel - promPosicion) / 20, 0, 1);
}

const UMBRAL_INTERES = 0.15;

// 6.2 — evalúa, por cada club de la liga (menos el vendedor), si le
// interesa un jugador puesto en el mercado y genera una oferta si
// corresponde (0.8x-1.2x el valor de mercado).
export function evaluarOfertasIA(
  jugador: Jugador,
  clubVendedorId: string,
  clubes: Record<string, Club>,
): { clubOfertanteId: string; monto: number }[] {
  const ofertas: { clubOfertanteId: string; monto: number }[] = [];

  Object.values(clubes).forEach((club) => {
    if (club.id === clubVendedorId) return;
    if (!hayCupo(club)) return;
    const necesidad = calcularNecesidad(club, jugador.posicion);
    if (necesidad < UMBRAL_INTERES) return;
    const montoMinimo = jugador.valorMercado * 0.8;
    if (club.presupuesto < montoMinimo) return;
    const monto = Math.round(jugador.valorMercado * randomUniforme(0.8, 1.2));
    ofertas.push({ clubOfertanteId: club.id, monto });
  });

  return ofertas;
}

// 6.3 — probabilidad de que el club vendedor acepte una oferta del
// usuario por un jugador que no es libre.
export function probabilidadAceptarOferta(montoOfrecido: number, valorMercado: number, dtVendedor: DT): number {
  const factorAceptacion = clamp(montoOfrecido / (valorMercado * 1.1), 0, 1.3);
  return clamp(factorAceptacion - (dtVendedor.mercado - 50) / 200, 0, 1);
}

// -------------------- mercado "arcade" (pedido explícito) --------------------
//
// No hay un motor real de decisiones de la IA para que un club rival
// decida poner un jugador en venta — sin esto, "De otros clubes" queda
// vacío para siempre, porque nada marca transferible=true en un plantel
// que no sea el del usuario. En su lugar: cada cierre de temporada se
// resortea qué clubes rivales ponen a algún jugador de su propio plantel
// en el mercado. Al ser jugadores reales (no una lista aparte), evolucionan
// solos con evolucionarClub como cualquiera, y como se resortea todas las
// temporadas, la oferta va rotando.
const PROB_LISTAR_JUGADOR = 0.2;

export function rotarListadosIA(clubes: Record<string, Club>, clubUsuarioId: string): Record<string, Club> {
  const resultado: Record<string, Club> = {};

  Object.values(clubes).forEach((club) => {
    if (club.id === clubUsuarioId) {
      resultado[club.id] = club;
      return;
    }

    // Se limpia lo que quedó listado de la temporada anterior (si no se
    // vendió, el club se lo queda) y se resortea de cero.
    let plantel = club.plantel.map((j) => (j.transferible ? { ...j, transferible: false } : j));
    if (plantel.length > 0 && Math.random() < PROB_LISTAR_JUGADOR) {
      const idx = Math.floor(Math.random() * plantel.length);
      plantel = plantel.map((j, i) => (i === idx ? { ...j, transferible: true } : j));
    }
    resultado[club.id] = { ...club, plantel };
  });

  return resultado;
}

// -------------------- mercado internacional (pedido explícito) --------------------
//
// En vez de simular las ~21 ligas del juego en paralelo para tener un
// mercado internacional "real" (costaría rehacer buena parte del loop
// central del juego), cada temporada se genera un puñado de clubes
// extranjeros livianos — mismo motor que arma los rivales de la Copa
// Internacional (generarClub con datos reales de otra liga) — con 1-2
// jugadores en venta. No tienen fixture ni se simulan partido a partido:
// sólo existen para que esos jugadores aparezcan listados en "De otros
// clubes" del mercado, reusando el flujo de oferta ya existente.
const CLUBES_EXTRANJEROS_POR_TEMPORADA = 5;

export function generarClubesExtranjeros(nombreLigaActual: string): Record<string, Club> {
  const pool = LIGAS
    .filter((l) => l.disponible && l.nombre !== nombreLigaActual)
    .flatMap((l) => l.clubes.map((c) => ({ club: c, nombreLiga: l.nombre })));

  const elegidos = elegirVariosAlAzar(pool, CLUBES_EXTRANJEROS_POR_TEMPORADA);
  const clubes: Record<string, Club> = {};

  elegidos.forEach(({ club, nombreLiga }) => {
    const clubGenerado = generarClub(club, {
      liga: nombreLiga, esControladoPorUsuario: false, nombreDT: generarNombreJugador(club.pais ?? paisDeLiga(nombreLiga) ?? undefined),
    });
    const cantidadEnVenta = randomEntero(1, 2);
    const idsEnVenta = new Set(elegirVariosAlAzar(clubGenerado.plantel, cantidadEnVenta).map((j) => j.id));
    clubes[clubGenerado.id] = {
      ...clubGenerado,
      plantel: clubGenerado.plantel.map((j) => (idsEnVenta.has(j.id) ? { ...j, transferible: true } : j)),
    };
  });

  return clubes;
}

// -------------------- ventana de mercado (pedido explícito) --------------------
//
// Hasta acá el mercado estaba SIEMPRE abierto, sin ninguna restricción —
// no por una regla explícita, sino porque nunca se implementó ningún
// concepto de ventana (ver docs/calendario-real-y-ventanas-de-mercado.md,
// investigación previa). No hay un reloj real compartido entre
// competencias (mismo motivo que engine/calendario.ts), así que la
// ventana se ancla a la fecha de LIGA ya jugada, no a una fecha calendario
// real: verano = pretemporada + las primeras `SEMANAS_VENTANA_VERANO`
// fechas (mismo comportamiento "siempre abierto" que ya tenía el juego al
// arranque de temporada, ahora con una fecha de cierre); invierno = una
// ventana corta a mitad de temporada (equivalente al parate real de
// enero); el resto del año el mercado queda cerrado para fichajes nuevos.
export type VentanaMercado = 'cerrado' | 'verano' | 'invierno';

const SEMANAS_VENTANA_VERANO = 4;
const DURACION_VENTANA_INVIERNO = 3;

// Última fecha de liga YA RESUELTA (0 si la temporada todavía no arrancó
// — pretemporada) — a diferencia de `proximaFechaSinJugar`
// (engine/fixture.ts), que da la PRÓXIMA pendiente, acá interesa hasta
// dónde se jugó de verdad.
export function semanaActualDeLiga(fixture: Partido[]): number {
  const jugadas = fixture.filter((p) => p.golesLocal != null).map((p) => p.fecha);
  return jugadas.length > 0 ? Math.max(...jugadas) : 0;
}

// Semana en la que abre la ventana de invierno — mitad del fixture de
// liga, redondeado. No hace falta más precisión que esto (mismo criterio
// de honestidad que engine/calendario.ts): no hay una fecha real de
// enero en este motor, sólo una temporada de N fechas corridas.
export function semanaAperturaVentanaInvierno(fixture: Partido[]): number {
  const maxSemana = fixture.length > 0 ? Math.max(...fixture.map((p) => p.fecha)) : 1;
  return Math.round(maxSemana / 2) - 1;
}

export interface InfoVentanaMercado {
  ventana: VentanaMercado;
  semanaActual: number;
  semanaAperturaInvierno: number;
}

export function calcularVentanaMercado(fixture: Partido[]): InfoVentanaMercado {
  const semanaActual = semanaActualDeLiga(fixture);
  const semanaAperturaInvierno = semanaAperturaVentanaInvierno(fixture);
  const semanaCierreInvierno = semanaAperturaInvierno + DURACION_VENTANA_INVIERNO;

  let ventana: VentanaMercado;
  if (semanaActual <= SEMANAS_VENTANA_VERANO) ventana = 'verano';
  else if (semanaActual >= semanaAperturaInvierno && semanaActual <= semanaCierreInvierno) ventana = 'invierno';
  else ventana = 'cerrado';

  return { ventana, semanaActual, semanaAperturaInvierno };
}
