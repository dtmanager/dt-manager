// Catálogo de trofeos por competencia (pedido explícito: implementar el
// diseño "Trofeos Manager App" de claude.ai/design) — mapea el mismo
// string `competencia` que ya guarda cada TituloGanado (ver
// engine/carreraDT.ts, siempre liga.nombre o el nombre real de la copa,
// nunca inventado — ver competicionesConfig.ts y useGameStore.ts) a las
// props que necesita TrofeoIcon.tsx para dibujarlo. Los datos (forma,
// metal, tamaño, mango/orejas, grabado, remate, color de acento) son la
// transcripción fiel del script del diseño — la única diferencia real es
// que ahí la clave era el nombre corto ("Championship") y acá tiene que
// ser el nombre REAL que usa el juego para esa 2ª división
// ("Championship (2ª división)"), así que el texto grabado en la banda
// del trofeo (bandText) se pasa aparte, más corto.
import type { FormaTrofeo, MetalTrofeo, TamanoTrofeo, TopperTrofeo } from '../components/TrofeoIcon';

export interface DefinicionTrofeo {
  shape: FormaTrofeo;
  metal: MetalTrofeo;
  size: TamanoTrofeo;
  handles: boolean;
  ornate: boolean;
  topper: TopperTrofeo;
  accent: string;
  bandText: string;
}

const COLOR_PAIS: Record<string, string> = {
  Argentina: '#75AADB', Inglaterra: '#C8102E', España: '#AA151B', Italia: '#008C45',
  Alemania: '#DD0000', Francia: '#0055A4', Brasil: '#009C3B', 'Países Bajos': '#FF7A00',
  Bélgica: '#ED2939', Portugal: '#046A38', Turquía: '#E30A17', Escocia: '#005EB8',
  Japón: '#BC002D', 'Estados Unidos': '#3C3B6E', Chile: '#0039A6', Uruguay: '#4AA9E0',
  Colombia: '#FCD116', Perú: '#D91023', Paraguay: '#0038A8', Ecuador: '#FFD100',
  Bolivia: '#D52B1E', Venezuela: '#FFCC00',
};

interface OpcionesTrofeo {
  bandText?: string;
  shape?: FormaTrofeo;
  metal?: MetalTrofeo;
  size?: TamanoTrofeo;
  handles?: boolean;
  ornate?: boolean;
  topper?: TopperTrofeo;
  accent?: string;
}

function trofeo(bandTextPorDefecto: string, pais: string | null, opts: OpcionesTrofeo = {}): DefinicionTrofeo {
  return {
    shape: opts.shape ?? 'cup',
    metal: opts.metal ?? 'silver',
    size: opts.size ?? 'sm',
    handles: !!opts.handles,
    ornate: !!opts.ornate,
    topper: opts.topper ?? 'sphere',
    accent: opts.accent ?? (pais ? COLOR_PAIS[pais] : undefined) ?? '#8a8f98',
    bandText: opts.bandText ?? bandTextPorDefecto,
  };
}

// Ligas — 1ª división. Claves = LIGAS[].nombre real (ver data/ligas.ts).
const LIGAS_1RA: Record<string, DefinicionTrofeo> = {
  'Liga Profesional': trofeo('Liga Profesional', 'Argentina', { size: 'sm' }),
  'Premier League': trofeo('Premier League', 'Inglaterra', { shape: 'crown', metal: 'gold' }),
  LaLiga: trofeo('LaLiga', 'España', { size: 'sm' }),
  'Serie A': trofeo('Serie A', 'Italia', { size: 'sm' }),
  Bundesliga: trofeo('Bundesliga', 'Alemania', { shape: 'plate' }),
  'Ligue 1': trofeo('Ligue 1', 'Francia', { shape: 'hexagon' }),
  'Brasileirão Série A': trofeo('Brasileirão', 'Brasil', { size: 'md', handles: true }),
  Eredivisie: trofeo('Eredivisie', 'Países Bajos', { size: 'sm' }),
  'Pro League': trofeo('Pro League', 'Bélgica', { size: 'sm' }),
  'Primeira Liga': trofeo('Primeira Liga', 'Portugal', { size: 'sm' }),
  'Süper Lig': trofeo('Süper Lig', 'Turquía', { size: 'sm', ornate: true }),
  Premiership: trofeo('Premiership', 'Escocia', { size: 'sm' }),
  'J1 League': trofeo('J1 League', 'Japón', { shape: 'faceted', size: 'sm' }),
  MLS: trofeo('MLS', 'Estados Unidos', { size: 'sm' }),
  'Primera División (Chile)': trofeo('PRIMERA DIVISIÓN', 'Chile', { size: 'sm' }),
  'Primera División (Uruguay)': trofeo('PRIMERA DIVISIÓN', 'Uruguay', { size: 'sm', handles: true }),
  'Categoría Primera A': trofeo('PRIMERA A', 'Colombia', { size: 'sm' }),
  'Liga 1': trofeo('LIGA 1', 'Perú', { size: 'sm' }),
  'División Profesional': trofeo('DIVISIÓN PROFESIONAL', 'Paraguay', { size: 'sm' }),
  'LigaPro Serie A': trofeo('LIGAPRO', 'Ecuador', { size: 'sm' }),
  'Primera División (Bolivia)': trofeo('PRIMERA DIVISIÓN', 'Bolivia', { size: 'xs' }),
  'Primera División (Venezuela)': trofeo('PRIMERA DIVISIÓN', 'Venezuela', { size: 'xs' }),
};

// Ligas — 2ª división. Claves = LIGAS[].nombre real, que en el juego
// incluye el sufijo "(2ª división)" (a diferencia del nombre corto que
// usa el diseño sólo para el grabado de la banda).
const LIGAS_2DA: Record<string, DefinicionTrofeo> = {
  'Primera Nacional': trofeo('Primera Nacional', 'Argentina', { size: 'xs' }),
  'Championship (2ª división)': trofeo('Championship', 'Inglaterra', { size: 'xs' }),
  'Segunda División (2ª división)': trofeo('Segunda División', 'España', { size: 'xs' }),
  'Serie B (2ª división)': trofeo('Serie B', 'Italia', { size: 'xs' }),
  '2. Bundesliga (2ª división)': trofeo('2. Bundesliga', 'Alemania', { shape: 'plate', size: 'xs' }),
  'Ligue 2 (2ª división)': trofeo('Ligue 2', 'Francia', { shape: 'hexagon', size: 'xs' }),
};

// Copas nacionales — claves = COPA_NACIONAL_POR_LIGA[...] real (ver
// engine/competicionesConfig.ts). Las últimas 6 todavía no las genera el
// juego (sólo 7 ligas tienen copa nacional cargada) pero se dejan
// cargadas para cuando se sumen sin tener que volver a este archivo.
const COPAS_NACIONALES: Record<string, DefinicionTrofeo> = {
  'Copa Argentina': trofeo('Copa Argentina', 'Argentina', { size: 'md', handles: true }),
  'FA Cup': trofeo('FA Cup', 'Inglaterra', { size: 'md', handles: true, ornate: true }),
  'Copa del Rey': trofeo('Copa del Rey', 'España', { size: 'md', handles: true, ornate: true }),
  'Coppa Italia': trofeo('Coppa Italia', 'Italia', { size: 'md', handles: true }),
  'DFB-Pokal': trofeo('DFB-Pokal', 'Alemania', { size: 'sm' }),
  'Coupe de France': trofeo('Coupe de France', 'Francia', { size: 'sm', handles: true }),
  'Copa do Brasil': trofeo('Copa do Brasil', 'Brasil', { size: 'md', handles: true, metal: 'gold' }),
  'KNVB Beker': trofeo('KNVB Beker', 'Países Bajos', { size: 'sm' }),
  'Croky Cup': trofeo('Croky Cup', 'Bélgica', { size: 'sm' }),
  'Taça de Portugal': trofeo('Taça de Portugal', 'Portugal', { size: 'sm', handles: true }),
  'Türkiye Kupası': trofeo('Türkiye Kupası', 'Turquía', { size: 'sm', accent: '#E30A17' }),
  'Scottish Cup': trofeo('Scottish Cup', 'Escocia', { size: 'sm', ornate: true }),
  "Emperor's Cup": trofeo("Emperor's Cup", 'Japón', { size: 'md', ornate: true, metal: 'gold' }),
};

// Copas continentales — claves = nombre real que usa useGameStore.ts al
// registrar el título (championsEuropaConference.ts / 'Copa Libertadores'
// | 'Copa Sudamericana' según copaConmebol.tipo).
const COPAS_CONTINENTALES: Record<string, DefinicionTrofeo> = {
  'UEFA Champions League': trofeo('CHAMPIONS', null, { shape: 'big-ears', accent: '#14213D' }),
  'UEFA Europa League': trofeo('EUROPA LEAGUE', null, { shape: 'mug', accent: '#C1440E' }),
  'UEFA Conference League': trofeo('CONFERENCE', null, { shape: 'faceted', accent: '#2E7D32' }),
  'Copa Libertadores': trofeo('LIBERTADORES', null, { size: 'lg', handles: true, topper: 'globe', accent: '#3E6FAD' }),
  'Copa Sudamericana': trofeo('SUDAMERICANA', null, { size: 'md', handles: true, topper: 'star', accent: '#D64545' }),
};

// Copa mundial — clave literal 'Copa Mundial de Clubes' (hardcodeada en
// useGameStore.ts, no depende de ninguna liga/país).
const COPA_MUNDIAL: Record<string, DefinicionTrofeo> = {
  'Copa Mundial de Clubes': trofeo('MUNDIAL DE CLUBES', null, { shape: 'rings', metal: 'gold', accent: '#C9A227' }),
};

export const TROFEOS: Record<string, DefinicionTrofeo> = {
  ...LIGAS_1RA, ...LIGAS_2DA, ...COPAS_NACIONALES, ...COPAS_CONTINENTALES, ...COPA_MUNDIAL,
};

export interface EntradaTrofeoCatalogo {
  competencia: string;
  def: DefinicionTrofeo;
}

export interface SeccionTrofeos {
  label: string;
  entradas: EntradaTrofeoCatalogo[];
}

function entradas(record: Record<string, DefinicionTrofeo>): EntradaTrofeoCatalogo[] {
  return Object.entries(record).map(([competencia, def]) => ({ competencia, def }));
}

// Agrupado por categoría (pedido explícito, PantallaVitrinaTrofeos.tsx:
// "Ligas / Copas nacionales / Copas continentales / Copa Mundial") —
// mismo orden que el catálogo original.
export const SECCIONES_TROFEOS: SeccionTrofeos[] = [
  { label: 'Ligas — 1ª división', entradas: entradas(LIGAS_1RA) },
  { label: 'Ligas — 2ª división', entradas: entradas(LIGAS_2DA) },
  { label: 'Copas nacionales', entradas: entradas(COPAS_NACIONALES) },
  { label: 'Copas continentales', entradas: entradas(COPAS_CONTINENTALES) },
  { label: 'Copa Mundial', entradas: entradas(COPA_MUNDIAL) },
];

// Trofeo genérico (pedido explícito de robustez, no del diseño): por si
// alguna vez se registra un título con un nombre de competencia que no
// está en el catálogo — nunca debería pasar con los datos reales del
// juego, pero mejor una copa gris genérica que un ícono roto.
const TROFEO_GENERICO: DefinicionTrofeo = trofeo('TROFEO', null, {});

export function trofeoDeCompetencia(competencia: string): DefinicionTrofeo {
  return TROFEOS[competencia] ?? TROFEO_GENERICO;
}
