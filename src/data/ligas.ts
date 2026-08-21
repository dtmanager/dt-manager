// Selector de "en qué liga arrancás" del menú — mismo criterio que el
// prototipo anterior: se muestran las categorías de la referencia, pero
// sólo las que tienen clubes reales cargados quedan habilitadas.
//
// Las ligas internacionales usan `nc` de una planilla de referencia que
// pasó el usuario (escala FIFA/EA FC 26) — mismos valores que la vieja base
// de datos del prototipo vanilla (clubesInternacionales.js), pasados a este
// formato, ampliados después con la planilla completa de 551 clubes /
// 27 competiciones (Eredivisie, Bélgica, Portugal, Turquía, Escocia,
// segundas divisiones de Inglaterra/España/Italia/Alemania/Francia, J1
// League de Japón).
// Los escudos de las ligas nuevas todavía no están en public/assets/escudos/ —
// hay que agregarlos ahí con el nombre de archivo que indica cada `archivo`
// (el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import { CLUBES_LIGA_PROFESIONAL, RUTA_ESCUDOS, type ClubBase } from './clubesLigaProfesional';
import { CLUBES_PRIMERA_NACIONAL, RUTA_ESCUDOS_PRIMERA_NACIONAL } from './clubesPrimeraNacional';
import { CLUBES_PRIMERA_B_METROPOLITANA, RUTA_ESCUDOS_PRIMERA_B_METROPOLITANA } from './clubesPrimeraBMetropolitana';
import { CLUBES_FEDERAL_A, RUTA_ESCUDOS_FEDERAL_A } from './clubesFederalA';
import { CLUBES_PREMIER_LEAGUE, RUTA_ESCUDOS_PREMIER_LEAGUE } from './clubesPremierLeague';
import { CLUBES_LALIGA, RUTA_ESCUDOS_LALIGA } from './clubesLaLiga';
import { CLUBES_SERIE_A, RUTA_ESCUDOS_SERIE_A } from './clubesSerieA';
import { CLUBES_BUNDESLIGA, RUTA_ESCUDOS_BUNDESLIGA } from './clubesBundesliga';
import { CLUBES_LIGUE_1, RUTA_ESCUDOS_LIGUE_1 } from './clubesLigue1';
import { CLUBES_MLS, RUTA_ESCUDOS_MLS } from './clubesMLS';
import { CLUBES_BRASILEIRAO, RUTA_ESCUDOS_BRASILEIRAO } from './clubesBrasileirao';
import { CLUBES_EREDIVISIE, RUTA_ESCUDOS_EREDIVISIE } from './clubesEredivisie';
import { CLUBES_PRO_LEAGUE_BELGICA, RUTA_ESCUDOS_PRO_LEAGUE_BELGICA } from './clubesProLeagueBelgica';
import { CLUBES_PRIMEIRA_LIGA_PORTUGAL, RUTA_ESCUDOS_PRIMEIRA_LIGA_PORTUGAL } from './clubesPrimeiraLigaPortugal';
import { CLUBES_SUPER_LIG_TURQUIA, RUTA_ESCUDOS_SUPER_LIG_TURQUIA } from './clubesSuperLigTurquia';
import { CLUBES_PREMIERSHIP_ESCOCIA, RUTA_ESCUDOS_PREMIERSHIP_ESCOCIA } from './clubesPremiershipEscocia';
import { CLUBES_CHAMPIONSHIP_INGLATERRA, RUTA_ESCUDOS_CHAMPIONSHIP_INGLATERRA } from './clubesChampionshipInglaterra';
import { CLUBES_SEGUNDA_DIVISION_ESPANA, RUTA_ESCUDOS_SEGUNDA_DIVISION_ESPANA } from './clubesSegundaDivisionEspana';
import { CLUBES_SERIE_B_ITALIA, RUTA_ESCUDOS_SERIE_B_ITALIA } from './clubesSerieBItalia';
import { CLUBES_SEGUNDA_BUNDESLIGA_ALEMANIA, RUTA_ESCUDOS_SEGUNDA_BUNDESLIGA_ALEMANIA } from './clubesSegundaBundesligaAlemania';
import { CLUBES_LIGUE_2_FRANCIA, RUTA_ESCUDOS_LIGUE_2_FRANCIA } from './clubesLigue2Francia';
import { CLUBES_J1_LEAGUE_JAPON, RUTA_ESCUDOS_J1_LEAGUE_JAPON } from './clubesJ1LeagueJapon';
import { CLUBES_CHILE, RUTA_ESCUDOS_CHILE } from './clubesChile';
import { CLUBES_URUGUAY, RUTA_ESCUDOS_URUGUAY } from './clubesUruguay';
import { CLUBES_COLOMBIA, RUTA_ESCUDOS_COLOMBIA } from './clubesColombia';
import { CLUBES_PERU, RUTA_ESCUDOS_PERU } from './clubesPeru';
import { CLUBES_PARAGUAY, RUTA_ESCUDOS_PARAGUAY } from './clubesParaguay';
import { CLUBES_ECUADOR, RUTA_ESCUDOS_ECUADOR } from './clubesEcuador';
import { CLUBES_BOLIVIA, RUTA_ESCUDOS_BOLIVIA } from './clubesBolivia';
import { CLUBES_VENEZUELA, RUTA_ESCUDOS_VENEZUELA } from './clubesVenezuela';

export interface LigaOpcion {
  id: string;
  nombre: string;
  pais: string;
  disponible: boolean;
  clubes: ClubBase[];
  ruta: string;
}

export const LIGAS: LigaOpcion[] = [
  { id: 'liga-profesional', nombre: 'Liga Profesional', pais: 'Argentina', disponible: true, clubes: CLUBES_LIGA_PROFESIONAL, ruta: RUTA_ESCUDOS },
  { id: 'primera-nacional', nombre: 'Primera Nacional', pais: 'Argentina', disponible: true, clubes: CLUBES_PRIMERA_NACIONAL, ruta: RUTA_ESCUDOS_PRIMERA_NACIONAL },
  { id: 'primera-b-metro', nombre: 'Primera B Metropolitana', pais: 'Argentina', disponible: true, clubes: CLUBES_PRIMERA_B_METROPOLITANA, ruta: RUTA_ESCUDOS_PRIMERA_B_METROPOLITANA },
  { id: 'torneo-federal-a', nombre: 'Torneo Federal A', pais: 'Argentina', disponible: true, clubes: CLUBES_FEDERAL_A, ruta: RUTA_ESCUDOS_FEDERAL_A },
  { id: 'premier-league', nombre: 'Premier League', pais: 'Inglaterra', disponible: true, clubes: CLUBES_PREMIER_LEAGUE, ruta: RUTA_ESCUDOS_PREMIER_LEAGUE },
  { id: 'championship-inglaterra', nombre: 'Championship (2ª división)', pais: 'Inglaterra', disponible: true, clubes: CLUBES_CHAMPIONSHIP_INGLATERRA, ruta: RUTA_ESCUDOS_CHAMPIONSHIP_INGLATERRA },
  { id: 'laliga', nombre: 'LaLiga', pais: 'España', disponible: true, clubes: CLUBES_LALIGA, ruta: RUTA_ESCUDOS_LALIGA },
  { id: 'segunda-division-espana', nombre: 'Segunda División (2ª división)', pais: 'España', disponible: true, clubes: CLUBES_SEGUNDA_DIVISION_ESPANA, ruta: RUTA_ESCUDOS_SEGUNDA_DIVISION_ESPANA },
  { id: 'serie-a', nombre: 'Serie A', pais: 'Italia', disponible: true, clubes: CLUBES_SERIE_A, ruta: RUTA_ESCUDOS_SERIE_A },
  { id: 'serie-b-italia', nombre: 'Serie B (2ª división)', pais: 'Italia', disponible: true, clubes: CLUBES_SERIE_B_ITALIA, ruta: RUTA_ESCUDOS_SERIE_B_ITALIA },
  { id: 'bundesliga', nombre: 'Bundesliga', pais: 'Alemania', disponible: true, clubes: CLUBES_BUNDESLIGA, ruta: RUTA_ESCUDOS_BUNDESLIGA },
  { id: 'segunda-bundesliga-alemania', nombre: '2. Bundesliga (2ª división)', pais: 'Alemania', disponible: true, clubes: CLUBES_SEGUNDA_BUNDESLIGA_ALEMANIA, ruta: RUTA_ESCUDOS_SEGUNDA_BUNDESLIGA_ALEMANIA },
  { id: 'ligue-1', nombre: 'Ligue 1', pais: 'Francia', disponible: true, clubes: CLUBES_LIGUE_1, ruta: RUTA_ESCUDOS_LIGUE_1 },
  { id: 'ligue-2-francia', nombre: 'Ligue 2 (2ª división)', pais: 'Francia', disponible: true, clubes: CLUBES_LIGUE_2_FRANCIA, ruta: RUTA_ESCUDOS_LIGUE_2_FRANCIA },
  { id: 'mls', nombre: 'MLS', pais: 'Estados Unidos', disponible: true, clubes: CLUBES_MLS, ruta: RUTA_ESCUDOS_MLS },
  { id: 'brasileirao', nombre: 'Brasileirão Série A', pais: 'Brasil', disponible: true, clubes: CLUBES_BRASILEIRAO, ruta: RUTA_ESCUDOS_BRASILEIRAO },
  { id: 'eredivisie', nombre: 'Eredivisie', pais: 'Países Bajos', disponible: true, clubes: CLUBES_EREDIVISIE, ruta: RUTA_ESCUDOS_EREDIVISIE },
  { id: 'pro-league-belgica', nombre: 'Pro League', pais: 'Bélgica', disponible: true, clubes: CLUBES_PRO_LEAGUE_BELGICA, ruta: RUTA_ESCUDOS_PRO_LEAGUE_BELGICA },
  { id: 'primeira-liga-portugal', nombre: 'Primeira Liga', pais: 'Portugal', disponible: true, clubes: CLUBES_PRIMEIRA_LIGA_PORTUGAL, ruta: RUTA_ESCUDOS_PRIMEIRA_LIGA_PORTUGAL },
  { id: 'super-lig-turquia', nombre: 'Süper Lig', pais: 'Turquía', disponible: true, clubes: CLUBES_SUPER_LIG_TURQUIA, ruta: RUTA_ESCUDOS_SUPER_LIG_TURQUIA },
  { id: 'premiership-escocia', nombre: 'Premiership', pais: 'Escocia', disponible: true, clubes: CLUBES_PREMIERSHIP_ESCOCIA, ruta: RUTA_ESCUDOS_PREMIERSHIP_ESCOCIA },
  { id: 'j1-league-japon', nombre: 'J1 League', pais: 'Japón', disponible: true, clubes: CLUBES_J1_LEAGUE_JAPON, ruta: RUTA_ESCUDOS_J1_LEAGUE_JAPON },
  { id: 'chile', nombre: 'Primera División (Chile)', pais: 'Chile', disponible: true, clubes: CLUBES_CHILE, ruta: RUTA_ESCUDOS_CHILE },
  { id: 'uruguay', nombre: 'Primera División (Uruguay)', pais: 'Uruguay', disponible: true, clubes: CLUBES_URUGUAY, ruta: RUTA_ESCUDOS_URUGUAY },
  { id: 'colombia', nombre: 'Categoría Primera A', pais: 'Colombia', disponible: true, clubes: CLUBES_COLOMBIA, ruta: RUTA_ESCUDOS_COLOMBIA },
  { id: 'peru', nombre: 'Liga 1', pais: 'Perú', disponible: true, clubes: CLUBES_PERU, ruta: RUTA_ESCUDOS_PERU },
  { id: 'paraguay', nombre: 'División Profesional', pais: 'Paraguay', disponible: true, clubes: CLUBES_PARAGUAY, ruta: RUTA_ESCUDOS_PARAGUAY },
  { id: 'ecuador', nombre: 'LigaPro Serie A', pais: 'Ecuador', disponible: true, clubes: CLUBES_ECUADOR, ruta: RUTA_ESCUDOS_ECUADOR },
  { id: 'bolivia', nombre: 'Primera División (Bolivia)', pais: 'Bolivia', disponible: true, clubes: CLUBES_BOLIVIA, ruta: RUTA_ESCUDOS_BOLIVIA },
  { id: 'venezuela', nombre: 'Primera División (Venezuela)', pais: 'Venezuela', disponible: true, clubes: CLUBES_VENEZUELA, ruta: RUTA_ESCUDOS_VENEZUELA },
];

// Países con al menos una liga cargada, en el mismo orden en que
// aparecen por primera vez en LIGAS — para agrupar el selector del menú
// y también como lista de nacionalidades posibles del DT (flavor, no
// afecta ninguna mecánica).
export const PAISES_CON_LIGA: string[] = Array.from(new Set(LIGAS.map((l) => l.pais)));

// Para generar nombres de jugadores acordes al país de cada club (ver
// nombres.ts) — sólo resuelve países de las ligas domésticas cargadas acá;
// los clubes de los pools de referencia (Otros CONMEBOL, etc.) ya traen su
// propio `pais` en el ClubBase, no hace falta esta función para esos.
export function paisDeLiga(nombreLiga: string): string | null {
  return LIGAS.find((l) => l.nombre === nombreLiga)?.pais ?? null;
}

// Pools de referencia (Otros CONMEBOL, Otras ligas de Europa, Clubes sin
// liga en FIFA) NO están acá — no son competiciones jugables de "elegí en
// qué liga arrancás". Viven en clubesOtrosConmebol.ts / clubesOtrasLigasEuropa.ts /
// clubesSinLigaFifa.ts y están pensados como rivales para Copa Libertadores /
// Sudamericana / Europa League / Conference League cuando se implementen con
// formato real.
