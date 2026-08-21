// Clubes reales de Eredivisie (Países Bajos) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/eredivisie/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_EREDIVISIE = '/assets/escudos/eredivisie/';

export const CLUBES_EREDIVISIE: ClubBase[] = [
  { id: 'eredivisie-psv', nombre: 'PSV', pais: 'Paises Bajos', nc: 77, archivo: 'psv.png' },
  { id: 'eredivisie-ajax', nombre: 'Ajax', pais: 'Paises Bajos', nc: 75, archivo: 'ajax.png' },
  { id: 'eredivisie-feyenoord', nombre: 'Feyenoord', pais: 'Paises Bajos', nc: 75, archivo: 'feyenoord.png' },
  { id: 'eredivisie-az', nombre: 'AZ', pais: 'Paises Bajos', nc: 73, archivo: 'az.png' },
  { id: 'eredivisie-fc-utrecht', nombre: 'FC Utrecht', pais: 'Paises Bajos', nc: 72, archivo: 'fc-utrecht.png' },
  { id: 'eredivisie-n-e-c-nijmegen', nombre: 'N.E.C. Nijmegen', pais: 'Paises Bajos', nc: 72, archivo: 'n-e-c-nijmegen.png' },
  { id: 'eredivisie-fc-twente', nombre: 'FC Twente', pais: 'Paises Bajos', nc: 71, archivo: 'fc-twente.png' },
  { id: 'eredivisie-go-ahead-eagles', nombre: 'Go Ahead Eagles', pais: 'Paises Bajos', nc: 69, archivo: 'go-ahead-eagles.png' },
  { id: 'eredivisie-fortuna-sittard', nombre: 'Fortuna Sittard', pais: 'Paises Bajos', nc: 68, archivo: 'fortuna-sittard.png' },
  { id: 'eredivisie-sc-heerenveen', nombre: 'sc Heerenveen', pais: 'Paises Bajos', nc: 68, archivo: 'sc-heerenveen.png' },
  { id: 'eredivisie-sparta-rotterdam', nombre: 'Sparta Rotterdam', pais: 'Paises Bajos', nc: 68, archivo: 'sparta-rotterdam.png' },
  { id: 'eredivisie-nac-breda', nombre: 'NAC Breda', pais: 'Paises Bajos', nc: 67, archivo: 'nac-breda.svg' },
  { id: 'eredivisie-pec-zwolle', nombre: 'PEC Zwolle', pais: 'Paises Bajos', nc: 67, archivo: 'pec-zwolle.png' },
  { id: 'eredivisie-fc-groningen', nombre: 'FC Groningen', pais: 'Paises Bajos', nc: 67, archivo: 'fc-groningen.png' },
  { id: 'eredivisie-heracles-almelo', nombre: 'Heracles Almelo', pais: 'Paises Bajos', nc: 67, archivo: 'heracles-almelo.svg' },
  { id: 'eredivisie-fc-volendam', nombre: 'FC Volendam', pais: 'Paises Bajos', nc: 66, archivo: 'fc-volendam.svg' },
  { id: 'eredivisie-excelsior', nombre: 'Excelsior', pais: 'Paises Bajos', nc: 66, archivo: 'excelsior.png' },
  { id: 'eredivisie-telstar', nombre: 'Telstar', pais: 'Paises Bajos', nc: 66, archivo: 'telstar.png' },
];
