// Escala económica por liga (pedido explícito: "investigar presupuestos de
// ligas, valor de jugadores, salarios para un mercado realista"). Antes
// presupuesto/premio/taquilla salían de una constante fija por nc, la misma
// para cualquier liga — un club nc80 de Liga Profesional "valía" lo mismo
// que un club nc80 de Premier League, lo cual no tiene nada que ver con la
// realidad: la Premier League reparte ~€6.300M/temporada entre 20 clubes
// sólo de TV, la Liga Profesional argentina no llega a una fracción chica
// de eso. Acá se separa "qué tan bueno es el plantel" (nc) de "en qué
// mercado juega" (liga) — dos clubes con el mismo nc en ligas distintas
// tienen presupuestos totalmente distintos, como en la vida real.
//
// Fuentes usadas para calibrar los anchos de banda (USD, tratando USD≈EUR
// como simplificación de diseño — no hace falta un tipo de cambio real
// para un juego):
//  - Deloitte Football Money League 2026 (temporada 2024-25): Real Madrid
//    ~$1.160M, Barcelona ~$975M-1.128M, Bayern Múnich ~$861M, PSG ~$837M,
//    Inter ~$538M, Dortmund ~$531M, Arsenal/City/Liverpool ~$820-836M,
//    Benfica ~$283M.
//  - Deloitte/Insidersport: ingreso agregado 2023-24 de las 5 grandes ligas
//    europeas — Premier League ~€6.300M, LaLiga y Bundesliga ~€3.800M cada
//    una, Serie A ~€2.900M, Ligue 1 ~€2.600M (18-20 clubes cada liga).
//  - cronicaglobal.elespanol.com: los 20 presupuestos de LaLiga 2024-25,
//    de Real Madrid (€1.128M) a Rayo Vallecano (€50M).
//  - El Economista / Transfermarkt: valor de plantel de River (~$118M) y
//    Boca (~$95M) vs. Platense (~$28M, campeón con uno de los presupuestos
//    más bajos) — el presupuesto ANUAL real de los grandes de Argentina es
//    bastante menor a esos valores de plantel (se vive de vender, no de
//    retener), de ahí que el techo de Liga Profesional acá sea mucho más
//    bajo que el de las ligas europeas top pese a tener nc parecido.
//  - CNN Brasil: Flamengo facturó R$2.100M en 2025 (~$380M) — un club
//    brasileño de punta puede estar en el orden de un club europeo
//    mediano-grande, algo real (Brasil monetiza mucho mejor que el resto
//    de Sudamérica).
//  - MLS: tope salarial "blando" ~$5,95M/plantel para 2025 (salvo
//    Designated Players) — la MLS tiene franquicias con ingresos/valuación
//    altos pero un techo salarial bajo por diseño de liga, de ahí el
//    multiplicadorSalarial chico pese a presupuestos de club no tan bajos.
//  - elfutbolero.com.ar / topmercato.com: el salario mínimo/promedio de
//    Primera División argentina ronda ~$1.100-1.300/mes (~$13-16K/año) a
//    inicios de 2026, mientras las estrellas "pueden superar el millón de
//    dólares anuales" — una brecha salarial enorme dentro de la misma
//    liga, muy por debajo de lo que un jugador de valorMercado equivalente
//    ganaría en Europa. De ahí multiplicadorSalarial tan bajo para
//    Argentina/Brasil/CONMEBOL: el jugador puede "valer" lo mismo que en
//    Europa (por eso se vende caro afuera), pero el club local no puede
//    pagarle un sueldo acorde a ese valor.
//
// El resto de las ligas (Eredivisie, Bélgica, Portugal, Turquía, Escocia,
// segundas divisiones, J1 League, y los 3 pools de referencia) no tienen
// una fuente puntual investigada acá — son estimaciones razonadas por
// tamaño de mercado relativo a las ligas de arriba (ej.: Portugal se
// calibró con Benfica de ancla superior pero un piso muy bajo, porque ahí
// el "Big 3" concentra casi todo el dinero de la liga; MLS y J1 League por
// reportes generales de ingresos de franquicia/club, no un ranking
// exhaustivo). Documentado acá para que sea fácil de corregir si aparece
// una fuente mejor.
import { clamp, randomUniforme } from './random';

export interface ConfigEconomicaLiga {
  ncMin: number; // nc del club más flojo de esa liga cargado en el juego
  ncMax: number; // nc del club más fuerte de esa liga cargado en el juego
  presupuestoEnNcMin: number; // USD, ingreso anual aproximado del club más flojo
  presupuestoEnNcMax: number; // USD, ingreso anual aproximado del club más fuerte
  // salario anual de un jugador ≈ valorMercado * multiplicadorSalarial —
  // qué tan bien paga esta liga en relación al valor "de mercado global"
  // de sus jugadores (que es el mismo para cualquier liga, ver
  // jugadores.ts). La Premier League paga cerca de lo que el jugador
  // "vale"; la Liga Profesional argentina paga una fracción chica de eso
  // (por eso vende a Europa en cuanto puede).
  multiplicadorSalarial: number;
}

// Las claves de este mapa tienen que ser EXACTAMENTE el `nombre` de la
// liga en data/ligas.ts (LIGAS) — bug encontrado mientras se armaba el
// mercado IA-IA (mercadoIA.ts, pedido explícito de "que los jugadores se
// intercambien naturalmente entre equipos"): varias claves de acá tenían
// texto extra entre paréntesis (ej. "Serie A (Italia)") que data/ligas.ts
// nunca usó como `nombre` (ahí es sólo "Serie A", con el país aparte en
// `pais`). Con la clave mal escrita, configDeLiga() no encontraba match y
// esas ~10 ligas (todas las agregadas después de las primeras 8) venían
// cayendo en silencio al fallback ECONOMIA_DEFAULT — perdían toda la
// calibración real de presupuesto/salario/premio de esta investigación sin
// que nada avisara. Corregido acá para que las claves matcheen 1 a 1 con
// LIGAS[].nombre.
export const ECONOMIA_POR_LIGA: Record<string, ConfigEconomicaLiga> = {
  'Liga Profesional': {
    ncMin: 63, ncMax: 75, presupuestoEnNcMin: 4_000_000, presupuestoEnNcMax: 55_000_000, multiplicadorSalarial: 0.012,
  },
  'Primera Nacional': {
    ncMin: 43, ncMax: 55, presupuestoEnNcMin: 400_000, presupuestoEnNcMax: 4_000_000, multiplicadorSalarial: 0.01,
  },
  'Premier League': {
    ncMin: 75, ncMax: 84, presupuestoEnNcMin: 160_000_000, presupuestoEnNcMax: 830_000_000, multiplicadorSalarial: 0.16,
  },
  LaLiga: {
    ncMin: 73, ncMax: 85, presupuestoEnNcMin: 58_000_000, presupuestoEnNcMax: 1_050_000_000, multiplicadorSalarial: 0.11,
  },
  'Serie A': {
    ncMin: 71, ncMax: 83, presupuestoEnNcMin: 50_000_000, presupuestoEnNcMax: 535_000_000, multiplicadorSalarial: 0.10,
  },
  Bundesliga: {
    ncMin: 72, ncMax: 84, presupuestoEnNcMin: 65_000_000, presupuestoEnNcMax: 860_000_000, multiplicadorSalarial: 0.11,
  },
  'Ligue 1': {
    ncMin: 71, ncMax: 85, presupuestoEnNcMin: 38_000_000, presupuestoEnNcMax: 830_000_000, multiplicadorSalarial: 0.09,
  },
  MLS: {
    ncMin: 65, ncMax: 72, presupuestoEnNcMin: 28_000_000, presupuestoEnNcMax: 180_000_000, multiplicadorSalarial: 0.05,
  },
  'Brasileirão Série A': {
    ncMin: 60, ncMax: 76, presupuestoEnNcMin: 8_000_000, presupuestoEnNcMax: 380_000_000, multiplicadorSalarial: 0.045,
  },
  Eredivisie: {
    ncMin: 66, ncMax: 77, presupuestoEnNcMin: 14_000_000, presupuestoEnNcMax: 140_000_000, multiplicadorSalarial: 0.075,
  },
  'Pro League': {
    ncMin: 67, ncMax: 74, presupuestoEnNcMin: 11_000_000, presupuestoEnNcMax: 90_000_000, multiplicadorSalarial: 0.07,
  },
  'Primeira Liga': {
    ncMin: 67, ncMax: 79, presupuestoEnNcMin: 8_000_000, presupuestoEnNcMax: 280_000_000, multiplicadorSalarial: 0.07,
  },
  'Süper Lig': {
    ncMin: 65, ncMax: 79, presupuestoEnNcMin: 9_000_000, presupuestoEnNcMax: 180_000_000, multiplicadorSalarial: 0.06,
  },
  Premiership: {
    ncMin: 63, ncMax: 75, presupuestoEnNcMin: 5_000_000, presupuestoEnNcMax: 95_000_000, multiplicadorSalarial: 0.06,
  },
  'Championship (2ª división)': {
    ncMin: 67, ncMax: 73, presupuestoEnNcMin: 16_000_000, presupuestoEnNcMax: 70_000_000, multiplicadorSalarial: 0.09,
  },
  'Segunda División (2ª división)': {
    ncMin: 64, ncMax: 72, presupuestoEnNcMin: 5_000_000, presupuestoEnNcMax: 20_000_000, multiplicadorSalarial: 0.05,
  },
  'Serie B (2ª división)': {
    ncMin: 67, ncMax: 72, presupuestoEnNcMin: 6_000_000, presupuestoEnNcMax: 22_000_000, multiplicadorSalarial: 0.05,
  },
  '2. Bundesliga (2ª división)': {
    ncMin: 67, ncMax: 71, presupuestoEnNcMin: 8_000_000, presupuestoEnNcMax: 25_000_000, multiplicadorSalarial: 0.06,
  },
  'Ligue 2 (2ª división)': {
    ncMin: 64, ncMax: 70, presupuestoEnNcMin: 4_000_000, presupuestoEnNcMax: 15_000_000, multiplicadorSalarial: 0.045,
  },
  'J1 League': {
    ncMin: 56, ncMax: 68, presupuestoEnNcMin: 7_000_000, presupuestoEnNcMax: 50_000_000, multiplicadorSalarial: 0.04,
  },
  // 8 ligas sudamericanas nuevas (pedido explícito: "trofeos que faltan" /
  // ligas sudamericanas completas) — igual que Eredivisie/Bélgica/etc, sin
  // fuente puntual investigada, estimaciones razonadas por tamaño de
  // mercado relativo a Liga Profesional/Brasileirão (arriba) y al pool
  // "Otros CONMEBOL" (abajo, que ya cargaba clubes de estos mismos 8
  // países pero sólo como rivales de relleno, no como liga jugable).
  'Primera División (Chile)': {
    ncMin: 60, ncMax: 70, presupuestoEnNcMin: 2_000_000, presupuestoEnNcMax: 25_000_000, multiplicadorSalarial: 0.015,
  },
  'Primera División (Uruguay)': {
    ncMin: 60, ncMax: 72, presupuestoEnNcMin: 2_000_000, presupuestoEnNcMax: 22_000_000, multiplicadorSalarial: 0.015,
  },
  'Categoría Primera A': {
    ncMin: 60, ncMax: 72, presupuestoEnNcMin: 2_500_000, presupuestoEnNcMax: 30_000_000, multiplicadorSalarial: 0.015,
  },
  'Liga 1': {
    ncMin: 58, ncMax: 70, presupuestoEnNcMin: 2_000_000, presupuestoEnNcMax: 18_000_000, multiplicadorSalarial: 0.012,
  },
  'División Profesional': {
    ncMin: 57, ncMax: 70, presupuestoEnNcMin: 1_500_000, presupuestoEnNcMax: 15_000_000, multiplicadorSalarial: 0.01,
  },
  'LigaPro Serie A': {
    ncMin: 57, ncMax: 70, presupuestoEnNcMin: 1_500_000, presupuestoEnNcMax: 16_000_000, multiplicadorSalarial: 0.012,
  },
  'Primera División (Bolivia)': {
    ncMin: 57, ncMax: 68, presupuestoEnNcMin: 1_000_000, presupuestoEnNcMax: 10_000_000, multiplicadorSalarial: 0.01,
  },
  'Primera División (Venezuela)': {
    ncMin: 57, ncMax: 66, presupuestoEnNcMin: 1_000_000, presupuestoEnNcMax: 9_000_000, multiplicadorSalarial: 0.008,
  },
  // Pools de referencia (clubesOtrosConmebol.ts / clubesOtrasLigasEuropa.ts
  // / clubesSinLigaFifa.ts) — no están en data/ligas.ts como liga
  // seleccionable, pero se agregan acá con la misma clave que su
  // comentario de archivo por si el motor de copas (Libertadores /
  // Sudamericana / Europa League / Conference League) termina llamando a
  // generarClub con estos clubes como rivales.
  'Otros CONMEBOL': {
    ncMin: 61, ncMax: 72, presupuestoEnNcMin: 3_000_000, presupuestoEnNcMax: 20_000_000, multiplicadorSalarial: 0.01,
  },
  'Otras ligas de Europa': {
    ncMin: 56, ncMax: 72, presupuestoEnNcMin: 4_000_000, presupuestoEnNcMax: 35_000_000, multiplicadorSalarial: 0.05,
  },
  'Clubes sin liga en FIFA': {
    ncMin: 42, ncMax: 68, presupuestoEnNcMin: 500_000, presupuestoEnNcMax: 10_000_000, multiplicadorSalarial: 0.03,
  },
};

// Fallback genérico por si alguna liga nueva se agrega a data/ligas.ts sin
// actualizar esta tabla — mejor un número razonable que romper o dar
// presupuesto 0.
const ECONOMIA_DEFAULT: ConfigEconomicaLiga = {
  ncMin: 40, ncMax: 99, presupuestoEnNcMin: 1_000_000, presupuestoEnNcMax: 150_000_000, multiplicadorSalarial: 0.05,
};

function configDeLiga(nombreLiga: string | undefined): ConfigEconomicaLiga {
  if (!nombreLiga) return ECONOMIA_DEFAULT;
  return ECONOMIA_POR_LIGA[nombreLiga] ?? ECONOMIA_DEFAULT;
}

// Interpola linealmente entre el piso y el techo de la liga según dónde
// cae el nc del club — un club a mitad de tabla de nc cobra
// aproximadamente la mitad entre el presupuesto del más chico y el más
// grande de su liga. Es una simplificación (la realidad es más una curva
// que se dispara arriba de todo, ver Real Madrid/Barcelona vs el resto de
// LaLiga) pero alcanza para que dos clubes de la misma liga con nc
// distinto tengan presupuestos claramente distintos, y para que la misma
// liga en su conjunto quede en el orden de magnitud real.
//
// Exportada (no sólo de uso interno) porque economia.ts la necesita para
// calcularTaquilla/calcularPremio — el "cuánto gana este club por
// temporada" vive ahí junto con el resto de la economía de fin de
// temporada, esta tabla sólo se ocupa de la escala por liga.
export function escalaEconomica(nc: number, nombreLiga: string | undefined): number {
  const cfg = configDeLiga(nombreLiga);
  if (cfg.ncMax === cfg.ncMin) return cfg.presupuestoEnNcMax;
  const t = clamp((nc - cfg.ncMin) / (cfg.ncMax - cfg.ncMin), 0, 1);
  return cfg.presupuestoEnNcMin + t * (cfg.presupuestoEnNcMax - cfg.presupuestoEnNcMin);
}

// Caja inicial del club al arrancar una partida nueva — una fracción del
// ingreso anual típico de ese club (ningún club arranca con un año entero
// de ingresos en el banco, pero tampoco arranca en cero).
//
// CORRECCIÓN (pedido explícito: "arreglar los precios de los jugadores y
// el presupuesto de los clubes" — investigación previa confirmó que, con
// una fracción FIJA para toda la liga, ni el club más rico de la Liga
// Profesional (nc75, tipo Boca/River) podía pagar a un jugador de su
// propio nivel con TODA su caja inicial: presupuesto ~$16.5M vs.
// valorMercado ~$25.6M de un mediocampista nc75, ratio 0.64 — el mercado
// de compras quedaba de facto cerrado incluso para el mejor equipo del
// país, no sólo para los chicos). La fracción ahora ESCALA con qué tan
// arriba está el club dentro del rango de nc de SU PROPIA liga (mismo `t`
// que ya usa escalaEconomica) — el piso de cada liga se queda exactamente
// igual que antes (0.3, sigue sin poder comprar casi nada, a propósito:
// "vende, no compra"), pero el techo pasa a guardar más del doble de
// margen relativo, como en la vida real (un club grande tiene mucha más
// capacidad de reforzarse — caja, deuda, prepago de sponsors — que uno
// chico de la misma liga, no sólo proporcionalmente más ingreso). Esto
// NO toca `escalaEconomica` en sí (economia.ts la sigue usando tal cual
// para taquilla/premio de fin de temporada, sin cambios).
const FRACCION_RESERVA_MIN = 0.3;
const FRACCION_RESERVA_MAX = 0.65;

export function presupuestoInicial(nc: number, nombreLiga: string | undefined): number {
  const cfg = configDeLiga(nombreLiga);
  const t = cfg.ncMax === cfg.ncMin ? 1 : clamp((nc - cfg.ncMin) / (cfg.ncMax - cfg.ncMin), 0, 1);
  const fraccion = FRACCION_RESERVA_MIN + t * (FRACCION_RESERVA_MAX - FRACCION_RESERVA_MIN);
  return Math.round(escalaEconomica(nc, nombreLiga) * fraccion * randomUniforme(0.8, 1.2));
}

export function multiplicadorSalarialDeLiga(nombreLiga: string | undefined): number {
  return configDeLiga(nombreLiga).multiplicadorSalarial;
}
