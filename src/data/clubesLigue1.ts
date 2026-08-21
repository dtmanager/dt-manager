// Clubes reales de Ligue 1 para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/ligue-1/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_LIGUE_1 = '/assets/escudos/ligue-1/';

export const CLUBES_LIGUE_1: ClubBase[] = [
  { id: 'ligue1-paris-saint-germain', nombre: 'Paris Saint-Germain', nc: 85, archivo: 'paris-saint-germain.png' },
  { id: 'ligue1-olympique-de-marseille', nombre: 'Olympique de Marseille', nc: 79, archivo: 'olympique-de-marseille.png' },
  { id: 'ligue1-as-monaco', nombre: 'AS Monaco', nc: 78, archivo: 'as-monaco.png' },
  { id: 'ligue1-rc-lens', nombre: 'RC Lens', nc: 77, archivo: 'rc-lens.png' },
  { id: 'ligue1-losc-lille', nombre: 'LOSC Lille', nc: 77, archivo: 'losc-lille.png' },
  { id: 'ligue1-olympique-lyonnais', nombre: 'Olympique Lyonnais', nc: 77, archivo: 'olympique-lyonnais.png' },
  { id: 'ligue1-stade-rennais', nombre: 'Stade Rennais', nc: 76, archivo: 'stade-rennais.png' },
  { id: 'ligue1-ogc-nice', nombre: 'OGC Nice', nc: 75, archivo: 'ogc-nice.png' },
  { id: 'ligue1-rc-strasbourg', nombre: 'RC Strasbourg', nc: 75, archivo: 'rc-strasbourg.png' },
  { id: 'ligue1-paris-fc', nombre: 'Paris FC', nc: 75, archivo: 'paris-fc.png' },
  { id: 'ligue1-stade-brestois-29', nombre: 'Stade Brestois 29', nc: 74, archivo: 'stade-brestois-29.png' },
  { id: 'ligue1-fc-lorient', nombre: 'FC Lorient', nc: 73, archivo: 'fc-lorient.png' },
  { id: 'ligue1-toulouse-fc', nombre: 'Toulouse FC', nc: 73, archivo: 'toulouse-fc.png' },
  { id: 'ligue1-aj-auxerre', nombre: 'AJ Auxerre', nc: 72, archivo: 'aj-auxerre.png' },
  { id: 'ligue1-fc-nantes', nombre: 'FC Nantes', nc: 72, archivo: 'fc-nantes.svg' },
  { id: 'ligue1-angers-sco', nombre: 'Angers SCO', nc: 72, archivo: 'angers-sco.png' },
  { id: 'ligue1-le-havre-ac', nombre: 'Le Havre AC', nc: 72, archivo: 'le-havre-ac.png' },
  { id: 'ligue1-fc-metz', nombre: 'FC Metz', nc: 71, archivo: 'fc-metz.svg' },
];
