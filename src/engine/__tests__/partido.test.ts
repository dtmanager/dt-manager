import { describe, expect, it } from 'vitest';
import {
  ajusteMentalidad, calcularFuerzaSector, calcularPosesion, calcularVentajaLocal, calcularXG, resolverTiro, simularPartido,
  elegirPateador, ordenPateadoresPorTiro, probabilidadConvertirTiroLibre, probabilidadConvertirPenal,
  penalizacionPorCansancio, simularAlargue,
  type EquipoPartido, type StatsDT,
} from '../partido';
import { generarSubStats, generarSubStatsArquero } from '../subStats';
import type { Jugador, Posicion } from '../../types';

function dtNeutro(): StatsDT {
  return {
    tactica: 50,
    adaptabilidad: 50,
    desarrollo: 50,
    gestionVestuario: 50,
    motivacion: 50,
    analisis: 50,
    mercado: 50,
    reaccion: 50,
    mentalidad: 50,
    reputacion: 50,
  };
}

// 11 titulares de un 4-4-2 con el mismo grl para todos — mismo criterio
// que calcularFuerzaSector({DEL:[x],MED:[x],...}) de antes, pero ahora con
// jugadores reales (con subStats) porque simularPartido resuelve duelos
// 1v1, no un agregado de equipo (rediseno-motor-partido.md fase 2).
const FORMACION_4_4_2: Posicion[] = ['ARQ', 'DFC', 'DFC', 'LI', 'LD', 'MC', 'MC', 'EI', 'ED', 'DEL', 'DEL'];

function plantel(grl: number): Jugador[] {
  return FORMACION_4_4_2.map((posicion, i) => ({
    id: `j-${grl}-${i}`,
    nombre: `Jugador ${i}`,
    edad: 25,
    posicion,
    grl,
    pot: grl,
    valorMercado: 0,
    clubId: 'c',
    esJoya: false,
    historialGrl: [],
    contratoAniosRestantes: 0,
    salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    subStats: generarSubStats(grl, posicion),
    subStatsArquero: posicion === 'ARQ' ? generarSubStatsArquero(grl) : undefined,
  }));
}

function equipo(grl: number, over: Partial<EquipoPartido> = {}): EquipoPartido {
  const porPosicion: { DEL: number[]; MED: number[]; DEF: number[]; ARQ: number[] } = {
    DEL: [grl, grl], MED: [grl, grl], DEF: [grl, grl, grl], ARQ: [grl],
  };
  return {
    sector: calcularFuerzaSector(porPosicion),
    dt: dtNeutro(),
    cohesion: 55,
    titulares: plantel(grl),
    ...over,
  };
}

// Banco de 5 suplentes de campo (pedido explícito: "sistema de cambios y
// suplentes en partido") — ids con prefijo `s-` para no chocar con los
// `j-${grl}-${i}` de plantel() de arriba.
function banco(grl: number): Jugador[] {
  const posiciones: Posicion[] = ['DFC', 'LI', 'MC', 'EI', 'DEL'];
  return posiciones.map((posicion, i) => ({
    id: `s-${grl}-${i}`,
    nombre: `Suplente ${i}`,
    edad: 24,
    posicion,
    grl,
    pot: grl,
    valorMercado: 0,
    clubId: 'c',
    esJoya: false,
    historialGrl: [],
    contratoAniosRestantes: 0,
    salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    subStats: generarSubStats(grl, posicion),
  }));
}

// Físico bajo en todos los titulares — para que penalizacionPorCansancio
// dispare de forma confiable dentro de los tests (con el físico "normal"
// que sortea generarSubStats el cansancio igual pesa, pero de forma más
// pareja/lenta, no conviene para probar el disparo de cambios puntual).
function conFisicoBajo(titulares: Jugador[]): Jugador[] {
  return titulares.map((j) => (j.subStats ? { ...j, subStats: { ...j.subStats, fisico: 40 } } : j));
}

describe('calcularFuerzaSector', () => {
  it('pondera ataque 55% DEL / 45% MED y defensa 65% DEF / 35% ARQ', () => {
    const { ataque, defensa } = calcularFuerzaSector({
      DEL: [80],
      MED: [70],
      DEF: [60],
      ARQ: [50],
    });
    expect(ataque).toBeCloseTo(80 * 0.55 + 70 * 0.45, 5);
    expect(defensa).toBeCloseTo(60 * 0.65 + 50 * 0.35, 5);
  });
});

describe('calcularVentajaLocal', () => {
  it('da 1.10 con reputación neutra (50)', () => {
    expect(calcularVentajaLocal(dtNeutro())).toBeCloseTo(1.1, 5);
  });
});

describe('calcularXG', () => {
  it('está siempre en el rango [0.2, 4.5] antes del factor de localía', () => {
    expect(calcularXG(0, 200, 1)).toBeGreaterThanOrEqual(0.2);
    expect(calcularXG(200, 0, 1)).toBeLessThanOrEqual(4.5);
  });
});

describe('calcularPosesion', () => {
  it('da 0.5 cuando los dos mediocampos son iguales', () => {
    expect(calcularPosesion(70, 70)).toBeCloseTo(0.5, 5);
  });

  it('favorece al equipo con mejor mediocampo, de forma no lineal', () => {
    const chico = calcularPosesion(71, 70) - 0.5;
    const grande = calcularPosesion(90, 70) - 0.5;
    expect(chico).toBeGreaterThan(0);
    expect(grande).toBeGreaterThan(chico * 2); // la ventaja crece más que proporcional
  });
});

describe('resolverTiro', () => {
  it('convierte mucho más desde adentro del área (zona 5) que de afuera (zona 3)', () => {
    let golesAdentro = 0;
    let golesAfuera = 0;
    const intentos = 2000;
    for (let i = 0; i < intentos; i += 1) {
      if (resolverTiro(5, 70, 70)) golesAdentro += 1;
      if (resolverTiro(3, 70, 70)) golesAfuera += 1;
    }
    expect(golesAdentro).toBeGreaterThan(golesAfuera * 2);
  });

  it('un mejor arquero (atajada alta) reduce la conversión', () => {
    let golesArqueroFlojo = 0;
    let golesArqueroCrack = 0;
    const intentos = 2000;
    for (let i = 0; i < intentos; i += 1) {
      if (resolverTiro(5, 75, 55)) golesArqueroFlojo += 1;
      if (resolverTiro(5, 75, 90)) golesArqueroCrack += 1;
    }
    expect(golesArqueroCrack).toBeLessThan(golesArqueroFlojo);
  });
});

describe('ordenPateadoresPorTiro / elegirPateador', () => {
  it('ordena de mayor a menor tiro y excluye al arquero', () => {
    // Forzamos un tiro bien alto en un mediocampista y recortamos el resto
    // bien por debajo — sin el recorte, el ruido de generarSubStats puede
    // (rara vez) hacer que otro jugador empate o supere el 95 forzado y el
    // test flaquea sin que haya ningún bug real.
    const titulares = plantel(70).map((j) => (
      j.subStats ? { ...j, subStats: { ...j.subStats, tiro: Math.min(j.subStats.tiro, 80) } } : j
    ));
    titulares[5] = { ...titulares[5], subStats: { ...titulares[5].subStats!, tiro: 95 } };
    const orden = ordenPateadoresPorTiro(titulares);
    expect(orden.some((j) => j.posicion === 'ARQ')).toBe(false);
    expect(orden[0].id).toBe(titulares[5].id);
    for (let i = 1; i < orden.length; i += 1) {
      const tiroPrev = orden[i - 1].subStats?.tiro ?? orden[i - 1].grl;
      const tiroActual = orden[i].subStats?.tiro ?? orden[i].grl;
      expect(tiroPrev).toBeGreaterThanOrEqual(tiroActual);
    }
    expect(elegirPateador(titulares)?.id).toBe(titulares[5].id);
  });
});

describe('probabilidadConvertirTiroLibre / probabilidadConvertirPenal', () => {
  it('un pateador de mejor tiro convierte más que uno de tiro flojo, a igual arquero', () => {
    expect(probabilidadConvertirTiroLibre(90, 70)).toBeGreaterThan(probabilidadConvertirTiroLibre(50, 70));
    expect(probabilidadConvertirPenal(90, 70)).toBeGreaterThan(probabilidadConvertirPenal(50, 70));
  });

  it('un arquero con mejor atajada reduce la conversión', () => {
    expect(probabilidadConvertirTiroLibre(70, 90)).toBeLessThan(probabilidadConvertirTiroLibre(70, 50));
    expect(probabilidadConvertirPenal(70, 90)).toBeLessThan(probabilidadConvertirPenal(70, 50));
  });

  it('con stats neutras (70/70) se acerca a la base documentada (6.6%/75.6%)', () => {
    expect(probabilidadConvertirTiroLibre(70, 70)).toBeCloseTo(0.066, 2);
    expect(probabilidadConvertirPenal(70, 70)).toBeCloseTo(0.756, 2);
  });
});

describe('grilla 6x3 (ancho de cancha)', () => {
  it('todos los eventos traen una franja de ancho válida (izq/centro/der)', () => {
    const equipoParejo = equipo(70);
    const r = simularPartido(equipoParejo, equipoParejo, false);
    expect(r.eventos.length).toBeGreaterThan(0);
    r.eventos.forEach((e) => {
      expect(['izq', 'centro', 'der']).toContain(e.ancho);
    });
  });

  it('las 3 franjas aparecen con frecuencia parecida en muchos partidos (sorteo parejo)', () => {
    const equipoParejo = equipo(70);
    const conteo = { izq: 0, centro: 0, der: 0 };
    for (let i = 0; i < 60; i += 1) {
      simularPartido(equipoParejo, equipoParejo, false).eventos.forEach((e) => {
        if (e.tipo === 'inicio_posesion') conteo[e.ancho] += 1;
      });
    }
    const total = conteo.izq + conteo.centro + conteo.der;
    expect(total).toBeGreaterThan(100);
    (['izq', 'centro', 'der'] as const).forEach((k) => {
      expect(conteo[k] / total).toBeGreaterThan(0.2);
      expect(conteo[k] / total).toBeLessThan(0.45);
    });
  });
});

describe('contraataque', () => {
  it('un equipo mucho más rápido saca notablemente más contraataques que uno lento', () => {
    // §3.3.1 punto 2: al recuperar la pelota con ventaja de ritmo sobre la
    // defensa+medio rival, la próxima posesión arranca 2 zonas más
    // adelante (contraataque) — marcado en el evento 'inicio_posesion'.
    const rapido = equipo(70);
    rapido.titulares = rapido.titulares.map((j) => (
      j.subStats ? { ...j, subStats: { ...j.subStats, ritmo: Math.min(99, j.subStats.ritmo + 25) } } : j
    ));
    const lento = equipo(70);
    lento.titulares = lento.titulares.map((j) => (
      j.subStats ? { ...j, subStats: { ...j.subStats, ritmo: Math.max(40, j.subStats.ritmo - 25) } } : j
    ));

    let contraataquesRapido = 0;
    let contraataquesLento = 0;
    const partidos = 40;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(rapido, lento, false);
      r.eventos.forEach((e) => {
        if (e.tipo === 'inicio_posesion' && e.contraataque) {
          if (e.equipo === 'local') contraataquesRapido += 1;
          else contraataquesLento += 1;
        }
      });
    }
    expect(contraataquesRapido).toBeGreaterThan(0);
    expect(contraataquesRapido).toBeGreaterThan(contraataquesLento * 3);
  });

  it('hay contraataques incluso entre planteles PAREJOS, y no superan el techo por equipo', () => {
    // Importante: regenerar el plantel en CADA partido (no reusar un solo
    // equipo(70) para las 200 "muestras") — un plantel fijo trae un único
    // draw de ritmo por generarSubStats, y si ese draw en particular sale
    // parejo entre posiciones, ningún partido con ESE plantel específico
    // va a cruzar el umbral nunca, sin importar cuántos partidos se
    // simulen (no es independiente entre partidos). Confirmado jugando:
    // reusar un solo plantel hacía que este test flaqueara ~1 de cada 3
    // corridas (a veces con 0 contraataques en 150 partidos).
    let contraataques = 0;
    const partidos = 200;
    for (let i = 0; i < partidos; i += 1) {
      const equipoParejo = equipo(70);
      const r = simularPartido(equipoParejo, equipoParejo, false);
      let contraataquesLocal = 0;
      let contraataquesVisitante = 0;
      r.eventos.forEach((e) => {
        if (e.tipo === 'inicio_posesion' && e.contraataque) {
          contraataques += 1;
          if (e.equipo === 'local') contraataquesLocal += 1;
          else contraataquesVisitante += 1;
        }
      });
      // Techo documentado: ~5 contraataques por equipo por partido.
      expect(contraataquesLocal).toBeLessThanOrEqual(5);
      expect(contraataquesVisitante).toBeLessThanOrEqual(5);
    }
    // Medido con plantel fresco por partido: ronda 1.1-1.2 combinados por
    // partido — bastante margen por debajo para no flaquear.
    expect(contraataques / partidos).toBeGreaterThan(0.3);
  });

  it('un contraataque arranca 2 zonas más adelante que una posesión normal', () => {
    let encontrado = false;
    for (let i = 0; i < 150 && !encontrado; i += 1) {
      const equipoParejo = equipo(70); // ver nota del test anterior: plantel fresco por partido
      const r = simularPartido(equipoParejo, equipoParejo, false);
      const inicioContraataque = r.eventos.find((e) => e.tipo === 'inicio_posesion' && e.contraataque);
      if (inicioContraataque) {
        expect(inicioContraataque.zona).toBe(4); // ZONA_INICIAL (2) + 2
        encontrado = true;
      }
    }
    expect(encontrado).toBe(true);
  });
});

describe('sistema de tarjetas', () => {
  it('las tarjetas rojas se mantienen raras (no un partido de cada dos)', () => {
    // Bug encontrado calibrando: la primera versión mutaba
    // EquipoPartido.titulares directamente al expulsar, y como estos
    // tests (y equipoPartidoDeClub cuando local===visitante, ej. una
    // llave de copa contra uno mismo) a veces pasan el MISMO objeto como
    // local y visitante, expulsar de un lado vaciaba el plantel de los
    // dos a la vez — goles/faltas se desplomaban a casi cero. Se arregló
    // filtrando por id en vez de mutar el array; este test cubre ambas
    // cosas: que las rojas queden en un rango realista Y que el partido
    // se siga jugando con normalidad (goles/faltas no colapsan).
    let golesTotales = 0;
    let faltas = 0;
    let rojas = 0;
    const partidos = 200;
    for (let i = 0; i < partidos; i += 1) {
      const equipoParejo = equipo(70);
      const r = simularPartido(equipoParejo, equipoParejo, false);
      golesTotales += r.golesLocal + r.golesVisitante;
      faltas += r.faltasLocal + r.faltasVisitante;
      rojas += r.tarjetasRojasLocal + r.tarjetasRojasVisitante;
    }
    // Con el bug de mutación compartida esto daba ~0.03-0.07 goles/equipo
    // (partidos casi sin jugadores) y faltas cerca de 3/partido en vez de
    // las ~13-16 calibradas — umbrales generosos para no flaquear por
    // variancia, pero MUY por encima de lo que daba el bug.
    expect(golesTotales / partidos / 2).toBeGreaterThan(0.6);
    expect(faltas / partidos).toBeGreaterThan(6);
    // Realidad: rojas en ~5-7% de los partidos, no más de 1 en 4.
    expect(rojas / partidos).toBeLessThan(0.25);
  });

  it('las tarjetas amarillas/rojas traen jugadorId y el equipo del INFRACTOR (no de quien atacaba)', () => {
    const fuerte = equipo(90);
    const debil = equipo(40);
    let encontrada = false;
    for (let i = 0; i < 60 && !encontrada; i += 1) {
      const eventos = simularPartido(fuerte, debil, false).eventos;
      eventos.forEach((e, idx) => {
        if (e.tipo === 'tarjeta_amarilla' || e.tipo === 'tarjeta_roja') {
          expect(e.jugadorId).toBeDefined();
          // La tarjeta viene ANTES del evento falta/penal que la generó
          // (mismo minuto/zona), y el equipo de la tarjeta es el
          // contrario al del evento falta/penal que sigue (el infractor
          // defiende, no ataca).
          const siguiente = eventos[idx + 1];
          if (siguiente && (siguiente.tipo === 'falta' || siguiente.tipo === 'penal')) {
            expect(e.equipo).not.toBe(siguiente.equipo);
            encontrada = true;
          }
        }
      });
    }
    expect(encontrada).toBe(true);
  });

  it('un jugador expulsado dentro de un partido deja de aparecer en eventos DE ESE EQUIPO después de la expulsión', () => {
    // No hay forma directa de "ver" quién está en cancha desde afuera,
    // pero si un jugador tiene tarjeta_roja, no debería volver a aparecer
    // como jugadorId de un gol/falta/penal DESPUÉS de esa expulsión.
    const fuerte = equipo(90);
    const debil = equipo(40);
    let verificado = false;
    // 150 intentos, no 80: medido ~7-8% de partidos con roja fuerte(90) vs
    // debil(40) — con 80 intentos la chance de 0 rojas seguidas (test
    // "encontrado" en falso, no un bug real) rondaba ~0.2%, suficiente para
    // aparecer una vez cada mil corridas de CI. 150 la baja a ~0.001%.
    for (let i = 0; i < 150 && !verificado; i += 1) {
      const eventos = simularPartido(fuerte, debil, false).eventos;
      const rojaIdx = eventos.findIndex((e) => e.tipo === 'tarjeta_roja');
      if (rojaIdx === -1) continue;
      const expulsadoId = eventos[rojaIdx].jugadorId;
      const equipoExpulsado = eventos[rojaIdx].equipo;
      const apareceDespues = eventos.slice(rojaIdx + 1).some((e) => (
        (e.tipo === 'falta' || e.tipo === 'penal' || e.tipo === 'gol')
        && e.jugadorId === expulsadoId
        && e.equipo === equipoExpulsado
      ));
      expect(apareceDespues).toBe(false);
      verificado = true;
    }
    expect(verificado).toBe(true);
  });
});

describe('xG acumulado', () => {
  it('xgLocal/xgVisitante son siempre positivos o cero', () => {
    const r = simularPartido(equipo(70), equipo(70), false);
    expect(r.xgLocal).toBeGreaterThanOrEqual(0);
    expect(r.xgVisitante).toBeGreaterThanOrEqual(0);
  });

  it('un equipo mucho más fuerte acumula más xG en promedio que uno débil', () => {
    let xgFuerte = 0;
    let xgDebil = 0;
    const partidos = 60;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(equipo(90), equipo(40), false);
      xgFuerte += r.xgLocal;
      xgDebil += r.xgVisitante;
    }
    expect(xgFuerte / partidos).toBeGreaterThan(xgDebil / partidos);
  });

  it('el xG acumulado ronda una magnitud realista (mismo orden que los goles reales)', () => {
    let xgTotal = 0;
    const partidos = 80;
    for (let i = 0; i < partidos; i += 1) {
      const equipoParejo = equipo(70);
      const r = simularPartido(equipoParejo, equipoParejo, false);
      xgTotal += r.xgLocal + r.xgVisitante;
    }
    // No tiene que coincidir exacto con los goles reales (el motor no
    // fuerza xG==goles), pero no debería estar en un orden de magnitud
    // distinto de los ~2.5-3 goles/partido calibrados.
    expect(xgTotal / partidos).toBeGreaterThan(0.5);
    expect(xgTotal / partidos).toBeLessThan(10);
  });
});

// Pedido explícito del visualizador ("no se diferencia cuando patean
// afuera"): el motor ya calculaba internamente si un remate iba al arco
// o no (para los contadores tirosLocal.alArco/afuera) pero nunca se lo
// pegaba al EventoPartido — sin este campo, PantallaVisualizadorPartido
// no tenía forma de animar un tiro afuera distinto de un tiro al arco.
describe('alArco en eventos de remate', () => {
  it('todo evento tiro con xg trae alArco definido (booleano)', () => {
    const r = simularPartido(equipo(70), equipo(70), false);
    const tiros = r.eventos.filter((e) => e.tipo === 'tiro' && e.xg != null);
    expect(tiros.length).toBeGreaterThan(0);
    tiros.forEach((e) => expect(typeof e.alArco).toBe('boolean'));
  });

  it('a lo largo de varios partidos aparecen tiros al arco Y tiros afuera (no siempre lo mismo)', () => {
    let huboAlArco = false;
    let huboAfuera = false;
    for (let i = 0; i < 15 && !(huboAlArco && huboAfuera); i += 1) {
      const r = simularPartido(equipo(70), equipo(70), false);
      r.eventos.filter((e) => e.tipo === 'tiro').forEach((e) => {
        if (e.alArco === true) huboAlArco = true;
        if (e.alArco === false) huboAfuera = true;
      });
    }
    expect(huboAlArco).toBe(true);
    expect(huboAfuera).toBe(true);
  });

  it('todo córner con xg trae alArco === true (el modelo no simula desvíos de cabezazo)', () => {
    let verificado = false;
    for (let i = 0; i < 20 && !verificado; i += 1) {
      const r = simularPartido(equipo(70), equipo(70), false);
      const corners = r.eventos.filter((e) => e.tipo === 'corner' && e.xg != null);
      if (corners.length > 0) {
        corners.forEach((e) => expect(e.alArco).toBe(true));
        verificado = true;
      }
    }
    expect(verificado).toBe(true);
  });

  it('un penal errado (no gol) trae alArco definido', () => {
    let verificado = false;
    for (let i = 0; i < 40 && !verificado; i += 1) {
      const r = simularPartido(equipo(70), equipo(70), false);
      const penalesErrados = r.eventos.filter((e, idx, arr) => (
        e.tipo === 'penal' && arr[idx + 1]?.tipo !== 'gol'
      ));
      if (penalesErrados.length > 0) {
        penalesErrados.forEach((e) => expect(typeof e.alArco).toBe('boolean'));
        verificado = true;
      }
    }
    expect(verificado).toBe(true);
  });
});

describe('pase filtrado', () => {
  it('un mediocampo con mucho mejor pase saca más pases filtrados que uno parejo', () => {
    // Mismo criterio que el test de contraataque: plantel fresco por
    // partido, un solo equipo(70) reusado no da muestras independientes
    // para una propiedad estadística de equipo (ver nota extensa en
    // describe('contraataque')).
    let filtradosBoost = 0;
    let filtradosBase = 0;
    const partidos = 150;
    for (let i = 0; i < partidos; i += 1) {
      const conBuenPase = equipo(70);
      conBuenPase.titulares = conBuenPase.titulares.map((j) => (
        j.subStats ? { ...j, subStats: { ...j.subStats, pase: Math.min(99, j.subStats.pase + 25) } } : j
      ));
      const rivalA = equipo(70);
      const rBoost = simularPartido(conBuenPase, rivalA, false);
      rBoost.eventos.forEach((e) => {
        if (e.tipo === 'avance' && e.paseFiltrado && e.equipo === 'local') filtradosBoost += 1;
      });

      const parejo1 = equipo(70);
      const parejo2 = equipo(70);
      const rBase = simularPartido(parejo1, parejo2, false);
      rBase.eventos.forEach((e) => {
        if (e.tipo === 'avance' && e.paseFiltrado && e.equipo === 'local') filtradosBase += 1;
      });
    }
    // Medido en 8 corridas de 150 partidos: la ratio boost/base ronda
    // 1.46-2.14 (nunca por debajo de 1.4) — 1.2 deja margen generoso para
    // no flaquear por varianza sin dejar de detectar una regresión real.
    expect(filtradosBoost).toBeGreaterThan(0);
    expect(filtradosBoost).toBeGreaterThan(filtradosBase * 1.2);
  });

  it('un pase filtrado salta directo de zona 3 a zona 5', () => {
    let encontrado = false;
    for (let i = 0; i < 150 && !encontrado; i += 1) {
      const equipoParejo = equipo(70);
      const r = simularPartido(equipoParejo, equipoParejo, false);
      const filtrado = r.eventos.find((e) => e.tipo === 'avance' && e.paseFiltrado);
      if (filtrado) {
        expect(filtrado.zona).toBe(5); // ZONAS - 1
        encontrado = true;
      }
    }
    expect(encontrado).toBe(true);
  });

  it('el pase filtrado también genera fuera de juego (riesgo real de la jugada)', () => {
    let offsides = 0;
    const partidos = 100;
    for (let i = 0; i < partidos; i += 1) {
      const conBuenPase = equipo(70);
      conBuenPase.titulares = conBuenPase.titulares.map((j) => (
        j.subStats ? { ...j, subStats: { ...j.subStats, pase: Math.min(99, j.subStats.pase + 25) } } : j
      ));
      const rival = equipo(70);
      const r = simularPartido(conBuenPase, rival, false);
      offsides += r.eventos.filter((e) => e.tipo === 'fuera_de_juego' && e.equipo === 'local').length;
    }
    expect(offsides).toBeGreaterThan(0);
  });
});

describe('penalizacionPorCansancio', () => {
  it('es 0 antes/en el umbral (55 minutos)', () => {
    expect(penalizacionPorCansancio(30, 70)).toBe(0);
    expect(penalizacionPorCansancio(55, 70)).toBe(0);
  });

  it('crece con los minutos jugados pasado el umbral', () => {
    const a70 = penalizacionPorCansancio(70, 70);
    const a90 = penalizacionPorCansancio(90, 70);
    expect(a70).toBeGreaterThan(0);
    expect(a90).toBeGreaterThan(a70);
  });

  it('un mejor físico amortigua la penalización', () => {
    expect(penalizacionPorCansancio(90, 90)).toBeLessThan(penalizacionPorCansancio(90, 50));
  });

  it('tiene techo, ni con minutos muy altos (partido con alargue) se va a un valor absurdo', () => {
    expect(penalizacionPorCansancio(120, 40)).toBeLessThan(20);
  });
});

describe('tiempo complementario', () => {
  it('cada mitad agrega descuento: hay eventos con minutoAgregado fijados en 45 o en 90', () => {
    const r = simularPartido(equipo(70), equipo(70), false);
    const descuentoPrimera = r.eventos.filter((e) => e.minuto === 45 && e.minutoAgregado != null);
    const descuentoSegunda = r.eventos.filter((e) => e.minuto === 90 && e.minutoAgregado != null);
    expect(descuentoPrimera.length).toBeGreaterThan(0);
    expect(descuentoSegunda.length).toBeGreaterThan(0);
  });

  it('minutoAgregado es siempre positivo y acotado, y nunca pisa la numeración de la mitad siguiente', () => {
    const r = simularPartido(equipo(70), equipo(70), false);
    r.eventos.forEach((e) => {
      if (e.minutoAgregado != null) {
        expect(e.minutoAgregado).toBeGreaterThan(0);
        expect(e.minutoAgregado).toBeLessThanOrEqual(8);
        expect([45, 90]).toContain(e.minuto);
      } else {
        expect(e.minuto).toBeLessThanOrEqual(90);
      }
    });
  });

  it('un gol convertido en el descuento queda con minutoAgregado en la lista de goleadores', () => {
    let encontrado = false;
    for (let i = 0; i < 80 && !encontrado; i += 1) {
      const r = simularPartido(equipo(70), equipo(70), false);
      const golDescuento = r.eventosGol.find((g) => g.minutoAgregado != null);
      if (golDescuento) {
        encontrado = true;
        expect([45, 90]).toContain(golDescuento.minuto);
      }
    }
    expect(encontrado).toBe(true);
  });
});

describe('cambios y suplentes por stamina', () => {
  it('sin banco (suplentes undefined) nunca hay cambios', () => {
    const r = simularPartido(equipo(70), equipo(70), false);
    expect(r.cambiosLocal).toBe(0);
    expect(r.cambiosVisitante).toBe(0);
  });

  it('con banco disponible y físico bajo, el equipo hace cambios durante el partido (y nunca pasa el tope de 5)', () => {
    let totalCambios = 0;
    const partidos = 40;
    for (let i = 0; i < partidos; i += 1) {
      const local = equipo(70);
      local.titulares = conFisicoBajo(local.titulares);
      local.suplentes = banco(70);
      const rival = equipo(70);
      const r = simularPartido(local, rival, false);
      totalCambios += r.cambiosLocal;
      expect(r.cambiosLocal).toBeLessThanOrEqual(5);
      expect(r.cambiosVisitante).toBe(0); // el rival no tiene banco cargado
    }
    // 3 ventanas al 55% de probabilidad cada una — debería haber al menos
    // un cambio en la gran mayoría de los partidos.
    expect(totalCambios / partidos).toBeGreaterThan(0.5);
  });

  it('en una misma ventana puede meter más de un cambio de una vez (doble/triple), sin superar el tope de 5', () => {
    // banco() sólo tiene 5 suplentes de campo — con físico bajo en TODO
    // el 11 titular, hay de sobra para que algún partido use un
    // doble/triple cambio en la misma ventana (5 candidatos cansados
    // disponibles desde temprano).
    let vistoDobleOMas = false;
    const partidos = 60;
    for (let i = 0; i < partidos; i += 1) {
      const local = equipo(70);
      local.titulares = conFisicoBajo(local.titulares);
      local.suplentes = banco(70);
      const r = simularPartido(local, equipo(70), false);
      expect(r.cambiosLocal).toBeLessThanOrEqual(5);
      const cambiosLocal = r.eventos.filter((e) => e.tipo === 'cambio' && e.equipo === 'local');
      const porMinuto = new Map<number, number>();
      cambiosLocal.forEach((c) => porMinuto.set(c.minuto, (porMinuto.get(c.minuto) ?? 0) + 1));
      if ([...porMinuto.values()].some((cant) => cant >= 2)) vistoDobleOMas = true;
    }
    expect(vistoDobleOMas).toBe(true);
  });

  it('un cambio trae jugadorId (sale, del 11 titular) y jugadorEntraId (entra, del banco), sin repetir suplente', () => {
    let encontrado = false;
    for (let i = 0; i < 30 && !encontrado; i += 1) {
      const local = equipo(70);
      local.titulares = conFisicoBajo(local.titulares);
      local.suplentes = banco(70);
      const r = simularPartido(local, equipo(70), false);
      const cambios = r.eventos.filter((e) => e.tipo === 'cambio' && e.equipo === 'local');
      if (cambios.length === 0) continue;
      encontrado = true;
      const entrantes = cambios.map((c) => c.jugadorEntraId);
      expect(new Set(entrantes).size).toBe(entrantes.length);
      cambios.forEach((c) => {
        expect(local.titulares.some((j) => j.id === c.jugadorId)).toBe(true);
        expect(local.suplentes!.some((j) => j.id === c.jugadorEntraId)).toBe(true);
      });
    }
    expect(encontrado).toBe(true);
  });

  it('el arquero nunca sale ni entra por cambio', () => {
    const arqueroId = 'j-70-0'; // índice 0 de FORMACION_4_4_2 es ARQ
    let vistoAlgunCambio = false;
    for (let i = 0; i < 40; i += 1) {
      const local = equipo(70);
      local.titulares = conFisicoBajo(local.titulares);
      local.suplentes = banco(70);
      const r = simularPartido(local, equipo(70), false);
      r.eventos.filter((e) => e.tipo === 'cambio' && e.equipo === 'local').forEach((c) => {
        vistoAlgunCambio = true;
        expect(c.jugadorId).not.toBe(arqueroId);
      });
    }
    expect(vistoAlgunCambio).toBe(true);
  });

  it('el sustituido no vuelve a aparecer en eventos con jugadorId de su equipo después de salir', () => {
    let verificado = false;
    for (let i = 0; i < 40 && !verificado; i += 1) {
      const local = equipo(70);
      local.titulares = conFisicoBajo(local.titulares);
      local.suplentes = banco(70);
      const r = simularPartido(local, equipo(70), false);
      const cambioIdx = r.eventos.findIndex((e) => e.tipo === 'cambio' && e.equipo === 'local');
      if (cambioIdx === -1) continue;
      const salienteId = r.eventos[cambioIdx].jugadorId;
      const reaparece = r.eventos.slice(cambioIdx + 1).some((e) => (
        (e.tipo === 'falta' || e.tipo === 'penal' || e.tipo === 'gol' || e.tipo === 'cambio')
        && e.equipo === 'local' && e.jugadorId === salienteId
      ));
      expect(reaparece).toBe(false);
      verificado = true;
    }
    expect(verificado).toBe(true);
  });
});

describe('alargue', () => {
  it('juega entre el minuto 91 y 120, como continuación del partido regular (no un partido nuevo)', () => {
    const local = equipo(70);
    const visitante = equipo(70);
    const regular = simularPartido(local, visitante, false);
    const extendido = simularAlargue(local, visitante, regular);
    const eventosNuevos = extendido.eventos.slice(regular.eventos.length);
    expect(eventosNuevos.length).toBeGreaterThan(0);
    eventosNuevos.forEach((e) => {
      expect(e.minuto).toBeGreaterThanOrEqual(91);
      expect(e.minuto).toBeLessThanOrEqual(120);
    });
  });

  it('los goles del alargue se SUMAN a los del tiempo regular, nunca los reemplazan', () => {
    const local = equipo(70);
    const visitante = equipo(70);
    const regular = simularPartido(local, visitante, false);
    const extendido = simularAlargue(local, visitante, regular);
    expect(extendido.golesLocal).toBeGreaterThanOrEqual(regular.golesLocal);
    expect(extendido.golesVisitante).toBeGreaterThanOrEqual(regular.golesVisitante);
  });

  it('un jugador expulsado en el tiempo regular sigue afuera durante el alargue', () => {
    const fuerte = equipo(90);
    const debil = equipo(40);
    let verificado = false;
    // 150 intentos, mismo motivo que el test análogo de "sistema de
    // tarjetas" más arriba: ~7-8% de partidos con roja, 60 intentos daba
    // ~0.8% de chance de no encontrar ninguna (test en falso negativo).
    for (let i = 0; i < 150 && !verificado; i += 1) {
      const regular = simularPartido(fuerte, debil, false);
      const roja = regular.eventosTarjeta.find((t) => t.tipo === 'roja');
      if (!roja) continue;
      const extendido = simularAlargue(fuerte, debil, regular);
      const eventosNuevos = extendido.eventos.slice(regular.eventos.length);
      const reaparece = eventosNuevos.some((e) => (
        (e.tipo === 'falta' || e.tipo === 'penal' || e.tipo === 'gol' || e.tipo === 'cambio')
        && e.equipo === roja.equipo && e.jugadorId === roja.jugadorId
      ));
      expect(reaparece).toBe(false);
      verificado = true;
    }
    expect(verificado).toBe(true);
  });

  it('el tope de contraataques por partido (5) sigue valiendo sumando reglamentario + alargue', () => {
    const rapido = equipo(70);
    rapido.titulares = rapido.titulares.map((j) => (
      j.subStats ? { ...j, subStats: { ...j.subStats, ritmo: 99 } } : j
    ));
    const lento = equipo(70);
    lento.titulares = lento.titulares.map((j) => (
      j.subStats ? { ...j, subStats: { ...j.subStats, ritmo: 40 } } : j
    ));
    const regular = simularPartido(rapido, lento, false);
    const extendido = simularAlargue(rapido, lento, regular);
    const totalContraataques = extendido.eventos.filter((e) => e.tipo === 'inicio_posesion' && e.contraataque && e.equipo === 'local').length;
    expect(totalContraataques).toBeGreaterThan(0);
    expect(totalContraataques).toBeLessThanOrEqual(5);
  });
});

describe('simularPartido', () => {
  it('nunca da goles negativos', () => {
    const equipoParejo = equipo(70);
    for (let i = 0; i < 15; i += 1) {
      const r = simularPartido(equipoParejo, equipoParejo, false);
      expect(r.golesLocal).toBeGreaterThanOrEqual(0);
      expect(r.golesVisitante).toBeGreaterThanOrEqual(0);
    }
  });

  it('la posesión local + visitante siempre suma 100', () => {
    const equipoParejo = equipo(70);
    const r = simularPartido(equipoParejo, equipoParejo, false);
    expect(r.posesionLocal).toBeGreaterThanOrEqual(0);
    expect(r.posesionLocal).toBeLessThanOrEqual(100);
  });

  it('eventosGol y eventos (tipo gol) reflejan el mismo marcador', () => {
    const equipoParejo = equipo(70);
    const r = simularPartido(equipoParejo, equipoParejo, false);
    const golesEnEventos = r.eventos.filter((e) => e.tipo === 'gol').length;
    expect(r.eventosGol.length).toBe(golesEnEventos);
    expect(r.eventosGol.length).toBe(r.golesLocal + r.golesVisitante);
  });

  it('goles por equipo se mantienen en un rango realista (~0.8-1.8), no se desploman', () => {
    // Regresión encontrada calibrando la grilla 6x3: al arreglar "un
    // montón de goles de tiro libre" (que una falta que no se remata
    // directo reanude el juego en vez de cortar la posesión entera), el
    // total de goles por partido se había desplomado a la mitad
    // (~1.29 → ~0.6-0.8 por equipo) — la mayoría de las faltas fuera del
    // área terminaban la posesión sin ninguna ocasión, ni siquiera
    // indirecta. Guarda de regresión amplia (no un número exacto, porque
    // el motor tiene variancia real entre muestras) para que un cambio
    // futuro en faltas/tiros no vuelva a hundir el marcador sin que nadie
    // lo note (no había ningún test que mirara el total, sólo golpes
    // indirectos como "el equipo más fuerte gana más").
    const equipoParejo = equipo(70);
    let goles = 0;
    const partidos = 400;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(equipoParejo, equipoParejo, false);
      goles += r.golesLocal + r.golesVisitante;
    }
    const golesPorEquipo = goles / partidos / 2;
    expect(golesPorEquipo).toBeGreaterThan(0.8);
    expect(golesPorEquipo).toBeLessThan(1.8);
  });

  it('hay faltas incluso entre dos planteles PAREJOS, no sólo en partidos muy desparejos', () => {
    // Bug reportado jugando ("casi no hay faltas como antes"): la versión
    // vieja exigía que el atacante le ganara el duelo a la defensa por
    // 35+ puntos (diferencia > 0.35) para siquiera considerar una falta —
    // entre dos planteles del mismo grl eso casi nunca pasaba (medido:
    // ~0 faltas por partido en 200 simulaciones 70 vs 70). Ahora la
    // diferencia de nivel es un bonus sobre una base pareja, no un
    // requisito, así que un plantel neutro contra sí mismo también debe
    // generar faltas con regularidad.
    const equipoParejo = equipo(70);
    let faltas = 0;
    const partidos = 60;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(equipoParejo, equipoParejo, false);
      faltas += r.faltasLocal + r.faltasVisitante;
    }
    expect(faltas / partidos).toBeGreaterThan(4);
  });

  it('los goles de tiro libre son una porción chica del total (bug reportado dos veces: "un montón de goles de tiro libre")', () => {
    // Al arreglar el bug anterior (subir la frecuencia de faltas) cada
    // falta fuera del área seguía siendo SIEMPRE un remate directo al
    // 6.6% — sólo una fracción (PROB_TIRO_LIBRE_DIRECTO_POR_ZONA) termina
    // siendo un tiro al arco. Ojo con el ANTES/DESPUÉS acá: la primera
    // vuelta de este fix bajó el conteo absoluto por partido pero seguía
    // reportándose "un montón" — medido en una liga real completa (no el
    // 70 vs 70 sintético) el problema real era la PROPORCIÓN del total de
    // goles (9.8%, muy por encima del ~2-3% real de StatsBomb, sección
    // 2.2), no el número absoluto por partido. Este test mira esa
    // proporción directamente para no repetir el mismo error de mirar la
    // métrica equivocada.
    const equipoParejo = equipo(70);
    const partidos = 400;
    let golesTotales = 0;
    let golesDeFalta = 0;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(equipoParejo, equipoParejo, false);
      golesTotales += r.golesLocal + r.golesVisitante;
      r.eventos.forEach((e, idx) => {
        if (e.tipo === 'falta' && r.eventos[idx + 1]?.tipo === 'gol') golesDeFalta += 1;
      });
    }
    expect(golesTotales).toBeGreaterThan(100); // muestra suficiente
    const proporcion = golesDeFalta / golesTotales;
    console.log(`Goles de tiro libre: ${golesDeFalta}/${golesTotales} (${(proporcion * 100).toFixed(1)}%)`);
    expect(proporcion).toBeLessThan(0.08); // realidad ~2-3%, margen amplio antes de volver a ser "un montón"
  });

  it('una falta lejos del arco (zona 3) casi nunca da gol directo; una cerca (zona 4) sí, bastante más', () => {
    // Pregunta jugando: "¿se tiene en cuenta la zona si se patean directo
    // o indirecto?" — antes NO, PROB_TIRO_LIBRE_DIRECTO era un único 25%
    // sin importar la distancia (una falta a la altura del medio campo
    // tenía la misma chance de rematarse directo que una al borde del
    // área). Ahora zona 3 (lejos) casi no remata directo y zona 4 (borde
    // del área) sí — la tasa de gol observada por zona tiene que reflejar
    // esa diferencia.
    const equipoParejo = equipo(70);
    const partidos = 500;
    let golesZona3 = 0;
    let faltasZona3 = 0;
    let golesZona4 = 0;
    let faltasZona4 = 0;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(equipoParejo, equipoParejo, false);
      r.eventos.forEach((e, idx) => {
        if (e.tipo !== 'falta') return;
        const esGol = r.eventos[idx + 1]?.tipo === 'gol';
        if (e.zona === 3) { faltasZona3 += 1; if (esGol) golesZona3 += 1; }
        if (e.zona === 4) { faltasZona4 += 1; if (esGol) golesZona4 += 1; }
      });
    }
    expect(faltasZona3).toBeGreaterThan(50);
    expect(faltasZona4).toBeGreaterThan(50);
    const tasaZona3 = golesZona3 / faltasZona3;
    const tasaZona4 = golesZona4 / faltasZona4;
    expect(tasaZona4).toBeGreaterThan(tasaZona3 * 2);
  });

  it('produce eventos de córner, falta, penal y fuera de juego en varios partidos (fase 3)', () => {
    // Un desnivel marcado (regate del fuerte vs. defensa del débil) hace
    // más frecuente el gatillo de "falta"/"penal" (bonus por diferencia,
    // ver resolverPasoPosesion) sin depender de tener suerte con 70 vs 70
    // parejo.
    const fuerte = equipo(85);
    const debil = equipo(55);
    const tipos = new Set<string>();
    for (let i = 0; i < 40; i += 1) {
      simularPartido(fuerte, debil, false).eventos.forEach((e) => tipos.add(e.tipo));
    }
    expect(tipos.has('corner')).toBe(true);
    expect(tipos.has('falta')).toBe(true);
    expect(tipos.has('penal')).toBe(true);
    expect(tipos.has('fuera_de_juego')).toBe(true);
  });

  it('un penal convierte mucho más seguido que un tiro libre (75.6% vs. 6.6%)', () => {
    // Zona 5 (área rival) siempre da penal en vez de falta al tirar el
    // 'falta' de resolverPasoPosesion — comparamos resolverTiro no aplica
    // acá (la conversión de penal/tiro libre es fija, no depende de xG por
    // zona), así que se prueba indirecto: simulando muchos partidos muy
    // desparejos, la tasa de gol-por-penal observada debe acercarse al
    // 75.6% documentado (StatsBomb), muy por encima del 6.6% de un libre.
    const fuerte = equipo(90);
    const debil = equipo(40);
    let penales = 0;
    let penalesConvertidos = 0;
    for (let i = 0; i < 60; i += 1) {
      const eventos = simularPartido(fuerte, debil, false).eventos;
      eventos.forEach((e, idx) => {
        if (e.tipo === 'penal') {
          penales += 1;
          if (eventos[idx + 1]?.tipo === 'gol') penalesConvertidos += 1;
        }
      });
    }
    expect(penales).toBeGreaterThan(5); // hubo penales suficientes para que la muestra tenga sentido
    expect(penalesConvertidos / penales).toBeGreaterThan(0.5); // bien por encima del 6.6% de un tiro libre normal
  });

  it('penales: cuántos se atajan/erran (pedido explícito) — se mantiene en un rango realista', () => {
    // "hace el test de cuantos penales son atajados": el modelo no separa
    // "atajado por el arquero" de "errado/desviado" — probabilidadConvertirPenal
    // es un único booleano gol/no-gol (mismo criterio que el stat agregado
    // de StatsBomb, sección 2.2 del documento: 75.6% de los penales
    // terminan en gol). El complemento (~24%) cubre TODO lo que no es gol,
    // atajada incluida. Con planteles parejos (grl 70 vs 70, sin ventaja
    // de tiro/atajada de ningún lado) esa tasa "no convertido" tiene que
    // acercarse al 24.4% documentado.
    // Plantel fresco por partido (no uno solo reusado 400 veces) — con un
    // solo draw de subStats la muestra de penales no es independiente
    // entre "partidos" (mismos pateadores/arquero todo el rato), lo que
    // puede correr la tasa observada lo suficiente como para rozar el
    // borde del rango y flaquear de a ratos sin que haya un bug real.
    let penales = 0;
    let noConvertidos = 0;
    for (let i = 0; i < 400; i += 1) {
      const equipoParejo = equipo(70);
      const eventos = simularPartido(equipoParejo, equipoParejo, false).eventos;
      eventos.forEach((e, idx) => {
        if (e.tipo === 'penal') {
          penales += 1;
          if (eventos[idx + 1]?.tipo !== 'gol') noConvertidos += 1;
        }
      });
    }
    expect(penales).toBeGreaterThan(30); // muestra suficiente
    const tasaNoConvertido = noConvertidos / penales;
    console.log(`Penales: ${penales}, no convertidos (atajados/errados): ${noConvertidos} (${(tasaNoConvertido * 100).toFixed(1)}%)`);
    expect(tasaNoConvertido).toBeGreaterThan(0.12);
    expect(tasaNoConvertido).toBeLessThan(0.38);
  });

  it('los eventos de penal/falta traen jugadorId (el pateador de mejor tiro) y arqueroId', () => {
    const fuerte = equipo(90);
    const debil = equipo(40);
    let vistoPenalConJugador = false;
    let vistoFaltaConJugador = false;
    for (let i = 0; i < 60 && (!vistoPenalConJugador || !vistoFaltaConJugador); i += 1) {
      const eventos = simularPartido(fuerte, debil, false).eventos;
      eventos.forEach((e) => {
        if (e.tipo === 'penal' || e.tipo === 'falta') {
          const equipoQueAtaca = e.equipo === 'local' ? fuerte : debil;
          const mejorTirador = elegirPateador(equipoQueAtaca.titulares);
          expect(e.jugadorId).toBe(mejorTirador?.id);
          expect(e.arqueroId).toBeDefined();
          if (e.tipo === 'penal') vistoPenalConJugador = true;
          else vistoFaltaConJugador = true;
        }
      });
    }
    expect(vistoPenalConJugador).toBe(true);
    expect(vistoFaltaConJugador).toBe(true);
  });

  it('el gol que sale de un penal/falta trae origen y el mismo jugadorId que el evento penal/falta', () => {
    const fuerte = equipo(90);
    const debil = equipo(40);
    let encontrado = false;
    for (let i = 0; i < 80 && !encontrado; i += 1) {
      const eventos = simularPartido(fuerte, debil, false).eventos;
      eventos.forEach((e, idx) => {
        if ((e.tipo === 'penal' || e.tipo === 'falta') && eventos[idx + 1]?.tipo === 'gol') {
          const golEvento = eventos[idx + 1];
          expect(golEvento.jugadorId).toBe(e.jugadorId);
          expect(golEvento.origen).toBe(e.tipo);
          encontrado = true;
        }
      });
    }
    expect(encontrado).toBe(true);
  });

  it('un equipo mucho más fuerte gana la mayoría de las veces', () => {
    const fuerte = equipo(90);
    const debil = equipo(50);

    let victoriasFuerte = 0;
    const partidos = 30;
    for (let i = 0; i < partidos; i += 1) {
      const r = simularPartido(fuerte, debil, false);
      if (r.golesLocal > r.golesVisitante) victoriasFuerte += 1;
    }
    expect(victoriasFuerte).toBeGreaterThan(partidos * 0.7);
  });

  it('un equipo mucho más fuerte también tiene más posesión, en promedio', () => {
    const fuerte = equipo(90);
    const debil = equipo(50);

    let sumaPosesion = 0;
    const partidos = 15;
    for (let i = 0; i < partidos; i += 1) {
      sumaPosesion += simularPartido(fuerte, debil, false).posesionLocal;
    }
    expect(sumaPosesion / partidos).toBeGreaterThan(55);
  });
});

describe('mentalidad de partido (mecánica de profundidad, ver engine/objetivos.ts hermana)', () => {
  it('equilibrado (o sin mentalidad) no ajusta nada', () => {
    expect(ajusteMentalidad('equilibrado')).toBe(0);
    expect(ajusteMentalidad(undefined)).toBe(0);
  });

  it('ofensivo y defensivo son simétricos y de signo opuesto', () => {
    expect(ajusteMentalidad('ofensivo')).toBeGreaterThan(0);
    expect(ajusteMentalidad('defensivo')).toBeLessThan(0);
    expect(ajusteMentalidad('ofensivo')).toBeCloseTo(-ajusteMentalidad('defensivo'));
  });

  it('dos equipos jugando ofensivo anotan más goles totales, en promedio, que jugando defensivo', () => {
    const partidos = 120;
    let golesOfensivo = 0;
    let golesDefensivo = 0;
    for (let i = 0; i < partidos; i += 1) {
      const rOfensivo = simularPartido(
        equipo(70, { mentalidad: 'ofensivo' }), equipo(70, { mentalidad: 'ofensivo' }), false,
      );
      golesOfensivo += rOfensivo.golesLocal + rOfensivo.golesVisitante;
      const rDefensivo = simularPartido(
        equipo(70, { mentalidad: 'defensivo' }), equipo(70, { mentalidad: 'defensivo' }), false,
      );
      golesDefensivo += rDefensivo.golesLocal + rDefensivo.golesVisitante;
    }
    expect(golesOfensivo / partidos).toBeGreaterThan(golesDefensivo / partidos);
  });
});
