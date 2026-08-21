// Clubes reales de la Primera División de Chile para el modo carrera. Los
// `nc` de Universidad de Chile/Palestino/Deportes Iquique/Colo-Colo/Unión
// Española reusan el valor ya cargado en clubesOtrosConmebol.ts (misma
// planilla de referencia FIFA/EA FC) — el resto de los clubes no estaba en
// ese pool y se marca `estimado: true` (estimación razonada por nivel
// competitivo reciente, no dato de FIFA Index). `archivo` apunta a
// public/assets/escudos/chile/ (los escudos todavía no están bajados — hay
// que agregarlos ahí con el nombre que indica cada `archivo`; el <img> del
// menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_CHILE = '/assets/escudos/chile/';

export const CLUBES_CHILE: ClubBase[] = [
  { id: 'chile-universidad-de-chile', nombre: 'Universidad de Chile', pais: 'Chile', nc: 70, archivo: 'universidad-de-chile.png' },
  { id: 'chile-universidad-catolica', nombre: 'Universidad Católica', pais: 'Chile', nc: 69, archivo: 'universidad-catolica.png', estimado: true },
  { id: 'chile-palestino', nombre: 'Palestino', pais: 'Chile', nc: 67, archivo: 'palestino.png' },
  { id: 'chile-deportes-iquique', nombre: 'Deportes Iquique', pais: 'Chile', nc: 67, archivo: 'deportes-iquique.svg' },
  { id: 'chile-colo-colo', nombre: 'Colo-Colo', pais: 'Chile', nc: 66, archivo: 'colo-colo.png' },
  { id: 'chile-union-espanola', nombre: 'Unión Española', pais: 'Chile', nc: 65, archivo: 'union-espanola.svg' },
  { id: 'chile-ohiggins', nombre: "O'Higgins", pais: 'Chile', nc: 64, archivo: 'ohiggins.png', estimado: true },
  { id: 'chile-cobresal', nombre: 'Cobresal', pais: 'Chile', nc: 64, archivo: 'cobresal.png', estimado: true },
  { id: 'chile-huachipato', nombre: 'Huachipato', pais: 'Chile', nc: 63, archivo: 'huachipato.png', estimado: true },
  { id: 'chile-coquimbo-unido', nombre: 'Coquimbo Unido', pais: 'Chile', nc: 62, archivo: 'coquimbo-unido.png', estimado: true },
  { id: 'chile-everton-vina-del-mar', nombre: 'Everton de Viña del Mar', pais: 'Chile', nc: 62, archivo: 'everton-vina-del-mar.png', estimado: true },
  { id: 'chile-audax-italiano', nombre: 'Audax Italiano', pais: 'Chile', nc: 61, archivo: 'audax-italiano.png', estimado: true },
  { id: 'chile-nublense', nombre: 'Ñublense', pais: 'Chile', nc: 61, archivo: 'nublense.png', estimado: true },
  { id: 'chile-union-la-calera', nombre: 'Unión La Calera', pais: 'Chile', nc: 60, archivo: 'union-la-calera.png', estimado: true },
];
