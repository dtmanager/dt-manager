// Clubes reales de la Primera División de Bolivia para el modo carrera. Los
// `nc` de Bolívar/Nacional Potosí/San Antonio Bulo Bulo reusan el valor ya
// cargado en clubesOtrosConmebol.ts (misma planilla de referencia FIFA/EA
// FC) — el resto de los clubes no estaba en ese pool y se marca
// `estimado: true` (estimación razonada, no dato de FIFA Index). `archivo`
// apunta a public/assets/escudos/bolivia/ (los escudos todavía no están
// bajados — hay que agregarlos ahí con el nombre que indica cada
// `archivo`; el <img> del menú simplemente no se ve hasta entonces, no
// rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_BOLIVIA = '/assets/escudos/bolivia/';

export const CLUBES_BOLIVIA: ClubBase[] = [
  { id: 'bolivia-bolivar', nombre: 'Bolívar', pais: 'Bolivia', nc: 68, archivo: 'bolivar.png' },
  { id: 'bolivia-the-strongest', nombre: 'The Strongest', pais: 'Bolivia', nc: 67, archivo: 'the-strongest.png', estimado: true },
  { id: 'bolivia-always-ready', nombre: 'Always Ready', pais: 'Bolivia', nc: 65, archivo: 'always-ready.png', estimado: true },
  { id: 'bolivia-nacional-potosi', nombre: 'Nacional Potosí', pais: 'Bolivia', nc: 65, archivo: 'nacional-potosi.png' },
  { id: 'bolivia-wilstermann', nombre: 'Wilstermann', pais: 'Bolivia', nc: 63, archivo: 'wilstermann.png', estimado: true },
  { id: 'bolivia-san-antonio-bulo-bulo', nombre: 'San Antonio Bulo Bulo', pais: 'Bolivia', nc: 63, archivo: 'san-antonio-bulo-bulo.png' },
  { id: 'bolivia-real-santa-cruz', nombre: 'Real Santa Cruz', pais: 'Bolivia', nc: 59, archivo: 'real-santa-cruz.svg', estimado: true },
  { id: 'bolivia-independiente-petrolero', nombre: 'Independiente Petrolero', pais: 'Bolivia', nc: 58, archivo: 'independiente-petrolero.png', estimado: true },
  { id: 'bolivia-guabira', nombre: 'Guabirá', pais: 'Bolivia', nc: 58, archivo: 'guabira.png', estimado: true },
  { id: 'bolivia-blooming', nombre: 'Blooming', pais: 'Bolivia', nc: 58, archivo: 'blooming.png', estimado: true },
  { id: 'bolivia-aurora', nombre: 'Aurora', pais: 'Bolivia', nc: 57, archivo: 'aurora.png', estimado: true },
  { id: 'bolivia-real-tomayapo', nombre: 'Real Tomayapo', pais: 'Bolivia', nc: 57, archivo: 'real-tomayapo.png', estimado: true },
];
