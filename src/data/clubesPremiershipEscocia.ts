// Clubes reales de Premiership (Escocia) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/premiership-escocia/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PREMIERSHIP_ESCOCIA = '/assets/escudos/premiership-escocia/';

export const CLUBES_PREMIERSHIP_ESCOCIA: ClubBase[] = [
  { id: 'escocia-celtic', nombre: 'Celtic', pais: 'Escocia', nc: 75, archivo: 'celtic.png' },
  { id: 'escocia-rangers', nombre: 'Rangers', pais: 'Escocia', nc: 74, archivo: 'rangers.png' },
  { id: 'escocia-heart-of-midlothian', nombre: 'Heart of Midlothian', pais: 'Escocia', nc: 71, archivo: 'heart-of-midlothian.png' },
  { id: 'escocia-aberdeen', nombre: 'Aberdeen', pais: 'Escocia', nc: 68, archivo: 'aberdeen.png' },
  { id: 'escocia-hibernian', nombre: 'Hibernian', pais: 'Escocia', nc: 68, archivo: 'hibernian.png' },
  { id: 'escocia-motherwell', nombre: 'Motherwell', pais: 'Escocia', nc: 66, archivo: 'motherwell.png' },
  { id: 'escocia-kilmarnock', nombre: 'Kilmarnock', pais: 'Escocia', nc: 65, archivo: 'kilmarnock.png' },
  { id: 'escocia-dundee-united', nombre: 'Dundee United', pais: 'Escocia', nc: 65, archivo: 'dundee-united.png' },
  { id: 'escocia-dundee-fc', nombre: 'Dundee FC', pais: 'Escocia', nc: 64, archivo: 'dundee-fc.png' },
  { id: 'escocia-livingston', nombre: 'Livingston', pais: 'Escocia', nc: 64, archivo: 'livingston.svg' },
  { id: 'escocia-st-mirren', nombre: 'St. Mirren', pais: 'Escocia', nc: 64, archivo: 'st-mirren.png' },
  { id: 'escocia-falkirk', nombre: 'Falkirk', pais: 'Escocia', nc: 63, archivo: 'falkirk.png' },
];
