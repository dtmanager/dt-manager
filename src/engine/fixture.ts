// M4 — fixture de la liga (todos-contra-todos ida y vuelta, método del
// círculo) y su conexión con el motor de partido.ts. La tabla de
// posiciones se recalcula siempre desde cero a partir de los partidos
// jugados del fixture — más simple y menos propenso a bugs que ir
// actualizándola de a poco.

import type {
  Club, Jugador, Partido, TablaPosiciones,
} from '../types';
import { calcularFuerzaSector, simularPartido, type EquipoPartido } from './partido';
import { atribuirGoleadores } from './estadisticasPartido';
import { BUCKET_DE_POSICION, type SectorPosicion } from '../data/posiciones';
// idPartido: mismo bug ya documentado y resuelto en nombres.ts — un
// contador de módulo se resetea en cada reload de la página, pero los
// Partido que numera quedan persistidos en localStorage (useGameStore),
// así que una liga/fase de grupos nueva generada después de recargar
// podía repetir el id de un partido viejo ya guardado (ids duplicados
// rompían las keys de React de noticias.ts, que arma sus ids a partir de
// partido.id). Reusa idUnico (crypto.randomUUID(), sin estado de módulo)
// en vez de duplicar el fix.
import { idUnico } from './nombres';
function idPartido(): string {
  return idUnico('partido');
}

// Arma el fixture ida y vuelta con el método del círculo: en cada ronda,
// cada club juega exactamente un partido, y tras N-1 rondas todos jugaron
// contra todos una vez (soporta N impar agregando un "descanso" fijo).
export function generarFixture(clubIds: string[]): Partido[] {
  const lista = [...clubIds];
  if (lista.length % 2 !== 0) lista.push('');
  const n = lista.length;
  const mitad = n / 2;

  const idaPorRonda: [string, string][][] = [];
  let arreglo = [...lista];
  for (let ronda = 0; ronda < n - 1; ronda += 1) {
    const partidosRonda: [string, string][] = [];
    for (let i = 0; i < mitad; i += 1) {
      const a = arreglo[i];
      const b = arreglo[n - 1 - i];
      if (a && b) partidosRonda.push(ronda % 2 === 0 ? [a, b] : [b, a]);
    }
    idaPorRonda.push(partidosRonda);
    const fijo = arreglo[0];
    const resto = arreglo.slice(1);
    resto.unshift(resto.pop()!);
    arreglo = [fijo, ...resto];
  }

  const fixture: Partido[] = [];
  idaPorRonda.forEach((ronda, i) => {
    ronda.forEach(([local, visitante]) => {
      fixture.push({
        id: idPartido(), fecha: i + 1, localId: local, visitanteId: visitante, golesLocal: null, golesVisitante: null, partidoImportante: false,
      });
    });
  });
  const totalRondasIda = idaPorRonda.length;
  idaPorRonda.forEach((ronda, i) => {
    ronda.forEach(([local, visitante]) => {
      // Vuelta: se invierte la localía.
      fixture.push({
        id: idPartido(), fecha: totalRondasIda + i + 1, localId: visitante, visitanteId: local, golesLocal: null, golesVisitante: null, partidoImportante: false,
      });
    });
  });

  return fixture;
}

// Exportado para que eliminatoria.ts (llaves de copa) pueda atribuir
// goleadores/asistidores igual que acá, sin duplicar esta lectura.
export function titularesDeClub(club: Club): Jugador[] {
  return club.titularesIds
    .map((id) => club.plantel.find((j) => j.id === id))
    .filter((j): j is Jugador => j != null);
}

// Banco del partido (pedido explícito: "sistema de cambios y suplentes
// en partido") — mismo criterio de lectura que titularesDeClub, a partir
// de club.suplentesIds (ya viene acotado a 5 disponibles, ver
// PantallaArmarEquipo y desgaste.ts reemplazarLesionados).
export function suplentesDeClub(club: Club): Jugador[] {
  return club.suplentesIds
    .map((id) => club.plantel.find((j) => j.id === id))
    .filter((j): j is Jugador => j != null);
}

// Exportado para que otros motores de competición (copaNacional.ts,
// libertadoresYSudamericana.ts, championsEuropaConference.ts) puedan
// simular partidos entre clubes sin duplicar esta conversión.
export function equipoPartidoDeClub(club: Club): EquipoPartido {
  const titulares = titularesDeClub(club);
  // partido.ts sigue agrupando por 4 sectores (ARQ/DEF/MED/DEL) para
  // calcular fuerza agregada (usada por calcularPosesion) — las 10
  // posiciones granulares del plantel se agrupan acá vía BUCKET_DE_POSICION
  // (ver data/posiciones.ts). Desde rediseno-motor-partido.md fase 2 el
  // motor también necesita los `titulares` reales (no sólo el agregado)
  // para resolver los duelos 1v1 de la posesión por zonas.
  const porPosicion: Record<SectorPosicion, number[]> = { ARQ: [], DEF: [], MED: [], DEL: [] };
  titulares.forEach((j) => porPosicion[BUCKET_DE_POSICION[j.posicion]].push(j.grl));

  return {
    sector: calcularFuerzaSector(porPosicion),
    dt: club.dt,
    cohesion: club.cohesion,
    titulares,
    suplentes: suplentesDeClub(club),
    mentalidad: club.mentalidad,
  };
}

// Simula UN partido del fixture (ya con localId/visitanteId asignados) y
// devuelve el Partido actualizado con el resultado. `partidoImportante` se
// marca automáticamente cuando juega el club del usuario (sección 5.2).
export function simularPartidoDeFixture(partido: Partido, clubes: Record<string, Club>, clubUsuarioId: string): Partido {
  const local = clubes[partido.localId];
  const visitante = clubes[partido.visitanteId];
  if (!local || !visitante) return partido;

  const partidoImportante = partido.localId === clubUsuarioId || partido.visitanteId === clubUsuarioId;
  const resultado = simularPartido(equipoPartidoDeClub(local), equipoPartidoDeClub(visitante), partidoImportante);
  const goles = atribuirGoleadores(resultado.eventosGol, titularesDeClub(local), titularesDeClub(visitante), resultado.eventos);

  return {
    ...partido,
    golesLocal: resultado.golesLocal,
    golesVisitante: resultado.golesVisitante,
    partidoImportante,
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
    // xG acumulado (pedido explícito: "xG visible en el detalle de
    // partido") — redondeado a 2 decimales, no tiene sentido persistir
    // más precisión que la que se va a mostrar.
    xgLocal: Math.round(resultado.xgLocal * 100) / 100,
    xgVisitante: Math.round(resultado.xgVisitante * 100) / 100,
    // Cambios (pedido explícito: "sistema de cambios y suplentes en
    // partido") — mismo criterio que `tarjetas` arriba: detalle jugador
    // por jugador (sale/entra) más los contadores ya sumados.
    cambios: resultado.eventos
      .filter((e): e is typeof e & { jugadorId: string; jugadorEntraId: string } => e.tipo === 'cambio' && e.jugadorId != null && e.jugadorEntraId != null)
      .map((e) => ({
        equipo: e.equipo, jugadorSaleId: e.jugadorId, jugadorEntraId: e.jugadorEntraId, minuto: e.minuto, minutoAgregado: e.minutoAgregado,
      })),
    cambiosLocal: resultado.cambiosLocal,
    cambiosVisitante: resultado.cambiosVisitante,
    // Visualizador: sólo se guarda la secuencia completa de eventos para
    // los partidos del club del usuario — medido en una temporada real,
    // guardarla para TODOS los partidos de la liga pesaba 14.6 MB (187
    // eventos/partido en promedio), muy por encima de lo que localStorage
    // banca. Nadie necesita repasar animado un partido entre dos clubes
    // de la IA de todas formas; partidoImportante ya es exactamente "juega
    // el club del usuario", así que reusarlo acá no agrega ningún cálculo
    // nuevo.
    eventos: partidoImportante ? resultado.eventos : undefined,
  };
}

export function simularJornada(fixture: Partido[], fecha: number, clubes: Record<string, Club>, clubUsuarioId: string): Partido[] {
  return fixture.map((p) => (p.fecha === fecha && p.golesLocal == null ? simularPartidoDeFixture(p, clubes, clubUsuarioId) : p));
}

export function proximaFechaSinJugar(fixture: Partido[]): number | null {
  const pendiente = fixture.find((p) => p.golesLocal == null);
  return pendiente ? pendiente.fecha : null;
}

export function calcularTabla(fixture: Partido[], clubIds: string[]): TablaPosiciones[] {
  const tabla: Record<string, TablaPosiciones> = {};
  clubIds.forEach((id) => {
    tabla[id] = {
      clubId: id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    };
  });

  fixture.forEach((p) => {
    if (p.golesLocal == null || p.golesVisitante == null) return;
    const local = tabla[p.localId];
    const visitante = tabla[p.visitanteId];
    if (!local || !visitante) return;

    local.pj += 1;
    visitante.pj += 1;
    local.gf += p.golesLocal;
    local.gc += p.golesVisitante;
    visitante.gf += p.golesVisitante;
    visitante.gc += p.golesLocal;

    if (p.golesLocal > p.golesVisitante) {
      local.pg += 1;
      local.pts += 3;
      visitante.pp += 1;
    } else if (p.golesLocal < p.golesVisitante) {
      visitante.pg += 1;
      visitante.pts += 3;
      local.pp += 1;
    } else {
      local.pe += 1;
      visitante.pe += 1;
      local.pts += 1;
      visitante.pts += 1;
    }
  });

  return Object.values(tabla).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc) || b.gf - a.gf);
}
