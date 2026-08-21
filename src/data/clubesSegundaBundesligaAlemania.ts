// Clubes reales de 2. Bundesliga (Alemania, 2ª división) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/segunda-bundesliga-alemania/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_SEGUNDA_BUNDESLIGA_ALEMANIA = '/assets/escudos/segunda-bundesliga-alemania/';

export const CLUBES_SEGUNDA_BUNDESLIGA_ALEMANIA: ClubBase[] = [
  { id: 'bundesliga2-fc-schalke-04', nombre: 'FC Schalke 04', pais: 'Alemania', nc: 71, archivo: 'fc-schalke-04.svg' },
  { id: 'bundesliga2-hertha-bsc', nombre: 'Hertha BSC', pais: 'Alemania', nc: 70, archivo: 'hertha-bsc.svg' },
  { id: 'bundesliga2-hannover-96', nombre: 'Hannover 96', pais: 'Alemania', nc: 70, archivo: 'hannover-96.svg' },
  { id: 'bundesliga2-sv-darmstadt-98', nombre: 'SV Darmstadt 98', pais: 'Alemania', nc: 70, archivo: 'sv-darmstadt-98.svg' },
  { id: 'bundesliga2-1-fc-kaiserslautern', nombre: '1. FC Kaiserslautern', pais: 'Alemania', nc: 69, archivo: '1-fc-kaiserslautern.svg' },
  { id: 'bundesliga2-vfl-bochum', nombre: 'VfL Bochum', pais: 'Alemania', nc: 69, archivo: 'vfl-bochum.svg' },
  { id: 'bundesliga2-holstein-kiel', nombre: 'Holstein Kiel', pais: 'Alemania', nc: 69, archivo: 'holstein-kiel.svg' },
  { id: 'bundesliga2-karlsruher-sc', nombre: 'Karlsruher SC', pais: 'Alemania', nc: 69, archivo: 'karlsruher-sc.svg' },
  { id: 'bundesliga2-fortuna-dusseldorf', nombre: 'Fortuna Düsseldorf', pais: 'Alemania', nc: 69, archivo: 'fortuna-dusseldorf.svg' },
  { id: 'bundesliga2-arminia-bielefeld', nombre: 'Arminia Bielefeld', pais: 'Alemania', nc: 68, archivo: 'arminia-bielefeld.svg' },
  { id: 'bundesliga2-1-fc-nurnberg', nombre: '1. FC Nürnberg', pais: 'Alemania', nc: 68, archivo: '1-fc-nurnberg.svg' },
  { id: 'bundesliga2-sv-elversberg', nombre: 'SV Elversberg', pais: 'Alemania', nc: 68, archivo: 'sv-elversberg.svg' },
  { id: 'bundesliga2-sc-paderborn-07', nombre: 'SC Paderborn 07', pais: 'Alemania', nc: 68, archivo: 'sc-paderborn-07.svg' },
  { id: 'bundesliga2-1-fc-magdeburg', nombre: '1. FC Magdeburg', pais: 'Alemania', nc: 68, archivo: '1-fc-magdeburg.svg' },
  { id: 'bundesliga2-spvgg-greuther-furth', nombre: 'SpVgg Greuther Fürth', pais: 'Alemania', nc: 67, archivo: 'spvgg-greuther-furth.svg' },
  { id: 'bundesliga2-dynamo-dresden', nombre: 'Dynamo Dresden', pais: 'Alemania', nc: 67, archivo: 'dynamo-dresden.svg' },
  { id: 'bundesliga2-preuen-munster', nombre: 'Preußen Münster', pais: 'Alemania', nc: 67, archivo: 'preuen-munster.svg' },
  { id: 'bundesliga2-eintracht-braunschweig', nombre: 'Eintracht Braunschweig', pais: 'Alemania', nc: 67, archivo: 'eintracht-braunschweig.svg' },
];
