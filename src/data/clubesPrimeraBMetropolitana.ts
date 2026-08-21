// Clubes reales de Primera B Metropolitana (tercera división del área
// metropolitana de Buenos Aires — pedido explícito: "agrega... la primera
// b metropolitana con sus respectivos trofeos"). No hay valoración FIFA
// para esta categoría (`estimado: true` en todos, mismo criterio que
// clubesChampionshipInglaterra.ts) — nc estimado a ojo, un escalón por
// debajo de Primera Nacional (43-55 ahí, acá 38-46). `archivo` apunta a
// public/assets/escudos/primera-b-metropolitana/ (todavía no están
// bajados los escudos — el <img> del menú no se ve hasta entonces, no
// rompe nada, mismo comentario que el resto de los data files nuevos).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PRIMERA_B_METROPOLITANA = '/assets/escudos/primera-b-metropolitana/';

export const CLUBES_PRIMERA_B_METROPOLITANA: ClubBase[] = [
  { id: 'bmetro-deportivo-espanol', nombre: 'Deportivo Español', pais: 'Argentina', nc: 46, archivo: 'deportivo-espanol.png', estimado: true },
  { id: 'bmetro-berazategui', nombre: 'Berazategui', pais: 'Argentina', nc: 42, archivo: 'berazategui.png', estimado: true },
  { id: 'bmetro-sportivo-italiano', nombre: 'Sportivo Italiano', pais: 'Argentina', nc: 41, archivo: 'sportivo-italiano.png', estimado: true },
  { id: 'bmetro-canuelas', nombre: 'Cañuelas', pais: 'Argentina', nc: 40, archivo: 'canuelas.png', estimado: true },
  { id: 'bmetro-excursionistas', nombre: 'Excursionistas', pais: 'Argentina', nc: 44, archivo: 'excursionistas.png', estimado: true },
  { id: 'bmetro-talleres-re', nombre: 'Talleres (Remedios de Escalada)', pais: 'Argentina', nc: 42, archivo: 'talleres-re.png', estimado: true },
  { id: 'bmetro-lugano', nombre: 'Lugano', pais: 'Argentina', nc: 39, archivo: 'lugano.png', estimado: true },
  { id: 'bmetro-uai-urquiza', nombre: 'UAI Urquiza', pais: 'Argentina', nc: 45, archivo: 'uai-urquiza.png', estimado: true },
  { id: 'bmetro-villa-san-carlos', nombre: 'Villa San Carlos', pais: 'Argentina', nc: 41, archivo: 'villa-san-carlos.png', estimado: true },
  { id: 'bmetro-argentino-merlo', nombre: 'Argentino de Merlo', pais: 'Argentina', nc: 43, archivo: 'argentino-merlo.png', estimado: true },
  { id: 'bmetro-comunicaciones', nombre: 'Comunicaciones', pais: 'Argentina', nc: 40, archivo: 'comunicaciones.png', estimado: true },
  { id: 'bmetro-puerto-nuevo', nombre: 'Puerto Nuevo', pais: 'Argentina', nc: 39, archivo: 'puerto-nuevo.png', estimado: true },
  { id: 'bmetro-dock-sud', nombre: 'Dock Sud', pais: 'Argentina', nc: 38, archivo: 'dock-sud.png', estimado: true },
  { id: 'bmetro-liniers', nombre: 'Liniers', pais: 'Argentina', nc: 40, archivo: 'liniers.png', estimado: true },
  { id: 'bmetro-ituzaingo', nombre: 'Ituzaingó', pais: 'Argentina', nc: 41, archivo: 'ituzaingo.png', estimado: true },
  { id: 'bmetro-victoriano-arenas', nombre: 'Victoriano Arenas', pais: 'Argentina', nc: 38, archivo: 'victoriano-arenas.png', estimado: true },
  { id: 'bmetro-fenix', nombre: 'Fénix', pais: 'Argentina', nc: 42, archivo: 'fenix.png', estimado: true },
  { id: 'bmetro-sacachispas', nombre: 'Sacachispas', pais: 'Argentina', nc: 43, archivo: 'sacachispas.png', estimado: true },
  { id: 'bmetro-central-cordoba-ba', nombre: 'Central Córdoba (BA)', pais: 'Argentina', nc: 39, archivo: 'central-cordoba-ba.png', estimado: true },
  { id: 'bmetro-real-pilar', nombre: 'Real Pilar', pais: 'Argentina', nc: 40, archivo: 'real-pilar.png', estimado: true },
];
