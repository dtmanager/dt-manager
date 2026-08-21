// Motor puro de generación y evolución de jugadores (sección 4 y 7 de la
// spec). No conoce React ni el store — sólo toma datos y devuelve datos.

import type { Jugador, Posicion, PiernaHabil } from '../types';
import { clamp, randomEntero, randomNormal, randomTriangular, randomUniforme } from './random';
import { generarSubStats, generarSubStatsArquero } from './subStats';

// Distribución realista de pierna hábil (~75-80% diestros en la población
// futbolística general) — se sortea una sola vez al nacer el jugador, no
// depende de la posición ni del grl.
function generarPiernaHabil(): PiernaHabil {
  const r = Math.random();
  if (r < 0.77) return 'derecha';
  if (r < 0.97) return 'izquierda';
  return 'ambidiestro';
}

// Recalibrado a las 10 posiciones granulares (ver types/index.ts) desde el
// viejo FACTOR_POSICION de 4 valores — mismo rango (0.85-1.15) pero ahora
// diferenciando roles ofensivos/creativos (que el mercado real paga más:
// extremos y enganches) de los puramente defensivos, en vez de que todo
// "DEF" o todo "MED" valiera lo mismo sin importar el rol.
const FACTOR_POSICION: Record<Posicion, number> = {
  ARQ: 0.85,
  DFC: 0.9,
  LI: 0.97,
  LD: 0.97,
  MCD: 0.98,
  MC: 1.03,
  MCO: 1.1,
  EI: 1.12,
  ED: 1.12,
  DEL: 1.18,
};

// La tabla de la spec da rangos por franja de edad (ej. "1.30–1.50") sin
// fórmula de interpolación — usamos el punto medio de cada rango como valor
// determinístico, para que valorMercado sea reproducible/testeable.
function factorEdadValor(edad: number): number {
  if (edad <= 21) return 1.4;
  if (edad <= 25) return 1.15;
  if (edad <= 29) return 1.0;
  if (edad <= 32) return 0.75;
  if (edad <= 35) return 0.5;
  return 0.3;
}

// Recalibrado contra valores reales de mercado (pedido explícito —
// investigación de Transfermarkt/Deloitte, ver economiaLigas.ts para el
// resto de la investigación de presupuestos/salarios). La curva vieja
// (3000 * e^0.1834(grl-40)) daba un techo razonable en grl99 (~$150M, cerca
// de los ~$180-200M de Mbappé/Haaland/Bellingham/Yamal en 2025) pero se
// quedaba entre 8x y 16x corto en el resto de la curva — un grl75 (un
// buen titular de mitad de tabla top-5 europeo) daba ~$1,8M cuando en la
// realidad ronda los $18-30M. Estos dos constantes se recalibraron con dos
// anclas reales (grl70≈$9M, grl82≈$65M, Transfermarkt) y el resultado se
// clampea con MAX_VALOR_MERCADO — sin el clamp, la exponencial se dispara
// mucho más arriba de grl90 de lo que corresponde (los mejores jugadores
// del mundo están todos apretados en una banda de ~$150-220M, no hay un
// salto proporcional de grl90 a grl99 como sí lo hay de grl60 a grl70).
const VALOR_BASE_A = 64_000;
const VALOR_BASE_K = 0.1647;
export const MAX_VALOR_MERCADO = 220_000_000;

export function valorBase(grl: number): number {
  return VALOR_BASE_A * Math.exp(VALOR_BASE_K * (grl - 40));
}

export function calcularValorMercado(jugador: Pick<Jugador, 'grl' | 'edad' | 'pot' | 'posicion'>): number {
  const factorPotencial = clamp(1 + (jugador.pot - jugador.grl) * 0.02, 1.0, 1.6);
  const bruto = valorBase(jugador.grl) * factorEdadValor(jugador.edad) * factorPotencial * FACTOR_POSICION[jugador.posicion];
  return Math.round(Math.min(bruto, MAX_VALOR_MERCADO));
}

// -------------------- 4.1 generación inicial --------------------

// La spec pide desvío=7 sin tope de desvío, pero eso deja salir jugadores
// con GRL muy por arriba del NC del club de vez en cuando (poco realista:
// un club de NC 68 con algún jugador de 90+). Se ajustó a pedido: desvío
// más chico (5) + un tope duro de ±14 sobre el NC, así el plantel se
// siente más parejo con el nivel del club sin perder variedad.
export function generarGrlInicial(nc: number, tope = 99): number {
  const bruto = nc + randomNormal(0, 5);
  return Math.round(clamp(bruto, Math.max(40, nc - 14), Math.min(tope, nc + 14)));
}

export function generarEdadPlantelInicial(): number {
  return Math.round(randomTriangular(17, 24, 35));
}

// Márgenes de potencial recortados a ~65% de los de la spec (10-20 →
// 6-14, etc.) por el mismo pedido de realismo — el potencial se sentía
// demasiado inflado sobre el GRL para jugadores jóvenes.
function margenPotencial(edad: number): [number, number] {
  if (edad <= 21) return [6, 14];
  if (edad <= 25) return [3, 8];
  if (edad <= 29) return [0, 3];
  return [0, 0];
}

export function generarPotencial(
  grlInicial: number,
  edad: number,
  probJoya: number,
): { pot: number; esJoya: boolean } {
  const [margenMin, margenMax] = margenPotencial(edad);
  let min = margenMin;
  let max = margenMax;
  let esJoya = false;

  // Bonus de joya (recortado junto con margenPotencial, ver nota arriba):
  // un único monto aleatorio que corre todo el margen hacia arriba,
  // independiente del NC del club.
  if (edad <= 21 && Math.random() < probJoya) {
    esJoya = true;
    const bonus = randomUniforme(10, 20);
    min += bonus;
    max += bonus;
  }

  const pot = Math.round(clamp(grlInicial + randomUniforme(min, max), grlInicial, 99));
  return { pot, esJoya };
}

export interface OpcionesGeneracionJugador {
  id: string;
  nombre: string;
  posicion: Posicion;
  edad: number;
  nc: number;
  grlTope?: number; // 99 default, canteranos usan 90
  probJoyaMin?: number; // 0.015 default, canteranos 0.025
  probJoyaMax?: number; // 0.025 default, canteranos 0.045
  conContrato?: boolean; // true default — canteranos se generan sin contrato (son libres hasta que se fichan)
  multiplicadorLiga?: number; // multiplicadorSalarial de la liga del club — ver calcularSalario
}

// Recalibrado (pedido explícito, ver economiaLigas.ts): la spec no daba
// fórmula de salario y el 1-2% flat que había no distinguía de qué liga es
// el club — un jugador de valorMercado $10M cobraba lo mismo en Premier
// League que en Liga Profesional, que no tiene nada que ver con la
// realidad (un jugador de Primera División argentina que "vale" eso en el
// mercado internacional cobra ahí una fracción mínima de esa cifra —
// exactamente por eso el club lo termina vendiendo afuera en cuanto puede,
// no reteniéndolo con un sueldo acorde). Ahora el salario depende del
// multiplicadorSalarial de la liga del club (0.16 en Premier League, 0.012
// en Liga Profesional, etc. — ver ECONOMIA_POR_LIGA), no de un porcentaje
// fijo global. `multiplicadorLiga` es opcional (con default) para no
// romper los call-sites/tests que todavía no pasan el club/liga.
export const MULTIPLICADOR_SALARIAL_DEFAULT = 0.06;

export function calcularSalario(valorMercado: number, multiplicadorLiga = MULTIPLICADOR_SALARIAL_DEFAULT): number {
  return Math.round(valorMercado * multiplicadorLiga * randomUniforme(0.85, 1.15));
}

// Rareza de "joya" recalibrada contra datos reales (pedido explícito —
// investigación: sólo ~4% de los prospectos de academia juvenil de LaLiga
// llegan a la élite profesional en una década de seguimiento, University of
// Essex/Jason Moran; en Inglaterra apenas ~0.5% de TODOS los que entran a
// una academia juvenil llegan a tener carrera profesional, VESTIAIRES). Las
// probabilidades viejas (3-5% base, 5-8% canterano) hacían que casi
// cualquier plantel tuviera una joya asegurada temporada tras temporada —
// ahora es un evento más raro, y además la joya generada ya no garantiza
// nada por sí sola: el estancamiento y la lesión grave en evolucionarGrl
// pueden hacer que ni siquiera una joya llegue a su potencial.
export function generarJugador(opts: OpcionesGeneracionJugador): Jugador {
  const grlTope = opts.grlTope ?? 99;
  const probJoyaMin = opts.probJoyaMin ?? 0.015;
  const probJoyaMax = opts.probJoyaMax ?? 0.025;
  const conContrato = opts.conContrato ?? true;

  const grl = generarGrlInicial(opts.nc, grlTope);
  const probJoya = randomUniforme(probJoyaMin, probJoyaMax);
  const { pot, esJoya } = generarPotencial(grl, opts.edad, probJoya);

  const jugador: Jugador = {
    id: opts.id,
    nombre: opts.nombre,
    edad: opts.edad,
    posicion: opts.posicion,
    grl,
    pot,
    valorMercado: 0,
    clubId: null,
    esJoya,
    historialGrl: [],
    contratoAniosRestantes: 0,
    salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    partidosLesionRestantes: 0,
    subStats: generarSubStats(grl, opts.posicion),
    subStatsArquero: opts.posicion === 'ARQ' ? generarSubStatsArquero(grl) : undefined,
    piernaHabil: generarPiernaHabil(),
  };
  jugador.valorMercado = calcularValorMercado(jugador);
  if (conContrato) {
    jugador.contratoAniosRestantes = randomEntero(1, 4);
    jugador.salario = calcularSalario(jugador.valorMercado, opts.multiplicadorLiga);
  }
  return jugador;
}

// Sistema de dorsales (pedido explícito, v2: "que sea realista... del 1 al
// 11 dependiendo las posiciones y despues del 12 al 26 los suplentes") —
// único dentro de UN plantel, no una propiedad fija del jugador (dos
// clubes distintos pueden compartir número sin problema).
//
// Números "clásicos" 1-11 por posición (la vieja numeración de antes de
// que existiera el dorsal libre por squad number) — cada lista tiene más
// de una opción porque una misma posición puede tener más de un titular
// (ej. 2 DFC en una línea de 4): el primero se queda con el primer número
// libre de la lista, el siguiente cae al próximo. El ORDEN de las claves
// importa — es el mismo que recorre asignarDorsalesPlantel, pensado para
// que la formación 4-4-2 por default (ver TITULARES_POR_POSICION en
// liga.ts: 1 ARQ, 2 DFC, 1 LI, 1 LD, 2 MC, 1 EI, 1 ED, 2 DEL) cubra 1-11
// exacto sin ningún choque. Formaciones custom (con MCD/MCO titular, o 3
// DFC de línea) pueden agotar la lista preferida — ahí cae al primer
// número libre entre 1-11 igual, y sólo si ni eso hay (no debería pasar
// con 11 titulares) se va a la zona de suplentes.
const NUMEROS_PREFERIDOS_POR_POSICION: Record<Posicion, number[]> = {
  ARQ: [1, 12, 22, 30],
  DFC: [4, 5, 6, 15, 16],
  LI: [3, 14, 15],
  LD: [2, 13, 17],
  MCD: [6, 5, 14, 16],
  MC: [8, 6, 17, 18],
  MCO: [10, 8, 20, 21],
  EI: [11, 7, 18, 19],
  ED: [7, 11, 19, 20],
  DEL: [9, 10, 11, 7],
};

function primerLibreEnLista(usados: Set<number>, candidatos: number[]): number | undefined {
  return candidatos.find((n) => !usados.has(n));
}

function primerLibreEnRango(usados: Set<number>, desde: number, hasta: number): number | undefined {
  for (let n = desde; n <= hasta; n += 1) {
    if (!usados.has(n)) return n;
  }
  return undefined;
}

// Se llama UNA sola vez, al armar el plantel inicial de un club, con el 11
// titular ya decidido (armarAlineacionInicial en liga.ts) — MUTA
// jugador.dorsal en cada elemento de `plantel`. No se recalcula si el
// usuario cambia de formación después: en la vida real el dorsal no
// cambia cada vez que el DT arma un 11 distinto, es fijo por temporada
// (para eso está `cambiarDorsal` en el store, que deja al usuario
// reasignarlo a mano cuando quiera — pedido explícito).
export function asignarDorsalesPlantel(plantel: Jugador[], titularesIds: string[]): void {
  const usados = new Set<number>();
  const titularesSet = new Set(titularesIds);

  (Object.keys(NUMEROS_PREFERIDOS_POR_POSICION) as Posicion[]).forEach((posicion) => {
    plantel
      .filter((j) => titularesSet.has(j.id) && j.posicion === posicion)
      .forEach((jugador) => {
        const numero = primerLibreEnLista(usados, NUMEROS_PREFERIDOS_POR_POSICION[posicion])
          ?? primerLibreEnRango(usados, 1, 11)
          ?? primerLibreEnRango(usados, 12, 99)
          ?? 1;
        jugador.dorsal = numero;
        usados.add(numero);
      });
  });

  plantel
    .filter((j) => !titularesSet.has(j.id))
    .forEach((jugador) => {
      const numero = primerLibreEnRango(usados, 12, 99) ?? primerLibreEnRango(usados, 1, 99) ?? 1;
      jugador.dorsal = numero;
      usados.add(numero);
    });
}

// Resto de los casos (pedido explícito, ver comentario grande arriba): un
// jugador que se suma a un plantel YA arrancado — fichaje de canterano o
// transferencia — no dispara un reparto completo, sólo necesita un número
// propio. Intenta primero el clásico de su posición (por si quedó libre,
// ej. se vendió al titular de esa camiseta), si no cae a la zona de
// suplentes (12+, mismo criterio que asignarDorsalesPlantel) y sólo si el
// plantel ya está completísimo (no debería pasar con ~26 jugadores) cae a
// cualquier libre entre 1-99.
export function asignarDorsalLibre(plantel: Jugador[], posicion?: Posicion): number {
  const usados = new Set(plantel.map((j) => j.dorsal).filter((d): d is number => d != null));
  if (posicion) {
    const preferido = primerLibreEnLista(usados, NUMEROS_PREFERIDOS_POR_POSICION[posicion]);
    if (preferido != null) return preferido;
  }
  return primerLibreEnRango(usados, 12, 99) ?? primerLibreEnRango(usados, 1, 99) ?? 1;
}

// -------------------- 7. canteranos --------------------

export function generarCanterano(id: string, nombre: string, posicion: Posicion, ncClub: number): Jugador {
  return generarJugador({
    id,
    nombre,
    posicion,
    edad: Math.round(randomUniforme(15, 17)),
    nc: ncClub - 15,
    grlTope: 90,
    probJoyaMin: 0.025,
    probJoyaMax: 0.045,
    conContrato: false,
  });
}

// -------------------- 4.2 evolución de GRL --------------------

// Edad de pico por posición (pedido explícito de realismo — investigación:
// arqueros llegan a jugar hasta los 40+ y suelen picar más tarde, 29-33
// según jokermag.com; defensores/centrales son los que más lento declinan
// entre los de campo, 50% de decline recién a los 35.2 según
// macro-football.com; volantes pican ~27 (promedio de las 5 grandes ligas
// europeas es 27.4 general); delanteros y extremos son los que antes
// empiezan a bajar, ~26-27, con 50% de decline ya a los 31). Reemplaza el
// viejo corte fijo "edad < 28" para todas las posiciones por igual.
const EDAD_PICO: Record<Posicion, number> = {
  ARQ: 31,
  DFC: 30, // centrales, junto a los arqueros, son los que más aguantan
  LI: 28,
  LD: 28,
  MCD: 29, // volante de contención: juego posicional, no depende de ritmo
  MC: 28,
  MCO: 27,
  EI: 26, // extremos: los que antes pierden el pico por depender de ritmo
  ED: 26,
  DEL: 27,
};

// Multiplicador de velocidad de declive por posición, aplicado sobre los
// mismos "años desde el pico" para todas las posiciones (ver
// tasaBaseDeclive). Arqueros declinan más lento (carreras largas, Buffon
// jugó hasta los 45), delanteros/extremos más rápido (pierden ritmo antes).
const FACTOR_DECLIVE_POSICION: Record<Posicion, number> = {
  ARQ: 0.55,
  DFC: 0.7,
  LI: 0.85,
  LD: 0.85,
  MCD: 0.75,
  MC: 0.9,
  MCO: 1.0,
  EI: 1.25, // dependen más del ritmo, son los que antes se caen
  ED: 1.25,
  DEL: 1.15,
};

function tasaBaseCrecimiento(edad: number): number {
  if (edad <= 20) return randomUniforme(3, 6);
  if (edad <= 23) return randomUniforme(2, 4);
  return randomUniforme(-1, 1); // resto del crecimiento, previo al pico
}

// aniosPasadoPico: edad - edadPico(posicion), no edad absoluta — así el
// mismo esquema de bandas se aplica corrido en el tiempo según cuándo picó
// cada posición (ver EDAD_PICO/FACTOR_DECLIVE_POSICION).
function tasaBaseDeclive(aniosPasadoPico: number): number {
  if (aniosPasadoPico <= 2) return randomUniforme(1, 2);
  if (aniosPasadoPico <= 5) return randomUniforme(2, 4);
  return randomUniforme(4, 7);
}

// Riesgo de estancamiento (pedido explícito de realismo/dificultad): cada
// temporada de crecimiento hay una chance de que el jugador NO mejore nada
// esa temporada — sin esto, todo jugador con gap a su potencial lo iba
// cerrando de forma prácticamente garantizada temporada tras temporada, lo
// cual no refleja el altísimo "bust rate" real de las promesas juveniles
// (sólo ~4% de los prospectos de academia llegan a la élite en una década,
// Univ. of Essex/Jason Moran). El DT con buen "desarrollo" reduce el
// riesgo; uno malo lo aumenta.
const PROB_ESTANCAMIENTO_BASE = 0.18;

function probEstancamiento(dtDesarrollo?: number): number {
  if (dtDesarrollo == null) return PROB_ESTANCAMIENTO_BASE;
  const factor = 1 - (dtDesarrollo - 50) / 100; // desarrollo 50 → 1x, 99 → ~0.51x, 0 → 1.5x
  return clamp(PROB_ESTANCAMIENTO_BASE * factor, 0.05, 0.3);
}

// Riesgo de lesión grave (pedido explícito): raro (~2%/temporada, sólo
// jugadores <=23) pero permanente — a diferencia del resto de la
// variabilidad de esta función, que sólo afecta el grl de la temporada,
// una lesión grave le baja el TECHO (potencial) al jugador para siempre.
// Es la otra pata (junto con el estancamiento) de que una "joya" marcada al
// nacer no sea una garantía de crack futuro.
const PROB_LESION_GRAVE = 0.02;

export interface ResultadoEvolucion {
  grl: number;
  pot: number;
  huboExplosion: boolean;
  huboEstancamiento: boolean;
  huboLesionGrave: boolean;
}

// dtDesarrollo: stat 'desarrollo' del DT del club del jugador (sólo aplica
// a jugadores <= 23 años de ese plantel). Pasar undefined si no corresponde
// (jugador libre, o DT sin ese bonus).
export function evolucionarGrl(
  grl: number,
  pot: number,
  edad: number,
  posicion: Posicion,
  dtDesarrollo?: number,
): ResultadoEvolucion {
  const edadPico = EDAD_PICO[posicion];

  let delta: number;
  let huboEstancamiento = false;
  if (edad < edadPico) {
    if (Math.random() < probEstancamiento(dtDesarrollo)) {
      huboEstancamiento = true;
      delta = 0;
    } else {
      const gap = pot - grl;
      const tasa = tasaBaseCrecimiento(edad);
      delta = gap <= 0 ? 0 : Math.min(tasa, gap) * randomUniforme(0.7, 1.3);
    }
  } else {
    const aniosPasadoPico = edad - edadPico;
    delta = -tasaBaseDeclive(aniosPasadoPico) * FACTOR_DECLIVE_POSICION[posicion] * randomUniforme(0.7, 1.3);
  }

  let huboExplosion = false;
  if (edad <= 23 && Math.random() < 0.02) {
    huboExplosion = true;
    delta += randomUniforme(8, 15);
  }

  let huboLesionGrave = false;
  let potNuevo = pot;
  if (edad <= 23 && Math.random() < PROB_LESION_GRAVE) {
    huboLesionGrave = true;
    delta -= randomUniforme(2, 5);
  }

  if (edad <= 23 && dtDesarrollo != null) {
    delta += (dtDesarrollo - 50) / 50;
  }

  const nuevoGrl = Math.round(clamp(grl + delta, 40, 99));

  if (huboLesionGrave) {
    const perdida = randomUniforme(4, 10);
    potNuevo = Math.round(clamp(pot - perdida, nuevoGrl, 99));
  }

  return {
    grl: nuevoGrl,
    pot: potNuevo,
    huboExplosion,
    huboEstancamiento,
    huboLesionGrave,
  };
}

export function debeRetirarse(edad: number, grl: number): boolean {
  if (edad >= 40) return true;
  if (edad >= 36 && grl < 65) return true;
  return false;
}
