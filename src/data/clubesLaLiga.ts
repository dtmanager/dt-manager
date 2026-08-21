// Clubes reales de LaLiga para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/laliga/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_LALIGA = '/assets/escudos/laliga/';

export const CLUBES_LALIGA: ClubBase[] = [
  { id: 'laliga-fc-barcelona', nombre: 'FC Barcelona', nc: 85, archivo: 'fc-barcelona.png' },
  { id: 'laliga-real-madrid', nombre: 'Real Madrid', nc: 85, archivo: 'real-madrid.png' },
  { id: 'laliga-atletico-de-madrid', nombre: 'Atlético de Madrid', nc: 82, archivo: 'atletico-de-madrid.png' },
  { id: 'laliga-athletic-club-de-bilbao', nombre: 'Athletic Club de Bilbao', nc: 80, archivo: 'athletic-club-de-bilbao.png' },
  { id: 'laliga-real-betis-balompie', nombre: 'Real Betis Balompié', nc: 79, archivo: 'real-betis-balompie.png' },
  { id: 'laliga-villarreal-cf', nombre: 'Villarreal CF', nc: 79, archivo: 'villarreal-cf.png' },
  { id: 'laliga-real-sociedad', nombre: 'Real Sociedad', nc: 78, archivo: 'real-sociedad.png' },
  { id: 'laliga-ca-osasuna', nombre: 'CA Osasuna', nc: 77, archivo: 'ca-osasuna.png' },
  { id: 'laliga-rayo-vallecano', nombre: 'Rayo Vallecano', nc: 77, archivo: 'rayo-vallecano.png' },
  { id: 'laliga-girona-fc', nombre: 'Girona FC', nc: 77, archivo: 'girona-fc.svg' },
  { id: 'laliga-rc-celta-de-vigo', nombre: 'RC Celta de Vigo', nc: 76, archivo: 'rc-celta-de-vigo.png' },
  { id: 'laliga-rcd-mallorca', nombre: 'RCD Mallorca', nc: 76, archivo: 'rcd-mallorca.svg' },
  { id: 'laliga-valencia-cf', nombre: 'Valencia CF', nc: 76, archivo: 'valencia-cf.png' },
  { id: 'laliga-getafe-cf', nombre: 'Getafe CF', nc: 76, archivo: 'getafe-cf.png' },
  { id: 'laliga-rcd-espanyol', nombre: 'RCD Espanyol', nc: 75, archivo: 'rcd-espanyol.png' },
  { id: 'laliga-sevilla-fc', nombre: 'Sevilla FC', nc: 75, archivo: 'sevilla-fc.png' },
  { id: 'laliga-deportivo-alaves', nombre: 'Deportivo Alavés', nc: 74, archivo: 'deportivo-alaves.png' },
  { id: 'laliga-elche-cf', nombre: 'Elche CF', nc: 74, archivo: 'elche-cf.png' },
  { id: 'laliga-levante-ud', nombre: 'Levante UD', nc: 74, archivo: 'levante-ud.png' },
  { id: 'laliga-real-oviedo', nombre: 'Real Oviedo', nc: 73, archivo: 'real-oviedo.svg' },
];
