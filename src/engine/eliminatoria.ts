// Motor genérico de eliminación directa (prompt-copas-manager-app.md,
// fase 1 — "es la pieza que falta y la van a reusar todas las
// competiciones"). Hasta ahora sólo existía todos-contra-todos
// (fixture.ts) y una final a partido único hardcodeada dentro de
// copaInternacional.ts. Esto sirve tanto para llaves a partido único
// (copas nacionales, finales) como ida y vuelta con agregado de goles
// (octavos en adelante de Libertadores/Sudamericana/UEFA).
//
// Simplificación documentada (pedida en el prompt): no hay regla de gol
// de visitante (se sacó de las competencias reales desde 2021, así que
// no reproducirla es más fiel a hoy, no menos). Empate en el agregado
// (o en partido único) se define por penales — sistema-penales-diseno.md:
// tanda kick-by-kick real (antes era un sorteo pesado por GRL promedio,
// sin jugadores puntuales ni pateador por pateador).

import type { Club, DT, Jugador, Partido } from '../types';
import {
  simularPartido, simularAlargue, ordenPateadoresPorTiro, type ResultadoPartido,
} from './partido';
import { equipoPartidoDeClub, titularesDeClub } from './fixture';
import { atribuirGoleadores } from './estadisticasPartido';
import { clamp } from './random';
// idUnico: mismo bug que documenta nombres.ts (contador de módulo que se
// resetea en cada reload pero los ids que genera quedan persistidos en
// localStorage) — acá era peor porque colisionaba entre sesiones (una
// llave nueva de copa después de recargar la página pisaba el id de un
// partido viejo ya guardado), no sólo entre closures de HMR. Reusa la
// misma solución (crypto.randomUUID(), sin estado de módulo) en vez de
// duplicar el fix con otro nombre.
import { idUnico } from './nombres';

export interface Llave {
  id: string;
  ronda: string;
  localId: string;
  visitanteId: string;
  aPartidoUnico: boolean;
  partidoIda: Partido | null; // null si aPartidoUnico
  partidoVuelta: Partido; // si aPartidoUnico, este es el único partido de la llave
  ganadorId: string | null; // null hasta que se simula
  penales: boolean;
  // Detalle pateador por pateador de la tanda — sólo si penales === true.
  // Opcional para no romper llaves ya guardadas en localStorage de antes
  // de sistema-penales-diseno.md.
  detallePenales?: TandaPenales;
}

export function armarLlave(ronda: string, localId: string, visitanteId: string, aPartidoUnico: boolean): Llave {
  const partidoVuelta: Partido = {
    id: idUnico('partido-llave'),
    fecha: aPartidoUnico ? 1 : 2,
    // En la vuelta se invierte la localía respecto a la ida.
    localId: aPartidoUnico ? localId : visitanteId,
    visitanteId: aPartidoUnico ? visitanteId : localId,
    golesLocal: null,
    golesVisitante: null,
    partidoImportante: true,
  };
  const partidoIda: Partido | null = aPartidoUnico ? null : {
    id: idUnico('partido-llave'),
    fecha: 1,
    localId,
    visitanteId,
    golesLocal: null,
    golesVisitante: null,
    partidoImportante: true,
  };

  return {
    id: idUnico('llave'), ronda, localId, visitanteId, aPartidoUnico, partidoIda, partidoVuelta, ganadorId: null, penales: false,
  };
}

// -------------------- sistema-penales-diseno.md — tanda de penales --------------------

export interface TiroPenal {
  equipo: 'local' | 'visitante';
  jugadorId: string;
  gol: boolean;
  ronda: number; // 1-based; 6+ es muerte súbita
}

export interface TandaPenales {
  tiros: TiroPenal[];
  ganadorId: string;
}

const RONDA_PRESION_DESDE = 4;

// Probabilidad de convertir UN tiro de la tanda — mismo mecanismo que
// probabilidadConvertirPenal (partido.ts) pero con la base/coeficientes
// propios que da el documento: además de tiro/atajada, pesa la
// `mentalidad` del DT del que patea (presión del momento) y una penalidad
// creciente desde la ronda 4 (cuanto más se estira la tanda, más pesa la
// presión).
export function probabilidadConvertirTanda(
  pateador: Jugador,
  arquero: Jugador | null,
  dtPateador: DT,
  ronda: number,
): number {
  const tiro = pateador.subStats?.tiro ?? pateador.grl;
  const atajada = arquero?.subStatsArquero?.atajada ?? arquero?.grl ?? 65;
  const presion = ronda >= RONDA_PRESION_DESDE ? (ronda - RONDA_PRESION_DESDE + 1) * 0.02 : 0;
  return clamp(
    0.694 + (tiro - 70) / 300 - (atajada - 70) / 350 + (dtPateador.mentalidad - 50) / 400 - presion,
    0.35,
    0.92,
  );
}

function arqueroDelClub(titulares: Jugador[]): Jugador | null {
  return titulares.find((j) => j.posicion === 'ARQ') ?? null;
}

// Simula la tanda completa, pateador por pateador: 5 rondas fijas y, si
// sigue empatado, muerte súbita ronda por ronda (un tiro cada uno, corta
// apenas quedan desparejados). Si un plantel tiene menos de 5 pateadores
// de campo (no debería pasar con 11 titulares reales) el orden se
// recicla — mismo criterio que en la vida real una vez que ya pateó todo
// el equipo.
export function simularTandaPenales(local: Club, visitante: Club): TandaPenales {
  const titularesLocal = titularesDeClub(local);
  const titularesVisitante = titularesDeClub(visitante);
  const pateadoresLocal = ordenPateadoresPorTiro(titularesLocal);
  const pateadoresVisitante = ordenPateadoresPorTiro(titularesVisitante);
  const arqueroLocal = arqueroDelClub(titularesLocal);
  const arqueroVisitante = arqueroDelClub(titularesVisitante);

  const tiros: TiroPenal[] = [];
  let golesLocal = 0;
  let golesVisitante = 0;
  let ronda = 1;

  const patear = (equipo: 'local' | 'visitante') => {
    const pateadores = equipo === 'local' ? pateadoresLocal : pateadoresVisitante;
    if (pateadores.length === 0) return;
    const arqueroRival = equipo === 'local' ? arqueroVisitante : arqueroLocal;
    const dt = equipo === 'local' ? local.dt : visitante.dt;
    const pateador = pateadores[(ronda - 1) % pateadores.length];
    const prob = probabilidadConvertirTanda(pateador, arqueroRival, dt, ronda);
    const gol = Math.random() < prob;
    tiros.push({ equipo, jugadorId: pateador.id, gol, ronda });
    if (gol) {
      if (equipo === 'local') golesLocal += 1;
      else golesVisitante += 1;
    }
  };

  // Cota de seguridad (ronda > 30): no debería hacer falta en la práctica,
  // pero evita un loop infinito ante un bug futuro en la probabilidad.
  while ((ronda <= 5 || golesLocal === golesVisitante) && ronda <= 30) {
    patear('local');
    patear('visitante');
    ronda += 1;
  }

  const ganadorId = golesLocal >= golesVisitante ? local.id : visitante.id;
  return { tiros, ganadorId };
}

function partidoDesdeResultado(partido: Partido, clubLocal: Club, clubVisitante: Club, resultado: ResultadoPartido): Partido {
  const goles = atribuirGoleadores(resultado.eventosGol, titularesDeClub(clubLocal), titularesDeClub(clubVisitante), resultado.eventos);
  return {
    ...partido,
    golesLocal: resultado.golesLocal,
    golesVisitante: resultado.golesVisitante,
    goles,
    posesionLocal: Math.round(resultado.posesionLocal),
    tirosLocal: resultado.tirosLocal,
    tirosVisitante: resultado.tirosVisitante,
    cornersLocal: resultado.cornersLocal,
    cornersVisitante: resultado.cornersVisitante,
    faltasLocal: resultado.faltasLocal,
    faltasVisitante: resultado.faltasVisitante,
    penalesLocal: resultado.penalesLocal,
    penalesVisitante: resultado.penalesVisitante,
    tarjetas: resultado.eventosTarjeta,
    tarjetasAmarillasLocal: resultado.tarjetasAmarillasLocal,
    tarjetasAmarillasVisitante: resultado.tarjetasAmarillasVisitante,
    tarjetasRojasLocal: resultado.tarjetasRojasLocal,
    tarjetasRojasVisitante: resultado.tarjetasRojasVisitante,
    xgLocal: Math.round(resultado.xgLocal * 100) / 100,
    xgVisitante: Math.round(resultado.xgVisitante * 100) / 100,
    cambios: resultado.eventos
      .filter((e): e is typeof e & { jugadorId: string; jugadorEntraId: string } => e.tipo === 'cambio' && e.jugadorId != null && e.jugadorEntraId != null)
      .map((e) => ({
        equipo: e.equipo, jugadorSaleId: e.jugadorId, jugadorEntraId: e.jugadorEntraId, minuto: e.minuto, minutoAgregado: e.minutoAgregado,
      })),
    cambiosLocal: resultado.cambiosLocal,
    cambiosVisitante: resultado.cambiosVisitante,
    // Visualizador: NO se guarda acá (a diferencia de fixture.ts) — este
    // motor no tiene clubUsuarioId a mano para acotar el guardado sólo a
    // los partidos del usuario (ver el comentario largo en fixture.ts:
    // guardar la secuencia completa de TODOS los partidos de una copa de
    // 32+ equipos pesaría demasiado). Queda para una vuelta futura si se
    // quiere el visualizador en copas también.
  };
}

// Mismo detalle que simularPartidoDeFixture (fixture.ts) — goleadores +
// estadísticas del motor de posesión (posesión, tiros, córners, faltas),
// para que el detalle de partido (pedido explícito: "clickear un partido
// y ver todas las stats") también funcione en copas, no sólo en la liga.
//
// Devuelve también el ResultadoPartido crudo (null si el partido ya
// estaba simulado de antes — caso raro, ver comentario en simularLlave)
// para que simularLlave pueda jugar el alargue como CONTINUACIÓN de este
// mismo partido si hace falta, sin tener que reconstruirlo desde cero.
function simularSiFalta(partido: Partido, clubes: Record<string, Club>): { partido: Partido; resultado: ResultadoPartido | null } {
  if (partido.golesLocal != null) return { partido, resultado: null };
  const equipoLocal = clubes[partido.localId];
  const equipoVisitante = clubes[partido.visitanteId];
  if (!equipoLocal || !equipoVisitante) return { partido, resultado: null };
  const resultado = simularPartido(equipoPartidoDeClub(equipoLocal), equipoPartidoDeClub(equipoVisitante), true);
  return { partido: partidoDesdeResultado(partido, equipoLocal, equipoVisitante, resultado), resultado };
}

// Alargue (pedido explícito) — sólo se juega en el partido DECISIVO de la
// llave (la vuelta, o el único partido si aPartidoUnico), como
// continuación de ESE partido, no uno nuevo. `resultado` es null cuando
// simularSiFalta encontró el partido ya simulado de una corrida anterior
// (guardado + recargado a mitad de una llave sin ganador — no debería
// pasar en el flujo normal, ver comentario de simularSiFalta): en ese
// caso raro se cae directo a penales en vez de alargue, mejor eso que
// reventar.
function aplicarAlargueSiHaceFalta(
  partido: Partido,
  resultado: ResultadoPartido | null,
  clubes: Record<string, Club>,
): Partido {
  if (!resultado) return partido;
  const clubLocal = clubes[partido.localId];
  const clubVisitante = clubes[partido.visitanteId];
  if (!clubLocal || !clubVisitante) return partido;
  const resultadoExtendido = simularAlargue(equipoPartidoDeClub(clubLocal), equipoPartidoDeClub(clubVisitante), resultado);
  return { ...partidoDesdeResultado(partido, clubLocal, clubVisitante, resultadoExtendido), huboAlargue: true };
}

// Simula lo que falte de la llave (ida si corresponde, siempre la
// vuelta/partido único) y resuelve el ganador por agregado de goles — por
// alargue (30' extra en el partido decisivo) y, si sigue empatado, por
// penales.
export function simularLlave(llave: Llave, clubes: Record<string, Club>): Llave {
  if (llave.ganadorId) return llave;
  const local = clubes[llave.localId];
  const visitante = clubes[llave.visitanteId];
  if (!local || !visitante) return llave;

  const idaResultado = llave.partidoIda ? simularSiFalta(llave.partidoIda, clubes) : null;
  const partidoIda = idaResultado?.partido ?? null;
  let { partido: partidoVuelta, resultado: resultadoVuelta } = simularSiFalta(llave.partidoVuelta, clubes);

  const calcularAgregado = (): [number, number] => {
    if (llave.aPartidoUnico) {
      return [partidoVuelta.golesLocal!, partidoVuelta.golesVisitante!];
    }
    // La vuelta tiene la localía invertida: el "local" de la llave es
    // visitante en ese partido.
    return [
      partidoIda!.golesLocal! + partidoVuelta.golesVisitante!,
      partidoIda!.golesVisitante! + partidoVuelta.golesLocal!,
    ];
  };

  let [golesLocalAgregado, golesVisitanteAgregado] = calcularAgregado();

  if (golesLocalAgregado === golesVisitanteAgregado) {
    partidoVuelta = aplicarAlargueSiHaceFalta(partidoVuelta, resultadoVuelta, clubes);
    resultadoVuelta = null; // ya se consumió — no se puede volver a jugar alargue sobre esto
    [golesLocalAgregado, golesVisitanteAgregado] = calcularAgregado();
  }

  let ganadorId: string;
  let penales = false;
  let detallePenales: TandaPenales | undefined;
  if (golesLocalAgregado > golesVisitanteAgregado) {
    ganadorId = llave.localId;
  } else if (golesVisitanteAgregado > golesLocalAgregado) {
    ganadorId = llave.visitanteId;
  } else {
    penales = true;
    detallePenales = simularTandaPenales(local, visitante);
    ganadorId = detallePenales.ganadorId;
  }

  return {
    ...llave, partidoIda, partidoVuelta, ganadorId, penales, detallePenales,
  };
}

// Nombre de ronda a partir de cuántos equipos quedan (potencia de 2).
export function nombreRonda(equiposRestantes: number): string {
  if (equiposRestantes <= 2) return 'Final';
  if (equiposRestantes <= 4) return 'Semifinal';
  if (equiposRestantes <= 8) return 'Cuartos de final';
  if (equiposRestantes <= 16) return 'Octavos de final';
  if (equiposRestantes <= 32) return 'Dieciseisavos de final';
  return `Ronda de ${equiposRestantes}`;
}

export function siguientePotenciaDeDos(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Arma el cuadro de la primera ronda de un torneo de eliminación directa
// a partir de una lista de clubes cualquiera (no necesariamente potencia
// de 2 — sorteo aleatorio parejo, con "byes" para los que sobran hasta
// completar la potencia de 2 más chica; esos clubes entran directo a la
// segunda ronda). Usado por copaNacional.ts y por los octavos de
// Libertadores/Sudamericana/UEFA cuando la cantidad de clasificados no
// da justo una potencia de 2.
export function armarPrimeraRonda(
  clubIds: string[],
  aPartidoUnico: boolean,
): { llaves: Llave[]; clasificadosPendientes: string[]; nombreRonda: string } {
  const objetivo = siguientePotenciaDeDos(clubIds.length);
  const cantidadByes = objetivo - clubIds.length;
  const mezclados = [...clubIds].sort(() => Math.random() - 0.5);
  const clasificadosPendientes = mezclados.slice(0, cantidadByes);
  const jugables = mezclados.slice(cantidadByes);

  const ronda = nombreRonda(objetivo);
  const llaves: Llave[] = [];
  for (let i = 0; i < jugables.length; i += 2) {
    llaves.push(armarLlave(ronda, jugables[i], jugables[i + 1], aPartidoUnico));
  }

  return { llaves, clasificadosPendientes, nombreRonda: ronda };
}

// Arma la ronda siguiente a partir de los ganadores de la ronda anterior
// (ya simulada) + los clasificados pendientes (byes) que todavía no
// jugaron. Devuelve [] si sólo queda un clasificado (ya hay campeón).
export function armarSiguienteRonda(
  llavesAnteriores: Llave[],
  clasificadosPendientes: string[],
  aPartidoUnico: boolean,
): { llaves: Llave[]; nombreRonda: string | null } {
  const ganadores = llavesAnteriores.map((l) => l.ganadorId).filter((id): id is string => id != null);
  const clasificados = [...ganadores, ...clasificadosPendientes];
  if (clasificados.length <= 1) return { llaves: [], nombreRonda: null };

  const mezclados = [...clasificados].sort(() => Math.random() - 0.5);
  const ronda = nombreRonda(mezclados.length);
  const llaves: Llave[] = [];
  for (let i = 0; i < mezclados.length; i += 2) {
    llaves.push(armarLlave(ronda, mezclados[i], mezclados[i + 1], aPartidoUnico));
  }
  return { llaves, nombreRonda: ronda };
}
