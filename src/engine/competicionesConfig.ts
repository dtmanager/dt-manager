// Configuración de competiciones (prompt-copas-manager-app.md): balance y
// mapeos en un solo lugar editable.
//
// MLS no tiene una copa doméstica equivalente relevante en la realidad
// (el "U.S. Open Cup" mezcla categorías amateurs que no modelamos, y no
// es una competencia central de la MLS como sí lo son estas 7 para sus
// ligas) — se omite a propósito, no es un olvido.

export const COPA_NACIONAL_POR_LIGA: Record<string, string> = {
  'Liga Profesional': 'Copa Argentina',
  'Premier League': 'FA Cup',
  LaLiga: 'Copa del Rey',
  'Serie A': 'Coppa Italia',
  Bundesliga: 'DFB-Pokal',
  'Ligue 1': 'Coupe de France',
  'Brasileirão Série A': 'Copa do Brasil',
  Eredivisie: 'KNVB Beker',
  'Pro League': 'Croky Cup',
  'Primeira Liga': 'Taça de Portugal',
  'Süper Lig': 'Türkiye Kupası',
  Premiership: 'Scottish Cup',
  'J1 League': "Emperor's Cup",
};

export function copaNacionalDeLiga(nombreLiga: string): string | null {
  return COPA_NACIONAL_POR_LIGA[nombreLiga] ?? null;
}

// -------------------- ascenso / descenso (pedido explícito) --------------------
//
// Sólo para los países que tienen 2 divisiones cargadas — los otros 8
// países (Brasil, Estados Unidos, Países Bajos, Bélgica, Portugal,
// Turquía, Escocia, Japón) sólo tienen una liga en el juego, así que ahí
// no hay a dónde bajar/subir (el descenso sigue terminando la carrera,
// como antes).
export const LIGA_INFERIOR_DE: Record<string, string> = {
  'Liga Profesional': 'Primera Nacional',
  'Premier League': 'Championship (2ª división)',
  LaLiga: 'Segunda División (2ª división)',
  'Serie A': 'Serie B (2ª división)',
  Bundesliga: '2. Bundesliga (2ª división)',
  'Ligue 1': 'Ligue 2 (2ª división)',
};

// Bug reportado ("los equipos del federal A y la b metropolitana no
// ascienden"): LIGA_SUPERIOR_DE se autogeneraba invirtiendo
// LIGA_INFERIOR_DE — un mapeo 1 a 1, así que sólo podía haber UNA "liga
// superior" por liga. Torneo Federal A y Primera B Metropolitana son las
// dos terceras divisiones REALES del fútbol argentino, en paralelo (no
// una detrás de la otra) — las dos ascienden a Primera Nacional, pero
// Primera Nacional sigue bajando sólo a un lugar fijo (no hay forma real
// de saber a cuál de las dos te manda un descenso sin una regla de zonas
// que este motor no modela). Por eso ahora es un mapeo aparte, escrito a
// mano — ya no se puede derivar automático de LIGA_INFERIOR_DE en cuanto
// deja de ser 1 a 1.
export const LIGA_SUPERIOR_DE: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(LIGA_INFERIOR_DE).map(([superior, inferior]) => [inferior, superior]),
  ),
  'Torneo Federal A': 'Primera Nacional',
  'Primera B Metropolitana': 'Primera Nacional',
};

export function ligaInferiorDe(nombreLiga: string): string | null {
  return LIGA_INFERIOR_DE[nombreLiga] ?? null;
}

export function ligaSuperiorDe(nombreLiga: string): string | null {
  return LIGA_SUPERIOR_DE[nombreLiga] ?? null;
}

// -------------------- copas continentales (pedido explícito) --------------------
//
// Cupos aproximados (temporada real como referencia, no el reglamento
// exacto de UEFA/CONMEBOL — documentado en prompt-copas-manager-app.md).
// Rangos [desde0, hasta0] 0-indexados e inclusive sobre la tabla final de
// esa liga (calcularTabla real para la liga que juega el usuario,
// tablaEstadistica para el resto — ver clasificacionLigas.ts).
export interface CuposCopasContinentales {
  champions?: [number, number];
  europa?: [number, number];
  conference?: [number, number];
  libertadores?: [number, number];
  sudamericana?: [number, number];
}

export const CUPOS_CONTINENTALES_POR_LIGA: Record<string, CuposCopasContinentales> = {
  'Premier League': { champions: [0, 3], europa: [4, 4], conference: [5, 5] },
  LaLiga: { champions: [0, 3], europa: [4, 4], conference: [5, 5] },
  'Serie A': { champions: [0, 3], europa: [4, 4], conference: [5, 5] },
  Bundesliga: { champions: [0, 3], europa: [4, 4], conference: [5, 5] },
  'Ligue 1': { champions: [0, 2], europa: [3, 3], conference: [4, 4] },
  'Liga Profesional': { libertadores: [0, 5], sudamericana: [6, 10] },
  'Brasileirão Série A': { libertadores: [0, 5], sudamericana: [6, 11] },
  // Ligas "chicas" europeas (pedido explícito: "trofeos que faltan" — se
  // suman acá con cupos bastante más chicos que las 5 grandes, en línea
  // con su coeficiente UEFA real (nada exacto, mismo criterio del resto
  // de esta tabla). Eredivisie/Primeira Liga tienen algo más de peso
  // (históricamente entran directo o casi a Champions); el resto se
  // reparte entre Europa y Conference.
  Eredivisie: { champions: [0, 0], europa: [1, 1], conference: [2, 2] },
  'Primeira Liga': { champions: [0, 0], europa: [1, 1], conference: [2, 2] },
  'Süper Lig': { europa: [0, 0], conference: [1, 1] },
  'Pro League': { europa: [0, 0], conference: [1, 1] },
  Premiership: { conference: [0, 0] },
};

export function cuposContinentalesDeLiga(nombreLiga: string): CuposCopasContinentales | null {
  return CUPOS_CONTINENTALES_POR_LIGA[nombreLiga] ?? null;
}
