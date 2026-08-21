// Clubes reales de Championship (Inglaterra, 2ª división) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/championship-inglaterra/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_CHAMPIONSHIP_INGLATERRA = '/assets/escudos/championship-inglaterra/';

export const CLUBES_CHAMPIONSHIP_INGLATERRA: ClubBase[] = [
  { id: 'championship-coventry-city', nombre: 'Coventry City', pais: 'Inglaterra', nc: 73, archivo: 'coventry-city.svg' },
  { id: 'championship-ipswich-town', nombre: 'Ipswich Town', pais: 'Inglaterra', nc: 73, archivo: 'ipswich-town.svg' },
  { id: 'championship-middlesbrough', nombre: 'Middlesbrough', pais: 'Inglaterra', nc: 72, archivo: 'middlesbrough.svg' },
  { id: 'championship-southampton', nombre: 'Southampton', pais: 'Inglaterra', nc: 72, archivo: 'southampton.svg' },
  { id: 'championship-birmingham-city', nombre: 'Birmingham City', pais: 'Inglaterra', nc: 72, archivo: 'birmingham-city.svg' },
  { id: 'championship-swansea-city', nombre: 'Swansea City', pais: 'Inglaterra', nc: 71, archivo: 'swansea-city.svg' },
  { id: 'championship-hull-city', nombre: 'Hull City', pais: 'Inglaterra', nc: 71, archivo: 'hull-city.svg' },
  { id: 'championship-bristol-city', nombre: 'Bristol City', pais: 'Inglaterra', nc: 71, archivo: 'bristol-city.svg' },
  { id: 'championship-leicester-city', nombre: 'Leicester City', pais: 'Inglaterra', nc: 71, archivo: 'leicester-city.svg' },
  { id: 'championship-millwall', nombre: 'Millwall', pais: 'Inglaterra', nc: 71, archivo: 'millwall.svg' },
  { id: 'championship-sheffield-united', nombre: 'Sheffield United', pais: 'Inglaterra', nc: 71, archivo: 'sheffield-united.svg' },
  { id: 'championship-norwich-city', nombre: 'Norwich City', pais: 'Inglaterra', nc: 70, archivo: 'norwich-city.svg' },
  { id: 'championship-west-bromwich-albion', nombre: 'West Bromwich Albion', pais: 'Inglaterra', nc: 70, archivo: 'west-bromwich-albion.svg' },
  { id: 'championship-watford', nombre: 'Watford', pais: 'Inglaterra', nc: 70, archivo: 'watford.svg' },
  { id: 'championship-derby-county', nombre: 'Derby County', pais: 'Inglaterra', nc: 70, archivo: 'derby-county.svg' },
  { id: 'championship-preston-north-end', nombre: 'Preston North End', pais: 'Inglaterra', nc: 70, archivo: 'preston-north-end.svg' },
  { id: 'championship-stoke-city', nombre: 'Stoke City', pais: 'Inglaterra', nc: 70, archivo: 'stoke-city.svg' },
  { id: 'championship-wrexham', nombre: 'Wrexham', pais: 'Inglaterra', nc: 70, archivo: 'wrexham.svg' },
  { id: 'championship-queens-park-rangers', nombre: 'Queens Park Rangers', pais: 'Inglaterra', nc: 70, archivo: 'queens-park-rangers.svg' },
  { id: 'championship-portsmouth', nombre: 'Portsmouth', pais: 'Inglaterra', nc: 69, archivo: 'portsmouth.svg' },
  { id: 'championship-charlton-athletic', nombre: 'Charlton Athletic', pais: 'Inglaterra', nc: 69, archivo: 'charlton-athletic.svg' },
  { id: 'championship-oxford-united', nombre: 'Oxford United', pais: 'Inglaterra', nc: 69, archivo: 'oxford-united.svg' },
  { id: 'championship-blackburn-rovers', nombre: 'Blackburn Rovers', pais: 'Inglaterra', nc: 69, archivo: 'blackburn-rovers.svg' },
  { id: 'championship-sheffield-wednesday', nombre: 'Sheffield Wednesday', pais: 'Inglaterra', nc: 67, archivo: 'sheffield-wednesday.svg' },
];
