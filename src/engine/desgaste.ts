// Lesiones (pedido explícito, versión simplificada: "el sistema de
// desgaste y rotación es muy complicado, hace mejor un sistema más arcade
// de que los jugadores se puedan lesionar al azar y listo"). Versión
// anterior tenía fatiga acumulada + grl "efectivo" + reconstrucción del XI
// distinta para IA vs. usuario — se sacó todo eso. Ahora es sólo: quien
// jugó una fecha tiene una chance chica de lesionarse por unas fechas: sin
// fatiga, sin penalización de rendimiento, sin dos caminos de rotación
// distintos.
//
// Probabilidad calibrada (a ojo, no hace falta más precisión para un
// sistema arcade) contra la incidencia real de lesiones en fútbol de
// élite (UEFA Elite Club Injury Study — uefa.com/pmc.ncbi.nlm.nih.gov): del
// orden de ~2 lesiones/temporada para un titular fijo, la gran mayoría
// (dos tercios/tres cuartos) lesiones musculares leves de pocos días, y
// sólo una franja chica lesiones graves de larga duración.
import type { Club, Jugador } from '../types';
import { randomEntero } from './random';

// "Disponible" cubre lesión Y suspensión (engine/tarjetas.ts) — mismo
// campo booleano para las dos causas de baja, así reemplazarLesionados
// (más abajo) saca del 11 a cualquiera de los dos sin tener que
// duplicar la lógica de reemplazo.
export function estaDisponible(jugador: Jugador): boolean {
  return (jugador.partidosLesionRestantes ?? 0) <= 0 && (jugador.partidosSuspensionRestantes ?? 0) <= 0;
}

export interface ResultadoLesion {
  huboLesion: boolean;
  partidosBaja: number;
  gravedad: 'leve' | 'moderada' | 'grave';
}

// ~4% de probabilidad por partido jugado de lesionarse. Distribución de
// gravedad: 70% leve (1-3 fechas afuera), 25% moderada (4-8), 5% grave
// (10-20) — la gran mayoría son golpes/contracturas cortas, no todas las
// lesiones tienen que arruinarte medio campeonato.
const PROB_LESION_POR_PARTIDO = 0.04;

export function evaluarLesion(): ResultadoLesion {
  if (Math.random() >= PROB_LESION_POR_PARTIDO) {
    return { huboLesion: false, partidosBaja: 0, gravedad: 'leve' };
  }
  const r = Math.random();
  if (r < 0.7) return { huboLesion: true, partidosBaja: randomEntero(1, 3), gravedad: 'leve' };
  if (r < 0.95) return { huboLesion: true, partidosBaja: randomEntero(4, 8), gravedad: 'moderada' };
  return { huboLesion: true, partidosBaja: randomEntero(10, 20), gravedad: 'grave' };
}

// -------------------- alineación --------------------

// Reemplaza SOLO los titulares lesionados por el mejor disponible del
// plantel en la misma posición (o, si no hay nadie sano en esa posición,
// el mejor disponible que quede) — el resto de la alineación no se toca.
// Se usa igual para el club del usuario (respeta lo que armaste en Armar
// Equipo) y para los clubes de la IA (que nunca "eligen" alineación a
// mano, así que esto es lo único que les actualiza el 11).
export function reemplazarLesionados(club: Club): Club {
  const jugadorPorId = new Map(club.plantel.map((j) => [j.id, j] as const));
  const lesionadosEnTitulares = club.titularesIds.filter((id) => {
    const j = jugadorPorId.get(id);
    return j != null && !estaDisponible(j);
  });
  if (lesionadosEnTitulares.length === 0) return club;

  const idsLesionados = new Set(lesionadosEnTitulares);
  const titularesSanos = club.titularesIds.filter((id) => !idsLesionados.has(id));
  const usados = new Set(titularesSanos);

  const nuevosTitulares = [...titularesSanos];
  lesionadosEnTitulares.forEach((idLesionado) => {
    const posicion = jugadorPorId.get(idLesionado)?.posicion;
    const candidatos = club.plantel
      .filter((j) => estaDisponible(j) && !usados.has(j.id))
      .sort((a, b) => {
        const prioridadA = a.posicion === posicion ? 1 : 0;
        const prioridadB = b.posicion === posicion ? 1 : 0;
        if (prioridadA !== prioridadB) return prioridadB - prioridadA;
        return b.grl - a.grl;
      });
    const reemplazo = candidatos[0];
    if (reemplazo) {
      nuevosTitulares.push(reemplazo.id);
      usados.add(reemplazo.id);
    }
  });

  const suplentesIds = club.plantel
    .filter((j) => estaDisponible(j) && !usados.has(j.id))
    .sort((a, b) => b.grl - a.grl)
    .slice(0, 5)
    .map((j) => j.id);

  return { ...club, titularesIds: nuevosTitulares, suplentesIds };
}

// Antes de simular una fecha: a TODOS los clubes se les reemplazan sólo
// los titulares lesionados (mismo criterio para IA y usuario — ver
// reemplazarLesionados). clubUsuarioId ya no cambia nada acá, se deja el
// parámetro para no tener que tocar los call-sites del store.
export function aplicarRotacionPreFecha(clubes: Record<string, Club>, _clubUsuarioId: string): Record<string, Club> {
  const resultado: Record<string, Club> = {};
  Object.values(clubes).forEach((club) => {
    resultado[club.id] = reemplazarLesionados(club);
  });
  return resultado;
}

export interface LesionOcurrida {
  jugadorId: string;
  nombre: string;
  clubId: string;
  partidosBaja: number;
  gravedad: 'leve' | 'moderada' | 'grave';
}

// Después de simular una fecha: a quien jugó (era titular) se le tira el
// dado de lesión; quien ya estaba lesionado cuenta un partido menos de
// baja. Devuelve también la lista de lesiones nuevas para que el store se
// la pueda mostrar al usuario.
export function aplicarDesgastePostFecha(
  clubes: Record<string, Club>,
  partidosJugados: { localId: string; visitanteId: string }[],
): { clubes: Record<string, Club>; lesiones: LesionOcurrida[] } {
  const idsQueJugaron = new Set<string>();
  partidosJugados.forEach((p) => {
    idsQueJugaron.add(p.localId);
    idsQueJugaron.add(p.visitanteId);
  });

  const lesiones: LesionOcurrida[] = [];
  const resultado: Record<string, Club> = {};

  Object.values(clubes).forEach((club) => {
    if (!idsQueJugaron.has(club.id)) {
      resultado[club.id] = club;
      return;
    }
    const titularesSet = new Set(club.titularesIds);
    const plantel = club.plantel.map((j) => {
      const restantes = j.partidosLesionRestantes ?? 0;
      if (restantes > 0) {
        return { ...j, partidosLesionRestantes: restantes - 1 };
      }
      if (!titularesSet.has(j.id)) return j; // sólo puede lesionarse quien jugó
      const lesion = evaluarLesion();
      if (!lesion.huboLesion) return j;
      lesiones.push({
        jugadorId: j.id, nombre: j.nombre, clubId: club.id, partidosBaja: lesion.partidosBaja, gravedad: lesion.gravedad,
      });
      return { ...j, partidosLesionRestantes: lesion.partidosBaja };
    });
    resultado[club.id] = { ...club, plantel };
  });

  return { clubes: resultado, lesiones };
}
