// Clubes reales de Segunda División (España, 2ª división) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/segunda-division-espana/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_SEGUNDA_DIVISION_ESPANA = '/assets/escudos/segunda-division-espana/';

export const CLUBES_SEGUNDA_DIVISION_ESPANA: ClubBase[] = [
  { id: 'segunda-esp-ud-las-palmas', nombre: 'UD Las Palmas', pais: 'Espana', nc: 72, archivo: 'ud-las-palmas.svg' },
  { id: 'segunda-esp-ud-almeria', nombre: 'UD Almería', pais: 'Espana', nc: 72, archivo: 'ud-almeria.svg' },
  { id: 'segunda-esp-rc-deportivo', nombre: 'RC Deportivo', pais: 'Espana', nc: 71, archivo: 'rc-deportivo.svg' },
  { id: 'segunda-esp-racing-de-santander', nombre: 'Racing de Santander', pais: 'Espana', nc: 70, archivo: 'racing-de-santander.svg' },
  { id: 'segunda-esp-real-sporting-de-gijon', nombre: 'Real Sporting de Gijón', pais: 'Espana', nc: 70, archivo: 'real-sporting-de-gijon.svg' },
  { id: 'segunda-esp-real-zaragoza', nombre: 'Real Zaragoza', pais: 'Espana', nc: 69, archivo: 'real-zaragoza.svg' },
  { id: 'segunda-esp-real-valladolid', nombre: 'Real Valladolid', pais: 'Espana', nc: 69, archivo: 'real-valladolid.svg' },
  { id: 'segunda-esp-sd-eibar', nombre: 'SD Eibar', pais: 'Espana', nc: 69, archivo: 'sd-eibar.svg' },
  { id: 'segunda-esp-malaga-cf', nombre: 'Málaga CF', pais: 'Espana', nc: 69, archivo: 'malaga-cf.svg' },
  { id: 'segunda-esp-cordoba-cf', nombre: 'Córdoba CF', pais: 'Espana', nc: 69, archivo: 'cordoba-cf.svg' },
  { id: 'segunda-esp-burgos-cf', nombre: 'Burgos CF', pais: 'Espana', nc: 69, archivo: 'burgos-cf.svg' },
  { id: 'segunda-esp-cd-castellon', nombre: 'CD Castellón', pais: 'Espana', nc: 69, archivo: 'cd-castellon.svg' },
  { id: 'segunda-esp-cd-leganes', nombre: 'CD Leganés', pais: 'Espana', nc: 69, archivo: 'cd-leganes.svg' },
  { id: 'segunda-esp-granada-cf', nombre: 'Granada CF', pais: 'Espana', nc: 69, archivo: 'granada-cf.svg' },
  { id: 'segunda-esp-albacete-balompie', nombre: 'Albacete Balompié', pais: 'Espana', nc: 68, archivo: 'albacete-balompie.svg' },
  { id: 'segunda-esp-cadiz-cf', nombre: 'Cádiz CF', pais: 'Espana', nc: 68, archivo: 'cadiz-cf.svg' },
  { id: 'segunda-esp-cultural-leonesa', nombre: 'Cultural Leonesa', pais: 'Espana', nc: 68, archivo: 'cultural-leonesa.svg' },
  { id: 'segunda-esp-ad-ceuta', nombre: 'AD Ceuta', pais: 'Espana', nc: 67, archivo: 'ad-ceuta.svg' },
  { id: 'segunda-esp-cd-mirandes', nombre: 'CD Mirandés', pais: 'Espana', nc: 67, archivo: 'cd-mirandes.svg' },
  { id: 'segunda-esp-sd-huesca', nombre: 'SD Huesca', pais: 'Espana', nc: 67, archivo: 'sd-huesca.svg' },
  { id: 'segunda-esp-fc-andorra', nombre: 'FC Andorra', pais: 'Espana', nc: 67, archivo: 'fc-andorra.svg' },
  { id: 'segunda-esp-real-sociedad-b', nombre: 'Real Sociedad B', pais: 'Espana', nc: 64, archivo: 'real-sociedad-b.svg' },
];
