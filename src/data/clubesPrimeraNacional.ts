// Clubes reales de Primera Nacional (segunda división). Mismas fuentes de
// escudo que ya se habían bajado para el prototipo anterior — viven en
// public/assets/escudos/b nacional/. `nc` es una estimación a ojo (no hay
// FIFA Index confiable para esta categoría), en un escalón por debajo de
// Liga Profesional.
//
// San Martín (SJ) se sacó de esta lista: ascendió y juega en Primera
// Profesional (ver clubesLigaProfesional.ts) — no puede estar en las dos
// divisiones a la vez.
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PRIMERA_NACIONAL = '/assets/escudos/b nacional/';

export const CLUBES_PRIMERA_NACIONAL: ClubBase[] = [
  { id: 'acassuso', nombre: 'Atlético Acassuso', nc: 44, archivo: 'acassuso.png' },
  { id: 'agropecuario', nombre: 'Agropecuario', nc: 47, archivo: 'agropecuario.png' },
  { id: 'allboys', nombre: 'All Boys', nc: 46, archivo: 'allboys.png' },
  { id: 'almagro', nombre: 'Almagro', nc: 47, archivo: 'almagro.png' },
  { id: 'almirante', nombre: 'Almirante Brown', nc: 45, archivo: 'almirante.png' },
  { id: 'atlanta', nombre: 'Atlanta', nc: 46, archivo: 'atlanta.png' },
  { id: 'atletico-rafaela', nombre: 'Atlético de Rafaela', nc: 52, archivo: 'atleticorafaela.png' },
  { id: 'central-norte-salta', nombre: 'Central Norte (Salta)', nc: 45, archivo: 'central_norte.png' },
  { id: 'chacarita', nombre: 'Chacarita Juniors', nc: 55, archivo: 'chacarita.png' },
  { id: 'chaco-for-ever', nombre: 'Chaco For Ever', nc: 46, archivo: 'chaco_for_ever.png' },
  { id: 'ciudad-bolivar', nombre: 'Ciudad Bolívar', nc: 43, archivo: 'ciudad_bolivar.png' },
  { id: 'colegiales', nombre: 'Colegiales', nc: 43, archivo: 'colegiales.png' },
  { id: 'colon', nombre: 'Colón', nc: 53, archivo: 'colon.png' },
  { id: 'defensores-belgrano', nombre: 'Defensores de Belgrano', nc: 47, archivo: 'defensores.png' },
  { id: 'deportivo-maipu', nombre: 'Deportivo Maipú', nc: 46, archivo: 'depmaipu.png' },
  { id: 'deportivo-madryn', nombre: 'Deportivo Madryn', nc: 50, archivo: 'deportivo_madryn.png' },
  { id: 'estudiantes-rio-cuarto', nombre: 'Estudiantes (Río Cuarto)', nc: 50, archivo: 'estudiantes.png' },
  { id: 'ferro', nombre: 'Ferro Carril Oeste', nc: 51, archivo: 'ferro.png' },
  { id: 'gimnasia-tiro', nombre: 'Gimnasia y Tiro', nc: 44, archivo: 'gimnasia_y_tiro.png' },
  { id: 'gimnasia-jujuy', nombre: 'Gimnasia y Esgrima (Jujuy)', nc: 48, archivo: 'gimnasiajujuy.png' },
  { id: 'guemes', nombre: 'Güemes', nc: 47, archivo: 'guemes.png' },
  { id: 'los-andes', nombre: 'Los Andes', nc: 45, archivo: 'los_andes.png' },
  { id: 'midland', nombre: 'Midland', nc: 43, archivo: 'midland.png' },
  { id: 'mitre-sde', nombre: 'Mitre (SdE)', nc: 47, archivo: 'mitre.png' },
  { id: 'moron', nombre: 'Deportivo Morón', nc: 47, archivo: 'moron.png' },
  { id: 'nueva-chicago', nombre: 'Nueva Chicago', nc: 48, archivo: 'nueva_chicago.png' },
  { id: 'patronato', nombre: 'Patronato', nc: 52, archivo: 'patronato.png' },
  { id: 'quilmes', nombre: 'Quilmes', nc: 54, archivo: 'quilmes.png' },
  { id: 'racing-cordoba', nombre: 'Racing de Córdoba', nc: 45, archivo: 'racing_cordoba.png' },
  { id: 'san-martin-tuc', nombre: 'San Martín (Tucumán)', nc: 53, archivo: 'sanmartintuc.png' },
  { id: 'san-miguel', nombre: 'San Miguel', nc: 44, archivo: 'sanmiguel.png' },
  { id: 'san-telmo', nombre: 'San Telmo', nc: 46, archivo: 'santelmo.png' },
  { id: 'temperley', nombre: 'Temperley', nc: 47, archivo: 'temperley.png' },
  { id: 'tristan-suarez', nombre: 'Tristán Suárez', nc: 46, archivo: 'tristansuarez.png' },
];
