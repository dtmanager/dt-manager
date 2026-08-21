// Clubes reales de Pro League (Bélgica) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/pro-league-belgica/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PRO_LEAGUE_BELGICA = '/assets/escudos/pro-league-belgica/';

export const CLUBES_PRO_LEAGUE_BELGICA: ClubBase[] = [
  { id: 'belgica-club-brugge', nombre: 'Club Brugge', pais: 'Belgica', nc: 74, archivo: 'club-brugge.png' },
  { id: 'belgica-union-saint-gilloise', nombre: 'Union Saint-Gilloise', pais: 'Belgica', nc: 74, archivo: 'union-saint-gilloise.png' },
  { id: 'belgica-genk', nombre: 'Genk', pais: 'Belgica', nc: 73, archivo: 'genk.png' },
  { id: 'belgica-anderlecht', nombre: 'Anderlecht', pais: 'Belgica', nc: 72, archivo: 'anderlecht.png' },
  { id: 'belgica-antwerp', nombre: 'Antwerp', pais: 'Belgica', nc: 70, archivo: 'antwerp.png' },
  { id: 'belgica-standard-liege', nombre: 'Standard Liège', pais: 'Belgica', nc: 70, archivo: 'standard-liege.png' },
  { id: 'belgica-gent', nombre: 'Gent', pais: 'Belgica', nc: 70, archivo: 'gent.png' },
  { id: 'belgica-charleroi', nombre: 'Charleroi', pais: 'Belgica', nc: 69, archivo: 'charleroi.png' },
  { id: 'belgica-sint-truiden', nombre: 'Sint-Truiden', pais: 'Belgica', nc: 69, archivo: 'sint-truiden.png' },
  { id: 'belgica-oh-leuven', nombre: 'OH Leuven', pais: 'Belgica', nc: 69, archivo: 'oh-leuven.png' },
  { id: 'belgica-kv-mechelen', nombre: 'KV Mechelen', pais: 'Belgica', nc: 69, archivo: 'kv-mechelen.png' },
  { id: 'belgica-dender', nombre: 'Dender', pais: 'Belgica', nc: 68, archivo: 'dender.svg' },
  { id: 'belgica-westerlo', nombre: 'Westerlo', pais: 'Belgica', nc: 68, archivo: 'westerlo.png' },
  { id: 'belgica-zulte-waregem', nombre: 'Zulte Waregem', pais: 'Belgica', nc: 68, archivo: 'zulte-waregem.png' },
  { id: 'belgica-cercle-brugge', nombre: 'Cercle Brugge', pais: 'Belgica', nc: 67, archivo: 'cercle-brugge.png' },
  { id: 'belgica-raal-la-louviere', nombre: 'RAAL La Louvière', pais: 'Belgica', nc: 67, archivo: 'raal-la-louviere.png' },
];
