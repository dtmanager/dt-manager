// Clubes reales de Premier League para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/premier-league/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PREMIER_LEAGUE = '/assets/escudos/premier-league/';

export const CLUBES_PREMIER_LEAGUE: ClubBase[] = [
  { id: 'pl-arsenal', nombre: 'Arsenal', nc: 84, archivo: 'arsenal.png' },
  { id: 'pl-liverpool', nombre: 'Liverpool', nc: 84, archivo: 'liverpool.png' },
  { id: 'pl-manchester-city', nombre: 'Manchester City', nc: 84, archivo: 'manchester-city.png' },
  { id: 'pl-aston-villa', nombre: 'Aston Villa', nc: 81, archivo: 'aston-villa.png' },
  { id: 'pl-chelsea', nombre: 'Chelsea', nc: 81, archivo: 'chelsea.png' },
  { id: 'pl-newcastle-united', nombre: 'Newcastle United', nc: 81, archivo: 'newcastle-united.png' },
  { id: 'pl-manchester-united', nombre: 'Manchester United', nc: 80, archivo: 'manchester-united.png' },
  { id: 'pl-tottenham-hotspur', nombre: 'Tottenham Hotspur', nc: 80, archivo: 'tottenham-hotspur.png' },
  { id: 'pl-nottingham-forest', nombre: 'Nottingham Forest', nc: 79, archivo: 'nottingham-forest.png' },
  { id: 'pl-crystal-palace', nombre: 'Crystal Palace', nc: 79, archivo: 'crystal-palace.png' },
  { id: 'pl-everton', nombre: 'Everton', nc: 78, archivo: 'everton.png' },
  { id: 'pl-fulham', nombre: 'Fulham', nc: 78, archivo: 'fulham.png' },
  { id: 'pl-brighton-hove-albion', nombre: 'Brighton & Hove Albion', nc: 78, archivo: 'brighton-hove-albion.png' },
  { id: 'pl-brentford', nombre: 'Brentford', nc: 78, archivo: 'brentford.png' },
  { id: 'pl-afc-bournemouth', nombre: 'AFC Bournemouth', nc: 78, archivo: 'afc-bournemouth.png' },
  { id: 'pl-west-ham-united', nombre: 'West Ham United', nc: 77, archivo: 'west-ham-united.svg' },
  { id: 'pl-sunderland', nombre: 'Sunderland', nc: 77, archivo: 'sunderland.png' },
  { id: 'pl-leeds-united', nombre: 'Leeds United', nc: 76, archivo: 'leeds-united.png' },
  { id: 'pl-wolverhampton-wanderers', nombre: 'Wolverhampton Wanderers', nc: 75, archivo: 'wolverhampton-wanderers.svg' },
  { id: 'pl-burnley', nombre: 'Burnley', nc: 75, archivo: 'burnley.svg' },
];
