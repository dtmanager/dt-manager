// Clubes reales de la División Profesional de Paraguay para el modo
// carrera. Los `nc` de Olimpia Asunción/Cerro Porteño/Libertad/Guaraní/
// Sportivo Luqueño reusan el valor ya cargado en clubesOtrosConmebol.ts
// (misma planilla de referencia FIFA/EA FC) — el resto de los clubes no
// estaba en ese pool y se marca `estimado: true` (estimación razonada, no
// dato de FIFA Index). `archivo` apunta a public/assets/escudos/paraguay/
// (los escudos todavía no están bajados — hay que agregarlos ahí con el
// nombre que indica cada `archivo`; el <img> del menú simplemente no se ve
// hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PARAGUAY = '/assets/escudos/paraguay/';

export const CLUBES_PARAGUAY: ClubBase[] = [
  { id: 'paraguay-olimpia-asuncion', nombre: 'Olimpia Asunción', pais: 'Paraguay', nc: 70, archivo: 'olimpia-asuncion.png' },
  { id: 'paraguay-cerro-porteno', nombre: 'Cerro Porteño', pais: 'Paraguay', nc: 70, archivo: 'cerro-porteno.png' },
  { id: 'paraguay-libertad', nombre: 'Libertad', pais: 'Paraguay', nc: 69, archivo: 'libertad.png' },
  { id: 'paraguay-guarani', nombre: 'Guaraní', pais: 'Paraguay', nc: 67, archivo: 'guarani.png' },
  { id: 'paraguay-nacional', nombre: 'Nacional', pais: 'Paraguay', nc: 65, archivo: 'nacional.png', estimado: true },
  { id: 'paraguay-sol-de-america', nombre: 'Sol de América', pais: 'Paraguay', nc: 62, archivo: 'sol-de-america.svg', estimado: true },
  { id: 'paraguay-sportivo-luqueno', nombre: 'Sportivo Luqueño', pais: 'Paraguay', nc: 61, archivo: 'sportivo-luqueno.png' },
  { id: 'paraguay-guairena', nombre: 'Guaireña', pais: 'Paraguay', nc: 60, archivo: 'guairena.svg', estimado: true },
  { id: 'paraguay-sportivo-ameliano', nombre: 'Sportivo Ameliano', pais: 'Paraguay', nc: 59, archivo: 'sportivo-ameliano.png', estimado: true },
  { id: 'paraguay-2-de-mayo', nombre: '2 de Mayo', pais: 'Paraguay', nc: 58, archivo: '2-de-mayo.png', estimado: true },
  { id: 'paraguay-general-diaz', nombre: 'General Díaz', pais: 'Paraguay', nc: 58, archivo: 'general-diaz.svg', estimado: true },
  { id: 'paraguay-recoleta', nombre: 'Recoleta', pais: 'Paraguay', nc: 57, archivo: 'recoleta.png', estimado: true },
];
