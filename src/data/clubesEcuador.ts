// Clubes reales de LigaPro Serie A de Ecuador para el modo carrera. Los
// `nc` de LDU Quito/Independiente del Valle/Barcelona SC Guayaquil/
// Universidad Católica (Ecuador)/Mushuc Runa reusan el valor ya cargado en
// clubesOtrosConmebol.ts (misma planilla de referencia FIFA/EA FC) — el
// resto de los clubes no estaba en ese pool y se marca `estimado: true`
// (estimación razonada, no dato de FIFA Index). `archivo` apunta a
// public/assets/escudos/ecuador/ (los escudos todavía no están bajados —
// hay que agregarlos ahí con el nombre que indica cada `archivo`; el <img>
// del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_ECUADOR = '/assets/escudos/ecuador/';

export const CLUBES_ECUADOR: ClubBase[] = [
  { id: 'ecuador-ldu-quito', nombre: 'LDU Quito', pais: 'Ecuador', nc: 70, archivo: 'ldu-quito.png' },
  { id: 'ecuador-independiente-del-valle', nombre: 'Independiente del Valle', pais: 'Ecuador', nc: 70, archivo: 'independiente-del-valle.png' },
  { id: 'ecuador-barcelona-sc-guayaquil', nombre: 'Barcelona SC Guayaquil', pais: 'Ecuador', nc: 69, archivo: 'barcelona-sc-guayaquil.png' },
  { id: 'ecuador-emelec', nombre: 'Emelec', pais: 'Ecuador', nc: 68, archivo: 'emelec.png', estimado: true },
  { id: 'ecuador-universidad-catolica', nombre: 'Universidad Católica (Ecuador)', pais: 'Ecuador', nc: 68, archivo: 'universidad-catolica.png' },
  { id: 'ecuador-mushuc-runa', nombre: 'Mushuc Runa', pais: 'Ecuador', nc: 65, archivo: 'mushuc-runa.png' },
  { id: 'ecuador-aucas', nombre: 'Aucas', pais: 'Ecuador', nc: 63, archivo: 'aucas.png', estimado: true },
  { id: 'ecuador-deportivo-cuenca', nombre: 'Deportivo Cuenca', pais: 'Ecuador', nc: 61, archivo: 'deportivo-cuenca.png', estimado: true },
  { id: 'ecuador-delfin-sc', nombre: 'Delfín SC', pais: 'Ecuador', nc: 61, archivo: 'delfin-sc.png', estimado: true },
  { id: 'ecuador-tecnico-universitario', nombre: 'Técnico Universitario', pais: 'Ecuador', nc: 59, archivo: 'tecnico-universitario.svg', estimado: true },
  { id: 'ecuador-macara', nombre: 'Macará', pais: 'Ecuador', nc: 59, archivo: 'macara.png', estimado: true },
  { id: 'ecuador-orense-sc', nombre: 'Orense SC', pais: 'Ecuador', nc: 58, archivo: 'orense-sc.png', estimado: true },
  { id: 'ecuador-cumbaya-fc', nombre: 'Cumbayá FC', pais: 'Ecuador', nc: 58, archivo: 'cumbaya-fc.svg', estimado: true },
  { id: 'ecuador-vinotinto', nombre: 'Vinotinto', pais: 'Ecuador', nc: 57, archivo: 'vinotinto.svg', estimado: true },
];
