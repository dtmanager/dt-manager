// Clubes reales de J1 League (Japón) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/j1-league-japon/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_J1_LEAGUE_JAPON = '/assets/escudos/j1-league-japon/';

export const CLUBES_J1_LEAGUE_JAPON: ClubBase[] = [
  { id: 'j1-vissel-kobe', nombre: 'Vissel Kobe', pais: 'Japon', nc: 68, archivo: 'vissel-kobe.png', estimado: true },
  { id: 'j1-yokohama-f-marinos', nombre: 'Yokohama F. Marinos', pais: 'Japon', nc: 68, archivo: 'yokohama-f-marinos.png', estimado: true },
  { id: 'j1-kawasaki-frontale', nombre: 'Kawasaki Frontale', pais: 'Japon', nc: 67, archivo: 'kawasaki-frontale.png', estimado: true },
  { id: 'j1-urawa-red-diamonds', nombre: 'Urawa Red Diamonds', pais: 'Japon', nc: 66, archivo: 'urawa-red-diamonds.png', estimado: true },
  { id: 'j1-kashima-antlers', nombre: 'Kashima Antlers', pais: 'Japon', nc: 66, archivo: 'kashima-antlers.png', estimado: true },
  { id: 'j1-sanfrecce-hiroshima', nombre: 'Sanfrecce Hiroshima', pais: 'Japon', nc: 65, archivo: 'sanfrecce-hiroshima.png', estimado: true },
  { id: 'j1-nagoya-grampus', nombre: 'Nagoya Grampus', pais: 'Japon', nc: 64, archivo: 'nagoya-grampus.png', estimado: true },
  { id: 'j1-cerezo-osaka', nombre: 'Cerezo Osaka', pais: 'Japon', nc: 64, archivo: 'cerezo-osaka.png', estimado: true },
  { id: 'j1-gamba-osaka', nombre: 'Gamba Osaka', pais: 'Japon', nc: 63, archivo: 'gamba-osaka.png', estimado: true },
  { id: 'j1-fc-tokyo', nombre: 'FC Tokyo', pais: 'Japon', nc: 63, archivo: 'fc-tokyo.png', estimado: true },
  { id: 'j1-kashiwa-reysol', nombre: 'Kashiwa Reysol', pais: 'Japon', nc: 62, archivo: 'kashiwa-reysol.png', estimado: true },
  { id: 'j1-kyoto-sanga', nombre: 'Kyoto Sanga', pais: 'Japon', nc: 61, archivo: 'kyoto-sanga.png', estimado: true },
  { id: 'j1-avispa-fukuoka', nombre: 'Avispa Fukuoka', pais: 'Japon', nc: 61, archivo: 'avispa-fukuoka.png', estimado: true },
  { id: 'j1-tokyo-verdy', nombre: 'Tokyo Verdy', pais: 'Japon', nc: 60, archivo: 'tokyo-verdy.png', estimado: true },
  { id: 'j1-shimizu-s-pulse', nombre: 'Shimizu S-Pulse', pais: 'Japon', nc: 60, archivo: 'shimizu-s-pulse.png', estimado: true },
  { id: 'j1-fagiano-okayama', nombre: 'Fagiano Okayama', pais: 'Japon', nc: 59, archivo: 'fagiano-okayama.png', estimado: true },
  { id: 'j1-machida-zelvia', nombre: 'Machida Zelvia', pais: 'Japon', nc: 59, archivo: 'machida-zelvia.png', estimado: true },
  { id: 'j1-jef-united-ichihara-chiba', nombre: 'JEF United Ichihara Chiba', pais: 'Japon', nc: 58, archivo: 'jef-united-ichihara-chiba.svg', estimado: true },
  { id: 'j1-mito-hollyhock', nombre: 'Mito HollyHock', pais: 'Japon', nc: 56, archivo: 'mito-hollyhock.svg', estimado: true },
  { id: 'j1-v-varen-nagasaki', nombre: 'V-Varen Nagasaki', pais: 'Japon', nc: 56, archivo: 'v-varen-nagasaki.svg', estimado: true },
];
