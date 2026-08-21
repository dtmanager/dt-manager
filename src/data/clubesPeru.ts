// Clubes reales de Liga 1 de Perú para el modo carrera. Los `nc` de Alianza
// Lima/Universitario de Deportes/Sporting Cristal/Melgar FBC/Cienciano/Club
// Atlético Grau reusan el valor ya cargado en clubesOtrosConmebol.ts (misma
// planilla de referencia FIFA/EA FC) — el resto de los clubes no estaba en
// ese pool y se marca `estimado: true` (estimación razonada, no dato de
// FIFA Index). `archivo` apunta a public/assets/escudos/peru/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que
// indica cada `archivo`; el <img> del menú simplemente no se ve hasta
// entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PERU = '/assets/escudos/peru/';

export const CLUBES_PERU: ClubBase[] = [
  { id: 'peru-alianza-lima', nombre: 'Alianza Lima', pais: 'Perú', nc: 70, archivo: 'alianza-lima.png' },
  { id: 'peru-universitario-de-deportes', nombre: 'Universitario de Deportes', pais: 'Perú', nc: 70, archivo: 'universitario-de-deportes.png' },
  { id: 'peru-sporting-cristal', nombre: 'Sporting Cristal', pais: 'Perú', nc: 69, archivo: 'sporting-cristal.png' },
  { id: 'peru-melgar-fbc', nombre: 'Melgar FBC', pais: 'Perú', nc: 68, archivo: 'melgar-fbc.png' },
  { id: 'peru-cusco-fc', nombre: 'Cusco FC', pais: 'Perú', nc: 63, archivo: 'cusco-fc.png', estimado: true },
  { id: 'peru-cienciano', nombre: 'Cienciano', pais: 'Perú', nc: 66, archivo: 'cienciano.png' },
  { id: 'peru-club-atletico-grau', nombre: 'Club Atlético Grau', pais: 'Perú', nc: 66, archivo: 'club-atletico-grau.png' },
  { id: 'peru-deportivo-municipal', nombre: 'Deportivo Municipal', pais: 'Perú', nc: 62, archivo: 'deportivo-municipal.svg', estimado: true },
  { id: 'peru-sport-huancayo', nombre: 'Sport Huancayo', pais: 'Perú', nc: 61, archivo: 'sport-huancayo.png', estimado: true },
  { id: 'peru-adt', nombre: 'ADT', pais: 'Perú', nc: 61, archivo: 'adt.png', estimado: true },
  { id: 'peru-alianza-atletico', nombre: 'Alianza Atlético', pais: 'Perú', nc: 60, archivo: 'alianza-atletico.png', estimado: true },
  { id: 'peru-utc-cajamarca', nombre: 'UTC Cajamarca', pais: 'Perú', nc: 60, archivo: 'utc-cajamarca.png', estimado: true },
  { id: 'peru-comerciantes-unidos', nombre: 'Comerciantes Unidos', pais: 'Perú', nc: 59, archivo: 'comerciantes-unidos.png', estimado: true },
  { id: 'peru-los-chankas', nombre: 'Los Chankas', pais: 'Perú', nc: 58, archivo: 'los-chankas.png', estimado: true },
];
