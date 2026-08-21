// Clubes reales de Serie B (Italia, 2ª división) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/serie-b-italia/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_SERIE_B_ITALIA = '/assets/escudos/serie-b-italia/';

export const CLUBES_SERIE_B_ITALIA: ClubBase[] = [
  { id: 'serieb-palermo', nombre: 'Palermo', pais: 'Italia', nc: 72, archivo: 'palermo.svg' },
  { id: 'serieb-monza', nombre: 'Monza', pais: 'Italia', nc: 72, archivo: 'monza.svg' },
  { id: 'serieb-venezia', nombre: 'Venezia', pais: 'Italia', nc: 71, archivo: 'venezia.svg' },
  { id: 'serieb-sampdoria', nombre: 'Sampdoria', pais: 'Italia', nc: 70, archivo: 'sampdoria.svg' },
  { id: 'serieb-modena', nombre: 'Modena', pais: 'Italia', nc: 69, archivo: 'modena.svg' },
  { id: 'serieb-empoli', nombre: 'Empoli', pais: 'Italia', nc: 69, archivo: 'empoli.svg' },
  { id: 'serieb-pescara', nombre: 'Pescara', pais: 'Italia', nc: 68, archivo: 'pescara.svg' },
  { id: 'serieb-bari', nombre: 'Bari', pais: 'Italia', nc: 68, archivo: 'bari.svg' },
  { id: 'serieb-avellino', nombre: 'Avellino', pais: 'Italia', nc: 68, archivo: 'avellino.svg' },
  { id: 'serieb-catanzaro', nombre: 'Catanzaro', pais: 'Italia', nc: 68, archivo: 'catanzaro.svg' },
  { id: 'serieb-padova', nombre: 'Padova', pais: 'Italia', nc: 68, archivo: 'padova.svg' },
  { id: 'serieb-cesena', nombre: 'Cesena', pais: 'Italia', nc: 68, archivo: 'cesena.svg' },
  { id: 'serieb-frosinone', nombre: 'Frosinone', pais: 'Italia', nc: 68, archivo: 'frosinone.svg' },
  { id: 'serieb-carrarese', nombre: 'Carrarese', pais: 'Italia', nc: 68, archivo: 'carrarese.svg' },
  { id: 'serieb-sudtirol', nombre: 'Südtirol', pais: 'Italia', nc: 68, archivo: 'sudtirol.svg' },
  { id: 'serieb-spezia', nombre: 'Spezia', pais: 'Italia', nc: 68, archivo: 'spezia.svg' },
  { id: 'serieb-reggiana', nombre: 'Reggiana', pais: 'Italia', nc: 67, archivo: 'reggiana.svg' },
  { id: 'serieb-mantova', nombre: 'Mantova', pais: 'Italia', nc: 67, archivo: 'mantova.svg' },
  { id: 'serieb-juve-stabia', nombre: 'Juve Stabia', pais: 'Italia', nc: 67, archivo: 'juve-stabia.svg' },
  { id: 'serieb-entella', nombre: 'Entella', pais: 'Italia', nc: 67, archivo: 'entella.svg' },
];
