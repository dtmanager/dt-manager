// Pool de referencia (NO es una liga seleccionable para "empezar acá" en el menú —
// no registrado en data/ligas.ts). Clubes de las ligas de Perú, Uruguay, Ecuador, Paraguay, Chile, Venezuela,
// Colombia y Bolivia (las principales federaciones CONMEBOL que no tienen liga
// propia cargada en el juego).
// Pensado para alimentar los rivales de las competiciones internacionales (Copa
// Libertadores / Copa Sudamericana / Europa League / Conference League) cuando se
// implementen con formato real — ver el prompt de "copas nacionales e internacionales".
// `nc` sale de la misma planilla de referencia (escala FIFA/EA FC 0-100) que el resto de
// las ligas del juego; los marcados `estimado: true` no tienen licencia FIFA.
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_OTROS_CONMEBOL = '/assets/escudos/otros-conmebol/';

export const CLUBES_OTROS_CONMEBOL: ClubBase[] = [
  { id: 'conmebol-atletico-nacional', nombre: 'Atlético Nacional', pais: 'Colombia', nc: 72, archivo: 'atletico-nacional.svg' },
  { id: 'conmebol-penarol', nombre: 'Peñarol', pais: 'Uruguay', nc: 72, archivo: 'penarol.svg' },
  { id: 'conmebol-nacional', nombre: 'Nacional', pais: 'Uruguay', nc: 71, archivo: 'nacional.svg' },
  { id: 'conmebol-ldu-quito', nombre: 'LDU Quito', pais: 'Ecuador', nc: 70, archivo: 'ldu-quito.svg' },
  { id: 'conmebol-alianza-lima', nombre: 'Alianza Lima', pais: 'Perú', nc: 70, archivo: 'alianza-lima.svg' },
  { id: 'conmebol-universitario-de-deportes', nombre: 'Universitario de Deportes', pais: 'Perú', nc: 70, archivo: 'universitario-de-deportes.svg' },
  { id: 'conmebol-olimpia-asuncion', nombre: 'Olimpia Asunción', pais: 'Paraguay', nc: 70, archivo: 'olimpia-asuncion.svg' },
  { id: 'conmebol-universidad-de-chile', nombre: 'Universidad de Chile', pais: 'Chile', nc: 70, archivo: 'universidad-de-chile.svg' },
  { id: 'conmebol-cerro-porteno', nombre: 'Cerro Porteño', pais: 'Paraguay', nc: 70, archivo: 'cerro-porteno.svg' },
  { id: 'conmebol-independiente-del-valle', nombre: 'Independiente del Valle', pais: 'Ecuador', nc: 70, archivo: 'independiente-del-valle.svg' },
  { id: 'conmebol-america-de-cali', nombre: 'América de Cali', pais: 'Colombia', nc: 70, archivo: 'america-de-cali.svg' },
  { id: 'conmebol-barcelona-sc-guayaquil', nombre: 'Barcelona SC Guayaquil', pais: 'Ecuador', nc: 69, archivo: 'barcelona-sc-guayaquil.svg' },
  { id: 'conmebol-libertad', nombre: 'Libertad', pais: 'Paraguay', nc: 69, archivo: 'libertad.svg' },
  { id: 'conmebol-sporting-cristal', nombre: 'Sporting Cristal', pais: 'Perú', nc: 69, archivo: 'sporting-cristal.svg' },
  { id: 'conmebol-atletico-bucaramanga', nombre: 'Atlético Bucaramanga', pais: 'Colombia', nc: 69, archivo: 'atletico-bucaramanga.svg' },
  { id: 'conmebol-once-caldas', nombre: 'Once Caldas', pais: 'Colombia', nc: 69, archivo: 'once-caldas.svg' },
  { id: 'conmebol-bolivar', nombre: 'Bolívar', pais: 'Bolivia', nc: 68, archivo: 'bolivar.svg' },
  { id: 'conmebol-universidad-catolica-ecuador', nombre: 'Universidad Católica (Ecuador)', pais: 'Ecuador', nc: 68, archivo: 'universidad-catolica-ecuador.svg' },
  { id: 'conmebol-melgar-fbc', nombre: 'Melgar FBC', pais: 'Perú', nc: 68, archivo: 'melgar-fbc.svg' },
  { id: 'conmebol-palestino', nombre: 'Palestino', pais: 'Chile', nc: 67, archivo: 'palestino.svg' },
  { id: 'conmebol-guarani', nombre: 'Guaraní', pais: 'Paraguay', nc: 67, archivo: 'guarani.svg' },
  { id: 'conmebol-deportes-iquique', nombre: 'Deportes Iquique', pais: 'Chile', nc: 67, archivo: 'deportes-iquique.svg' },
  { id: 'conmebol-cerro-largo', nombre: 'Cerro Largo', pais: 'Uruguay', nc: 67, archivo: 'cerro-largo.svg' },
  { id: 'conmebol-colo-colo', nombre: 'Colo-Colo', pais: 'Chile', nc: 66, archivo: 'colo-colo.svg' },
  { id: 'conmebol-cienciano', nombre: 'Cienciano', pais: 'Perú', nc: 66, archivo: 'cienciano.svg' },
  { id: 'conmebol-boston-river', nombre: 'Boston River', pais: 'Uruguay', nc: 66, archivo: 'boston-river.svg' },
  { id: 'conmebol-club-atletico-grau', nombre: 'Club Atlético Grau', pais: 'Perú', nc: 66, archivo: 'club-atletico-grau.svg' },
  { id: 'conmebol-academia-puerto-cabello', nombre: 'Academia Puerto Cabello', pais: 'Venezuela', nc: 66, archivo: 'academia-puerto-cabello.svg' },
  { id: 'conmebol-carabobo-fc', nombre: 'Carabobo FC', pais: 'Venezuela', nc: 66, archivo: 'carabobo-fc.svg' },
  { id: 'conmebol-caracas-fc', nombre: 'Caracas FC', pais: 'Venezuela', nc: 65, archivo: 'caracas-fc.svg' },
  { id: 'conmebol-racing-club-de-montevideo', nombre: 'Racing Club de Montevideo', pais: 'Uruguay', nc: 65, archivo: 'racing-club-de-montevideo.svg' },
  { id: 'conmebol-nacional-potosi', nombre: 'Nacional Potosí', pais: 'Bolivia', nc: 65, archivo: 'nacional-potosi.svg' },
  { id: 'conmebol-union-espanola', nombre: 'Unión Española', pais: 'Chile', nc: 65, archivo: 'union-espanola.svg' },
  { id: 'conmebol-mushuc-runa', nombre: 'Mushuc Runa', pais: 'Ecuador', nc: 65, archivo: 'mushuc-runa.svg' },
  { id: 'conmebol-gv-san-jose', nombre: 'GV San José', pais: 'Venezuela', nc: 65, archivo: 'gv-san-jose.svg' },
  { id: 'conmebol-deportivo-tachira', nombre: 'Deportivo Táchira', pais: 'Venezuela', nc: 65, archivo: 'deportivo-tachira.svg' },
  { id: 'conmebol-san-antonio-bulo-bulo', nombre: 'San Antonio Bulo Bulo', pais: 'Bolivia', nc: 63, archivo: 'san-antonio-bulo-bulo.svg' },
  { id: 'conmebol-sportivo-luqueno', nombre: 'Sportivo Luqueño', pais: 'Paraguay', nc: 61, archivo: 'sportivo-luqueno.svg' },
];
