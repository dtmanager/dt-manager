// Scouting simple (pedido explícito, mecánica 3 de
// docs/que-le-falta-profundidad.md): "un botón 'Buscar refuerzo' con 2-3
// filtros que dispare una búsqueda... y devuelva 2-3 candidatos reales que
// cumplan el filtro — construido sobre los mismos datos que ya existen, sin
// generar jugadores nuevos, sólo filtrar mejor lo que ya hay". A propósito
// NO exige `transferible === true`: eso convertiría esto en una copia de
// PestanaCompras con más pasos — la idea del documento es reemplazar
// "esperar a ver qué apareció listado" por una búsqueda activa sobre TODO
// el mercado real (liga + clubes extranjeros, ya mezclados en `clubes` por
// el store). `ofertarPorJugador` (useGameStore.ts) tampoco exige
// transferible, así que un candidato encontrado acá ya se puede negociar
// directo con el mismo componente que usa PestanaCompras.
import type { Club, Jugador, Posicion } from '../types';

export interface FiltroScouting {
  posicion: Posicion | 'TODOS';
  edadMax: number;
  presupuestoMax: number;
}

export interface CandidatoScouting {
  jugador: Jugador;
  clubId: string;
  clubNombre: string;
}

export const CANDIDATOS_SCOUTING = 3;

// Mejor GRL primero — con potencialmente cientos de jugadores cumpliendo
// un filtro amplio (ej. "cualquier DEL menor a 30"), devolver sólo los
// mejores 2-3 es lo que el documento pide explícitamente ("2-3
// candidatos"), no una lista completa para filtrar a mano de nuevo.
export function buscarRefuerzos(
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  filtro: FiltroScouting,
): CandidatoScouting[] {
  const candidatos: CandidatoScouting[] = [];
  Object.values(clubes).forEach((club) => {
    if (club.id === clubUsuarioId) return;
    club.plantel.forEach((jugador) => {
      if (filtro.posicion !== 'TODOS' && jugador.posicion !== filtro.posicion) return;
      if (jugador.edad > filtro.edadMax) return;
      if (jugador.valorMercado > filtro.presupuestoMax) return;
      candidatos.push({ jugador, clubId: club.id, clubNombre: club.nombre });
    });
  });
  return candidatos
    .sort((a, b) => b.jugador.grl - a.jugador.grl)
    .slice(0, CANDIDATOS_SCOUTING);
}
