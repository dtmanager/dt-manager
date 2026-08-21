// Clubes reales de la Liga Profesional para armar la liga inicial del modo
// carrera (sección 9, M2 — "generar una liga completa"). `nc` es fijo por
// club (no se re-sortea en cada partida nueva) — son las mismas
// valoraciones de FIFA Index que se habían usado en el prototipo anterior,
// para que el jugador pueda comparar clubes ANTES de elegir uno, como en
// esa versión. `archivo` apunta a public/assets/escudos/.
//
// Godoy Cruz y San Martín (SJ) se agregaron después de la carga inicial (28
// clubes) para reflejar los 30 equipos de la Liga Profesional 2026 real —
// San Martín (SJ) ya no juega en Primera Nacional, se sacó de ese archivo.
//
// Nota: la planilla de referencia (fifaindex.com) también listaba "Gimnasia
// y Esgrima (Jujuy)" en Primera División con nc 48 estimado — un nc muy por
// debajo del resto de este archivo (63-75) y typico de Primera Nacional, no
// de Primera División. Gimnasia de Jujuy juega en Primera Nacional en la
// realidad (ya está cargado ahí con el mismo nc 48) — no se agregó acá para
// no duplicarlo; probablemente fifaindex lo tenía mal categorizado. Si
// confirmás que sí ascendió, agregalo con este mismo bloque.
export interface ClubBase {
  id: string;
  nombre: string;
  nc: number;
  archivo: string;
  // Agregados al sumar las ligas internacionales / segundas divisiones /
  // pools de referencia para copas — opcionales para no romper los datos
  // ya cargados que todavía no los tienen.
  pais?: string;
  estimado?: boolean;
}

export const RUTA_ESCUDOS = '/assets/escudos/';

export const CLUBES_LIGA_PROFESIONAL: ClubBase[] = [
  { id: 'aldosivi', nombre: 'Aldosivi', nc: 68, archivo: 'aldosivi-logo-footylogos.svg' },
  { id: 'argentinos-juniors', nombre: 'Argentinos Juniors', nc: 72, archivo: 'argentinos-juniors-logo-footylogos.svg' },
  { id: 'platense', nombre: 'Platense', nc: 70, archivo: 'atletico-platense-logo-footylogos.svg' },
  { id: 'atletico-tucuman', nombre: 'Atlético Tucumán', nc: 69, archivo: 'atletico-tucuman-logo-footylogos.svg' },
  { id: 'banfield', nombre: 'Banfield', nc: 68, archivo: 'banfield-logo-footylogos.svg' },
  { id: 'barracas-central', nombre: 'Barracas Central', nc: 69, archivo: 'barracas-central-logo-footylogos.svg' },
  { id: 'belgrano', nombre: 'Belgrano', nc: 71, archivo: 'belgrano-logo-footylogos.svg' },
  { id: 'boca-juniors', nombre: 'Boca Juniors', nc: 75, archivo: 'boca-juniors-logo-footylogos.svg' },
  { id: 'central-cordoba-se', nombre: 'Central Córdoba (SdE)', nc: 66, archivo: 'central-cordoba-se-logo-footylogos.svg' },
  { id: 'defensa-y-justicia', nombre: 'Defensa y Justicia', nc: 70, archivo: 'defensa-y-justicia-logo-footylogos.svg' },
  { id: 'deportivo-riestra', nombre: 'Deportivo Riestra', nc: 65, archivo: 'deportivo-riestra-logo-footylogos.svg' },
  { id: 'estudiantes-lp', nombre: 'Estudiantes (LP)', nc: 73, archivo: 'estudiantes-de-la-plata-logo-footylogos.svg' },
  { id: 'gimnasia-lp', nombre: 'Gimnasia y Esgrima (LP)', nc: 68, archivo: 'gimnasia-y-esgrima-lp-logo-footylogos.svg' },
  { id: 'huracan', nombre: 'Huracán', nc: 70, archivo: 'huracan-logo-footylogos.svg' },
  { id: 'independiente', nombre: 'Independiente', nc: 71, archivo: 'independiente-logo-footylogos.svg' },
  { id: 'independiente-rivadavia', nombre: 'Independiente Rivadavia', nc: 70, archivo: 'independiente-rivadavia-logo-footylogos.svg' },
  { id: 'instituto', nombre: 'Instituto', nc: 69, archivo: 'instituto-cordoba-logo-footylogos.svg' },
  { id: 'lanus', nombre: 'Lanús', nc: 72, archivo: 'lanus-logo-footylogos.svg' },
  { id: 'newells', nombre: "Newell's Old Boys", nc: 68, archivo: 'newells-old-boys-logo-footylogos.svg' },
  { id: 'racing', nombre: 'Racing Club', nc: 74, archivo: 'racing-club-logo-footylogos.svg' },
  { id: 'river-plate', nombre: 'River Plate', nc: 74, archivo: 'river-plate-logo-footylogos.svg' },
  { id: 'rosario-central', nombre: 'Rosario Central', nc: 73, archivo: 'rosario-central-logo-footylogos.svg' },
  { id: 'san-lorenzo', nombre: 'San Lorenzo', nc: 70, archivo: 'san-lorenzo-logo-footylogos.svg' },
  { id: 'sarmiento', nombre: 'Sarmiento (Junín)', nc: 68, archivo: 'sarmiento-logo-footylogos.svg' },
  { id: 'talleres', nombre: 'Talleres', nc: 71, archivo: 'talleres-logo-footylogos.svg' },
  { id: 'tigre', nombre: 'Tigre', nc: 69, archivo: 'tigre-logo-footylogos.svg' },
  { id: 'union', nombre: 'Unión', nc: 69, archivo: 'union-logo-footylogos.svg' },
  { id: 'velez-sarsfield', nombre: 'Vélez Sarsfield', nc: 73, archivo: 'velez-sarsfield-logo-footylogos.svg' },
  { id: 'godoy-cruz', nombre: 'Godoy Cruz', pais: 'Argentina', nc: 67, archivo: 'godoy-cruz.svg' },
  { id: 'san-martin-sj', nombre: 'San Martín (SJ)', pais: 'Argentina', nc: 63, archivo: 'san-martin-sj.svg' },
];
