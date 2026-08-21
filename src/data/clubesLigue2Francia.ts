// Clubes reales de Ligue 2 (Francia, 2ª división) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/ligue-2-francia/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_LIGUE_2_FRANCIA = '/assets/escudos/ligue-2-francia/';

export const CLUBES_LIGUE_2_FRANCIA: ClubBase[] = [
  { id: 'ligue2-as-saint-etienne', nombre: 'AS Saint-Étienne', pais: 'Francia', nc: 70, archivo: 'as-saint-etienne.svg' },
  { id: 'ligue2-stade-de-reims', nombre: 'Stade de Reims', pais: 'Francia', nc: 69, archivo: 'stade-de-reims.svg' },
  { id: 'ligue2-montpellier-hsc', nombre: 'Montpellier HSC', pais: 'Francia', nc: 68, archivo: 'montpellier-hsc.svg' },
  { id: 'ligue2-en-avant-guingamp', nombre: 'En Avant Guingamp', pais: 'Francia', nc: 67, archivo: 'en-avant-guingamp.svg' },
  { id: 'ligue2-estac-troyes', nombre: 'ESTAC Troyes', pais: 'Francia', nc: 67, archivo: 'estac-troyes.svg' },
  { id: 'ligue2-amiens-sc', nombre: 'Amiens SC', pais: 'Francia', nc: 67, archivo: 'amiens-sc.svg' },
  { id: 'ligue2-red-star-fc', nombre: 'Red Star FC', pais: 'Francia', nc: 67, archivo: 'red-star-fc.svg' },
  { id: 'ligue2-usl-dunkerque', nombre: 'USL Dunkerque', pais: 'Francia', nc: 67, archivo: 'usl-dunkerque.svg' },
  { id: 'ligue2-sc-bastia', nombre: 'SC Bastia', pais: 'Francia', nc: 66, archivo: 'sc-bastia.svg' },
  { id: 'ligue2-grenoble-foot-38', nombre: 'Grenoble Foot 38', pais: 'Francia', nc: 66, archivo: 'grenoble-foot-38.svg' },
  { id: 'ligue2-stade-lavallois-mfc', nombre: 'Stade Lavallois MFC', pais: 'Francia', nc: 66, archivo: 'stade-lavallois-mfc.svg' },
  { id: 'ligue2-clermont-foot', nombre: 'Clermont Foot', pais: 'Francia', nc: 66, archivo: 'clermont-foot.svg' },
  { id: 'ligue2-fc-annecy', nombre: 'FC Annecy', pais: 'Francia', nc: 66, archivo: 'fc-annecy.svg' },
  { id: 'ligue2-le-mans-fc', nombre: 'Le Mans FC', pais: 'Francia', nc: 65, archivo: 'le-mans-fc.svg' },
  { id: 'ligue2-as-nancy', nombre: 'AS Nancy', pais: 'Francia', nc: 65, archivo: 'as-nancy.svg' },
  { id: 'ligue2-pau-fc', nombre: 'Pau FC', pais: 'Francia', nc: 65, archivo: 'pau-fc.svg' },
  { id: 'ligue2-rodez-aveyron-football', nombre: 'Rodez Aveyron Football', pais: 'Francia', nc: 64, archivo: 'rodez-aveyron-football.svg' },
  { id: 'ligue2-us-boulogne', nombre: 'US Boulogne', pais: 'Francia', nc: 64, archivo: 'us-boulogne.svg' },
];
