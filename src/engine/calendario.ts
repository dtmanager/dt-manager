// Calendario unificado (pedido explícito: "calendario real con fechas").
//
// Limitación de base honesta, documentada para quien toque esto después:
// el motor NO tiene un reloj/fecha compartido entre competencias — cada
// una (liga, copa nacional, copa conmebol, copa uefa, copa mundial) corre
// totalmente desacoplada, con su propio contador de ronda/fecha interno,
// avanzada por un botón de "simular" independiente (ver
// useGameStore.ts). No existe ningún Date real en todo el juego, sólo
// contadores de jornada.
//
// Este módulo NO le inventa un reloj maestro al motor (eso sería un
// cambio mucho más grande, tocando los 5 motores de competencia) — sólo
// CALCULA, puramente para mostrar, una semana ilustrativa por partido:
// - Liga: semana = fecha real (1 a 1, ya es secuencial).
// - Copas: como no comparten reloj con la liga, se reparten sus rondas/
//   fechas de grupo en huecos espaciados a lo largo de la temporada de
//   liga (mismo criterio visual que un fixture real de copa doméstica
//   intercalado entre semanas de liga) — es una ubicación aproximada,
//   no algo que el motor imponga ni que limite cuándo se puede simular
//   cada cosa (eso sigue siendo libre, botón por botón, como siempre).
// Ningún partido/ronda futuro que todavía no existe (rondas de
// eliminación directa no jugadas, por ejemplo) puede tener semana: recién
// se genera cuando la ronda anterior se resuelve, igual que en la vida
// real no se sabe el cruce de semifinal hasta que termina cuartos.

import type {
  Club, GolPartido, Liga, Partido,
} from '../types';
import type { CopaNacional } from './copaNacional';
import type { TorneoConmebol } from './libertadoresYSudamericana';
import type { CompeticionSuiza } from './championsEuropaConference';
import type { CopaMundialClubes } from './copaMundialClubes';
import type { Llave } from './eliminatoria';

export type TipoEntradaCalendario =
  | 'pretemporada' | 'liga' | 'copa-nacional' | 'copa-conmebol' | 'copa-uefa' | 'copa-mundial' | 'mercado';

// Mismos nombres de pantalla que App.tsx (pantalla union) — así el
// consumidor del calendario puede navegar directo con setPantalla.
// Pretemporada no tiene pantalla propia (pedido explícito: "borra el
// menu de pretemporada" — se juega desde la tarjeta de "próximo
// partido" del Hub, como liga/copas) — sus entradas navegan a 'plantel'
// (el Hub) en vez de a una pantalla dedicada.
export type PantallaDeEntrada = 'liga' | 'copa-nacional' | 'copa-conmebol' | 'copa-uefa' | 'copa' | 'plantel' | 'mercado';

export interface EntradaCalendario {
  id: string;
  semana: number;
  tipo: TipoEntradaCalendario;
  competencia: string;
  etiquetaRonda: string;
  rivalId?: string;
  rivalNombre?: string;
  esLocal?: boolean;
  jugado: boolean;
  golesPropios: number | null;
  golesRival: number | null;
  // Mini resumen del partido (pedido explícito: "agrega un mini resumen
  // del partido ahí" — en la tarjeta del Hub, junto al resultado) — los
  // goles TAL CUAL los guarda el motor (mismo campo que ya usa
  // PantallaDetallePartido), no un resumen inventado aparte. null cuando
  // no está jugado o el partido no trae detalle (amistoso viejo, etc.).
  goles: GolPartido[] | null;
  pantalla: PantallaDeEntrada;
}

function semanasEscalonadas(cantidad: number, desde: number, paso: number, maxSemana: number): number[] {
  return Array.from({ length: cantidad }, (_, i) => Math.min(maxSemana, desde + i * paso));
}

function nombreClub(clubes: Record<string, Club>, id: string): string {
  return clubes[id]?.nombre ?? id;
}

function entradaDePartido(
  partido: Partido,
  clubUsuarioId: string,
  semana: number,
  tipo: TipoEntradaCalendario,
  competencia: string,
  etiquetaRonda: string,
  clubes: Record<string, Club>,
  pantalla: PantallaDeEntrada,
): EntradaCalendario | null {
  const esLocal = partido.localId === clubUsuarioId;
  const esVisitante = partido.visitanteId === clubUsuarioId;
  if (!esLocal && !esVisitante) return null;
  const rivalId = esLocal ? partido.visitanteId : partido.localId;
  const jugado = partido.golesLocal != null && partido.golesVisitante != null;

  return {
    id: partido.id,
    semana,
    tipo,
    competencia,
    etiquetaRonda,
    rivalId,
    rivalNombre: nombreClub(clubes, rivalId),
    esLocal,
    jugado,
    golesPropios: jugado ? (esLocal ? partido.golesLocal! : partido.golesVisitante!) : null,
    golesRival: jugado ? (esLocal ? partido.golesVisitante! : partido.golesLocal!) : null,
    goles: jugado ? (partido.goles ?? null) : null,
    pantalla,
  };
}

// Llaves de eliminación directa (copa nacional y el bracket de las
// internacionales) — cada llave puede tener ida+vuelta o partido único;
// se listan los partidos que existan (partidoIda si no es a partido
// único, siempre partidoVuelta) como entradas separadas, misma ronda.
function entradasDeLlaves(
  llaves: Llave[],
  semana: number,
  clubUsuarioId: string,
  tipo: TipoEntradaCalendario,
  competencia: string,
  etiquetaRonda: string,
  clubes: Record<string, Club>,
  pantalla: PantallaDeEntrada,
): EntradaCalendario[] {
  return llaves
    .filter((l) => l.localId === clubUsuarioId || l.visitanteId === clubUsuarioId)
    .flatMap((l) => {
      const partidos = l.partidoIda ? [l.partidoIda, l.partidoVuelta] : [l.partidoVuelta];
      return partidos
        .map((p) => entradaDePartido(p, clubUsuarioId, semana, tipo, competencia, etiquetaRonda, clubes, pantalla))
        .filter((e): e is EntradaCalendario => e != null);
    });
}

export function construirCalendario(args: {
  clubUsuarioId: string;
  clubes: Record<string, Club>;
  liga: Liga;
  partidosPretemporada: Partido[];
  copaNacional: CopaNacional | null;
  copaConmebol: TorneoConmebol | null;
  copaUefa: CompeticionSuiza | null;
  copaMundialClubes: CopaMundialClubes | null;
}): EntradaCalendario[] {
  const {
    clubUsuarioId, clubes, liga, partidosPretemporada, copaNacional, copaConmebol, copaUefa, copaMundialClubes,
  } = args;
  const entradas: EntradaCalendario[] = [];
  const maxSemana = liga.fixture.length > 0 ? Math.max(...liga.fixture.map((p) => p.fecha)) : 1;

  // Pretemporada — antes de todo, semana 0.
  partidosPretemporada.forEach((p) => {
    const entrada = entradaDePartido(p, clubUsuarioId, 0, 'pretemporada', 'Pretemporada', 'Amistoso', clubes, 'plantel');
    if (entrada) entradas.push(entrada);
  });

  // Mercado — no hay ventana real (siempre está abierto, ver
  // engine/mercado.ts), así que va un único recordatorio al arranque de
  // la temporada en vez de fingir una fecha de apertura que no existe.
  entradas.push({
    id: `mercado-${liga.temporadaActual}`,
    semana: 1,
    tipo: 'mercado',
    competencia: 'Mercado de pases',
    etiquetaRonda: 'Abierto toda la temporada',
    jugado: false,
    golesPropios: null,
    golesRival: null,
    goles: null,
    pantalla: 'mercado',
  });

  // Liga — 1 a 1 con la fecha real.
  liga.fixture.forEach((p) => {
    const entrada = entradaDePartido(p, clubUsuarioId, p.fecha, 'liga', liga.nombre, `Fecha ${p.fecha}`, clubes, 'liga');
    if (entrada) entradas.push(entrada);
  });

  // Copa Nacional — sólo bracket, se reparte cada ronda YA GENERADA (no
  // se puede saber la semana de una ronda que todavía no existe).
  if (copaNacional) {
    const semanas = semanasEscalonadas(copaNacional.rondas.length, 6, 9, maxSemana);
    copaNacional.rondas.forEach((ronda, i) => {
      entradas.push(...entradasDeLlaves(
        ronda.llaves, semanas[i], clubUsuarioId, 'copa-nacional', copaNacional.nombre, ronda.nombre, clubes, 'copa-nacional',
      ));
    });
  }

  // Copa Conmebol (Libertadores/Sudamericana) — fase de grupos primero
  // (fechas reales dentro del grupo, repartidas en la temporada), después
  // el playoff de acceso (sólo Sudamericana) y el bracket de knockout.
  if (copaConmebol) {
    const nombreCopa = copaConmebol.tipo === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana';
    const grupoUsuario = copaConmebol.grupos.find((g) => g.clubIds.includes(clubUsuarioId));
    let semanaSiguiente = 8;
    if (grupoUsuario) {
      const maxFechaGrupo = Math.max(1, ...grupoUsuario.fixture.map((p) => p.fecha));
      const semanasGrupo = semanasEscalonadas(maxFechaGrupo, 8, 4, maxSemana);
      grupoUsuario.fixture.forEach((p) => {
        const entrada = entradaDePartido(
          p, clubUsuarioId, semanasGrupo[p.fecha - 1], 'copa-conmebol', nombreCopa,
          `Fase de grupos — Fecha ${p.fecha}`, clubes, 'copa-conmebol',
        );
        if (entrada) entradas.push(entrada);
      });
      semanaSiguiente = (semanasGrupo[semanasGrupo.length - 1] ?? 8) + 4;
    }
    if (copaConmebol.playoffAcceso.length > 0) {
      entradas.push(...entradasDeLlaves(
        copaConmebol.playoffAcceso, semanaSiguiente, clubUsuarioId, 'copa-conmebol', nombreCopa,
        'Playoff de acceso', clubes, 'copa-conmebol',
      ));
      semanaSiguiente += 5;
    }
    const semanasBracket = semanasEscalonadas(copaConmebol.bracket.length, semanaSiguiente, 6, maxSemana);
    copaConmebol.bracket.forEach((ronda, i) => {
      entradas.push(...entradasDeLlaves(
        ronda.llaves, semanasBracket[i], clubUsuarioId, 'copa-conmebol', nombreCopa, ronda.nombre, clubes, 'copa-conmebol',
      ));
    });
  }

  // Copa Uefa (Champions/Europa/Conference, formato suizo) — mismo
  // criterio: fase de liga (fechas reales), playoff de acceso, bracket.
  if (copaUefa) {
    let semanaSiguiente = 8;
    const maxFechaFaseLiga = copaUefa.fixtureFaseLiga.length > 0 ? Math.max(...copaUefa.fixtureFaseLiga.map((p) => p.fecha)) : 0;
    if (maxFechaFaseLiga > 0) {
      const semanasFaseLiga = semanasEscalonadas(maxFechaFaseLiga, 8, 3, maxSemana);
      copaUefa.fixtureFaseLiga.forEach((p) => {
        const entrada = entradaDePartido(
          p, clubUsuarioId, semanasFaseLiga[p.fecha - 1], 'copa-uefa', copaUefa.nombre,
          `Fase de liga — Fecha ${p.fecha}`, clubes, 'copa-uefa',
        );
        if (entrada) entradas.push(entrada);
      });
      semanaSiguiente = (semanasFaseLiga[semanasFaseLiga.length - 1] ?? 8) + 4;
    }
    if (copaUefa.playoffAcceso.length > 0) {
      entradas.push(...entradasDeLlaves(
        copaUefa.playoffAcceso, semanaSiguiente, clubUsuarioId, 'copa-uefa', copaUefa.nombre,
        'Playoff de acceso', clubes, 'copa-uefa',
      ));
      semanaSiguiente += 5;
    }
    const semanasBracket = semanasEscalonadas(copaUefa.bracket.length, semanaSiguiente, 5, maxSemana);
    copaUefa.bracket.forEach((ronda, i) => {
      entradas.push(...entradasDeLlaves(
        ronda.llaves, semanasBracket[i], clubUsuarioId, 'copa-uefa', copaUefa.nombre, ronda.nombre, clubes, 'copa-uefa',
      ));
    });
  }

  // Copa Mundial de Clubes — grupos a una sola rueda, después bracket.
  if (copaMundialClubes) {
    const grupoUsuario = copaMundialClubes.grupos.find((g) => g.clubIds.includes(clubUsuarioId));
    let semanaSiguiente = 10;
    if (grupoUsuario) {
      const maxFechaGrupo = Math.max(1, ...grupoUsuario.fixture.map((p) => p.fecha));
      const semanasGrupo = semanasEscalonadas(maxFechaGrupo, 10, 6, maxSemana);
      grupoUsuario.fixture.forEach((p) => {
        const entrada = entradaDePartido(
          p, clubUsuarioId, semanasGrupo[p.fecha - 1], 'copa-mundial', 'Copa Mundial de Clubes',
          `Fase de grupos — Fecha ${p.fecha}`, clubes, 'copa',
        );
        if (entrada) entradas.push(entrada);
      });
      semanaSiguiente = (semanasGrupo[semanasGrupo.length - 1] ?? 10) + 7;
    }
    const semanasBracket = semanasEscalonadas(copaMundialClubes.bracket.length, semanaSiguiente, 7, maxSemana);
    copaMundialClubes.bracket.forEach((ronda, i) => {
      entradas.push(...entradasDeLlaves(
        ronda.llaves, semanasBracket[i], clubUsuarioId, 'copa-mundial', 'Copa Mundial de Clubes', ronda.nombre, clubes, 'copa',
      ));
    });
  }

  return entradas.sort((a, b) => a.semana - b.semana);
}
