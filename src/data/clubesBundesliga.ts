// Clubes reales de Bundesliga para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/bundesliga/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_BUNDESLIGA = '/assets/escudos/bundesliga/';

export const CLUBES_BUNDESLIGA: ClubBase[] = [
  { id: 'bundesliga-bayern-munchen', nombre: 'Bayern München', nc: 84, archivo: 'bayern-munchen.png' },
  { id: 'bundesliga-borussia-dortmund', nombre: 'Borussia Dortmund', nc: 81, archivo: 'borussia-dortmund.png' },
  { id: 'bundesliga-bayer-04-leverkusen', nombre: 'Bayer 04 Leverkusen', nc: 79, archivo: 'bayer-04-leverkusen.png' },
  { id: 'bundesliga-rb-leipzig', nombre: 'RB Leipzig', nc: 79, archivo: 'rb-leipzig.png' },
  { id: 'bundesliga-vfb-stuttgart', nombre: 'VfB Stuttgart', nc: 77, archivo: 'vfb-stuttgart.png' },
  { id: 'bundesliga-eintracht-frankfurt', nombre: 'Eintracht Frankfurt', nc: 77, archivo: 'eintracht-frankfurt.png' },
  { id: 'bundesliga-tsg-1899-hoffenheim', nombre: 'TSG 1899 Hoffenheim', nc: 77, archivo: 'tsg-1899-hoffenheim.png' },
  { id: 'bundesliga-vfl-wolfsburg', nombre: 'VfL Wolfsburg', nc: 76, archivo: 'vfl-wolfsburg.svg' },
  { id: 'bundesliga-borussia-m-gladbach', nombre: 'Borussia M\'gladbach', nc: 75, archivo: 'borussia-m-gladbach.png' },
  { id: 'bundesliga-sc-freiburg', nombre: 'SC Freiburg', nc: 75, archivo: 'sc-freiburg.png' },
  { id: 'bundesliga-werder-bremen', nombre: 'Werder Bremen', nc: 75, archivo: 'werder-bremen.png' },
  { id: 'bundesliga-1-fsv-mainz-05', nombre: '1. FSV Mainz 05', nc: 75, archivo: '1-fsv-mainz-05.png' },
  { id: 'bundesliga-hamburger-sv', nombre: 'Hamburger SV', nc: 74, archivo: 'hamburger-sv.png' },
  { id: 'bundesliga-1-fc-koln', nombre: '1. FC Köln', nc: 74, archivo: '1-fc-koln.png' },
  { id: 'bundesliga-1-fc-union-berlin', nombre: '1. FC Union Berlin', nc: 74, archivo: '1-fc-union-berlin.png' },
  { id: 'bundesliga-fc-augsburg', nombre: 'FC Augsburg', nc: 74, archivo: 'fc-augsburg.png' },
  { id: 'bundesliga-fc-st-pauli', nombre: 'FC St. Pauli', nc: 72, archivo: 'fc-st-pauli.svg' },
  { id: 'bundesliga-1-fc-heidenheim', nombre: '1. FC Heidenheim', nc: 72, archivo: '1-fc-heidenheim.svg' },
];
