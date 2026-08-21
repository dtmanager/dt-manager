// Clubes reales de la Primera División de Venezuela para el modo carrera.
// Los `nc` de Academia Puerto Cabello/Carabobo FC/Caracas FC/GV San José/
// Deportivo Táchira reusan el valor ya cargado en clubesOtrosConmebol.ts
// (misma planilla de referencia FIFA/EA FC) — el resto de los clubes no
// estaba en ese pool y se marca `estimado: true` (estimación razonada, no
// dato de FIFA Index). `archivo` apunta a public/assets/escudos/venezuela/
// (los escudos todavía no están bajados — hay que agregarlos ahí con el
// nombre que indica cada `archivo`; el <img> del menú simplemente no se ve
// hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_VENEZUELA = '/assets/escudos/venezuela/';

export const CLUBES_VENEZUELA: ClubBase[] = [
  { id: 'venezuela-deportivo-la-guaira', nombre: 'Deportivo La Guaira', pais: 'Venezuela', nc: 66, archivo: 'deportivo-la-guaira.svg', estimado: true },
  { id: 'venezuela-academia-puerto-cabello', nombre: 'Academia Puerto Cabello', pais: 'Venezuela', nc: 66, archivo: 'academia-puerto-cabello.svg' },
  { id: 'venezuela-carabobo-fc', nombre: 'Carabobo FC', pais: 'Venezuela', nc: 66, archivo: 'carabobo-fc.svg' },
  { id: 'venezuela-caracas-fc', nombre: 'Caracas FC', pais: 'Venezuela', nc: 65, archivo: 'caracas-fc.svg' },
  { id: 'venezuela-deportivo-tachira', nombre: 'Deportivo Táchira', pais: 'Venezuela', nc: 65, archivo: 'deportivo-tachira.svg' },
  { id: 'venezuela-gv-san-jose', nombre: 'GV San José', pais: 'Venezuela', nc: 65, archivo: 'gv-san-jose.svg' },
  { id: 'venezuela-monagas-sc', nombre: 'Monagas SC', pais: 'Venezuela', nc: 62, archivo: 'monagas-sc.svg', estimado: true },
  { id: 'venezuela-metropolitanos-fc', nombre: 'Metropolitanos FC', pais: 'Venezuela', nc: 61, archivo: 'metropolitanos-fc.svg', estimado: true },
  { id: 'venezuela-estudiantes-de-merida', nombre: 'Estudiantes de Mérida', pais: 'Venezuela', nc: 60, archivo: 'estudiantes-de-merida.svg', estimado: true },
  { id: 'venezuela-zulia-fc', nombre: 'Zulia FC', pais: 'Venezuela', nc: 60, archivo: 'zulia-fc.svg', estimado: true },
  { id: 'venezuela-portuguesa-fc', nombre: 'Portuguesa FC', pais: 'Venezuela', nc: 59, archivo: 'portuguesa-fc.svg', estimado: true },
  { id: 'venezuela-mineros-de-guayana', nombre: 'Mineros de Guayana', pais: 'Venezuela', nc: 58, archivo: 'mineros-de-guayana.svg', estimado: true },
  { id: 'venezuela-rayo-zuliano', nombre: 'Rayo Zuliano', pais: 'Venezuela', nc: 58, archivo: 'rayo-zuliano.svg', estimado: true },
  { id: 'venezuela-yaracuyanos-fc', nombre: 'Yaracuyanos FC', pais: 'Venezuela', nc: 57, archivo: 'yaracuyanos-fc.svg', estimado: true },
];
