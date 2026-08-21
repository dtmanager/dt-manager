// Clubes reales de la Primera División de Uruguay para el modo carrera. Los
// `nc` de Peñarol/Nacional/Cerro Largo/Boston River/Racing Club de
// Montevideo reusan el valor ya cargado en clubesOtrosConmebol.ts (misma
// planilla de referencia FIFA/EA FC) — el resto de los clubes no estaba en
// ese pool y se marca `estimado: true` (estimación razonada, no dato de
// FIFA Index). `archivo` apunta a public/assets/escudos/uruguay/ (los
// escudos todavía no están bajados — hay que agregarlos ahí con el nombre
// que indica cada `archivo`; el <img> del menú simplemente no se ve hasta
// entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_URUGUAY = '/assets/escudos/uruguay/';

export const CLUBES_URUGUAY: ClubBase[] = [
  { id: 'uruguay-penarol', nombre: 'Peñarol', pais: 'Uruguay', nc: 72, archivo: 'penarol.png' },
  { id: 'uruguay-nacional', nombre: 'Nacional', pais: 'Uruguay', nc: 71, archivo: 'nacional.png' },
  { id: 'uruguay-defensor-sporting', nombre: 'Defensor Sporting', pais: 'Uruguay', nc: 66, archivo: 'defensor-sporting.png', estimado: true },
  { id: 'uruguay-cerro-largo', nombre: 'Cerro Largo', pais: 'Uruguay', nc: 67, archivo: 'cerro-largo.png' },
  { id: 'uruguay-boston-river', nombre: 'Boston River', pais: 'Uruguay', nc: 66, archivo: 'boston-river.png' },
  { id: 'uruguay-racing-club-de-montevideo', nombre: 'Racing Club de Montevideo', pais: 'Uruguay', nc: 65, archivo: 'racing-club-de-montevideo.png' },
  { id: 'uruguay-danubio', nombre: 'Danubio', pais: 'Uruguay', nc: 64, archivo: 'danubio.png', estimado: true },
  { id: 'uruguay-liverpool-fc', nombre: 'Liverpool FC', pais: 'Uruguay', nc: 63, archivo: 'liverpool-fc.png', estimado: true },
  { id: 'uruguay-river-plate', nombre: 'River Plate', pais: 'Uruguay', nc: 62, archivo: 'river-plate.svg', estimado: true },
  { id: 'uruguay-montevideo-wanderers', nombre: 'Montevideo Wanderers', pais: 'Uruguay', nc: 62, archivo: 'montevideo-wanderers.png', estimado: true },
  { id: 'uruguay-fenix', nombre: 'Fénix', pais: 'Uruguay', nc: 61, archivo: 'fenix.svg', estimado: true },
  { id: 'uruguay-progreso', nombre: 'Progreso', pais: 'Uruguay', nc: 60, archivo: 'progreso.png', estimado: true },
  { id: 'uruguay-rentistas', nombre: 'Rentistas', pais: 'Uruguay', nc: 60, archivo: 'rentistas.svg', estimado: true },
  { id: 'uruguay-plaza-colonia', nombre: 'Plaza Colonia', pais: 'Uruguay', nc: 60, archivo: 'plaza-colonia.svg', estimado: true },
];
