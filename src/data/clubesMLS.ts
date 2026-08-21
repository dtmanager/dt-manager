// Clubes reales de MLS para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/mls/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_MLS = '/assets/escudos/mls/';

export const CLUBES_MLS: ClubBase[] = [
  { id: 'mls-inter-miami', nombre: 'Inter Miami', nc: 72, archivo: 'inter-miami.svg' },
  { id: 'mls-vancouver-whitecaps', nombre: 'Vancouver Whitecaps', nc: 71, archivo: 'vancouver-whitecaps.svg' },
  { id: 'mls-charlotte-fc', nombre: 'Charlotte FC', nc: 71, archivo: 'charlotte-fc.svg' },
  { id: 'mls-los-angeles-fc', nombre: 'Los Angeles FC', nc: 71, archivo: 'los-angeles-fc.svg' },
  { id: 'mls-columbus-crew', nombre: 'Columbus Crew', nc: 70, archivo: 'columbus-crew.svg' },
  { id: 'mls-los-angeles-galaxy', nombre: 'Los Angeles Galaxy', nc: 70, archivo: 'los-angeles-galaxy.svg' },
  { id: 'mls-houston-dynamo', nombre: 'Houston Dynamo', nc: 70, archivo: 'houston-dynamo.svg' },
  { id: 'mls-chicago-fire-fc', nombre: 'Chicago Fire FC', nc: 70, archivo: 'chicago-fire-fc.svg' },
  { id: 'mls-seattle-sounders', nombre: 'Seattle Sounders', nc: 70, archivo: 'seattle-sounders.svg' },
  { id: 'mls-atlanta-united-fc', nombre: 'Atlanta United FC', nc: 70, archivo: 'atlanta-united-fc.svg' },
  { id: 'mls-orlando-city-sc', nombre: 'Orlando City SC', nc: 69, archivo: 'orlando-city-sc.svg' },
  { id: 'mls-nashville-sc', nombre: 'Nashville SC', nc: 69, archivo: 'nashville-sc.svg' },
  { id: 'mls-austin-fc', nombre: 'Austin FC', nc: 69, archivo: 'austin-fc.svg' },
  { id: 'mls-real-salt-lake', nombre: 'Real Salt Lake', nc: 69, archivo: 'real-salt-lake.svg' },
  { id: 'mls-minnesota-united-fc', nombre: 'Minnesota United FC', nc: 69, archivo: 'minnesota-united-fc.svg' },
  { id: 'mls-fc-cincinnati', nombre: 'FC Cincinnati', nc: 69, archivo: 'fc-cincinnati.svg' },
  { id: 'mls-new-england-revolution', nombre: 'New England Revolution', nc: 69, archivo: 'new-england-revolution.svg' },
  { id: 'mls-toronto-fc', nombre: 'Toronto FC', nc: 69, archivo: 'toronto-fc.svg' },
  { id: 'mls-new-york-city-fc', nombre: 'New York City FC', nc: 69, archivo: 'new-york-city-fc.svg' },
  { id: 'mls-san-diego-fc', nombre: 'San Diego FC', nc: 68, archivo: 'san-diego-fc.svg' },
  { id: 'mls-colorado-rapids', nombre: 'Colorado Rapids', nc: 68, archivo: 'colorado-rapids.svg' },
  { id: 'mls-portland-timbers', nombre: 'Portland Timbers', nc: 68, archivo: 'portland-timbers.svg' },
  { id: 'mls-st-louis-city-sc', nombre: 'St. Louis City SC', nc: 68, archivo: 'st-louis-city-sc.svg' },
  { id: 'mls-philadelphia-union', nombre: 'Philadelphia Union', nc: 67, archivo: 'philadelphia-union.svg' },
  { id: 'mls-red-bull-new-york', nombre: 'Red Bull New York', nc: 67, archivo: 'red-bull-new-york.svg' },
  { id: 'mls-fc-dallas', nombre: 'FC Dallas', nc: 67, archivo: 'fc-dallas.svg' },
  { id: 'mls-d-c-united', nombre: 'D.C. United', nc: 67, archivo: 'd-c-united.svg' },
  { id: 'mls-san-jose-earthquakes', nombre: 'San Jose Earthquakes', nc: 67, archivo: 'san-jose-earthquakes.svg' },
  { id: 'mls-cf-montreal', nombre: 'CF Montréal', nc: 66, archivo: 'cf-montreal.svg' },
  { id: 'mls-sporting-kc', nombre: 'Sporting KC', nc: 65, archivo: 'sporting-kc.svg' },
];
