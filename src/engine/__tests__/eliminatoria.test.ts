import { describe, expect, it } from 'vitest';
import {
  armarLlave, armarPrimeraRonda, armarSiguienteRonda, nombreRonda, siguientePotenciaDeDos, simularLlave,
  probabilidadConvertirTanda, simularTandaPenales,
} from '../eliminatoria';
import type { Club, DT, Jugador, Posicion } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function jugador(id: string, grl: number): Jugador {
  return {
    id, nombre: `J${id}`, edad: 25, posicion: 'DEL', grl, pot: grl, valorMercado: 100000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
  };
}

function clubBase(id: string, nc: number): Club {
  const plantel = [jugador(`${id}-1`, nc)];
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc, presupuesto: 100000, cohesion: 55,
    plantel, formacion: '4-4-2', titularesIds: [`${id}-1`], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
  };
}

const FORMACION_4_4_2: Posicion[] = ['ARQ', 'DFC', 'DFC', 'LI', 'LD', 'MC', 'MC', 'EI', 'ED', 'DEL', 'DEL'];

// Plantel completo (11 titulares reales, no el jugador único de clubBase)
// para poder probar la tanda de penales — necesita un arquero + 10
// pateadores de campo con `tiro` explícito, no sólo grl.
function clubConPlantel(id: string, tiro: number, atajada: number, dt: DT = dtBase()): Club {
  const plantel: Jugador[] = FORMACION_4_4_2.map((posicion, i) => ({
    ...jugador(`${id}-${i}`, 70),
    posicion,
    subStats: posicion === 'ARQ' ? undefined : {
      ritmo: 70, tiro, pase: 70, regate: 70, defensa: 70, fisico: 70,
    },
    subStatsArquero: posicion === 'ARQ' ? {
      atajada, salidas: 70, juegoDePies: 70, reflejos: 70,
    } : undefined,
  }));
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel, formacion: '4-4-2', titularesIds: plantel.map((j) => j.id), suplentesIds: [], dt,
    esControladoPorUsuario: false,
  };
}

describe('probabilidadConvertirTanda', () => {
  const arquero = jugador('arq', 70);

  it('un pateador de mejor tiro convierte más, a igual arquero/DT/ronda', () => {
    const dt = dtBase();
    const bueno = probabilidadConvertirTanda({ ...jugador('a', 70), subStats: { ritmo: 70, tiro: 95, pase: 70, regate: 70, defensa: 70, fisico: 70 } }, arquero, dt, 1);
    const flojo = probabilidadConvertirTanda({ ...jugador('b', 70), subStats: { ritmo: 70, tiro: 45, pase: 70, regate: 70, defensa: 70, fisico: 70 } }, arquero, dt, 1);
    expect(bueno).toBeGreaterThan(flojo);
  });

  it('la presión de ronda avanzada (>=4) baja la conversión respecto a la ronda 1', () => {
    const dt = dtBase();
    const pateador = { ...jugador('p', 70), subStats: { ritmo: 70, tiro: 70, pase: 70, regate: 70, defensa: 70, fisico: 70 } };
    const ronda1 = probabilidadConvertirTanda(pateador, arquero, dt, 1);
    const ronda6 = probabilidadConvertirTanda(pateador, arquero, dt, 6);
    expect(ronda6).toBeLessThan(ronda1);
  });

  it('mejor mentalidad del DT que patea sube la conversión', () => {
    const pateador = { ...jugador('p', 70), subStats: { ritmo: 70, tiro: 70, pase: 70, regate: 70, defensa: 70, fisico: 70 } };
    const dtCrack = { ...dtBase(), mentalidad: 95 };
    const dtFlojo = { ...dtBase(), mentalidad: 30 };
    expect(probabilidadConvertirTanda(pateador, arquero, dtCrack, 1))
      .toBeGreaterThan(probabilidadConvertirTanda(pateador, arquero, dtFlojo, 1));
  });
});

describe('simularTandaPenales', () => {
  it('siempre define un ganador único, entre local y visitante', () => {
    const local = clubConPlantel('local', 70, 65);
    const visitante = clubConPlantel('visitante', 70, 65);
    for (let i = 0; i < 20; i += 1) {
      const tanda = simularTandaPenales(local, visitante);
      expect(['local', 'visitante']).toContain(tanda.ganadorId === local.id ? 'local' : 'visitante');
    }
  });

  it('tira al menos 5 rondas por equipo (10 tiros) salvo que siga empatado', () => {
    const local = clubConPlantel('local', 70, 65);
    const visitante = clubConPlantel('visitante', 70, 65);
    const tanda = simularTandaPenales(local, visitante);
    expect(tanda.tiros.length).toBeGreaterThanOrEqual(10);
    const golesLocal = tanda.tiros.filter((t) => t.equipo === 'local' && t.gol).length;
    const golesVisitante = tanda.tiros.filter((t) => t.equipo === 'visitante' && t.gol).length;
    expect(golesLocal).not.toBe(golesVisitante);
    expect(tanda.ganadorId).toBe(golesLocal > golesVisitante ? local.id : visitante.id);
  });

  it('un equipo con mejores pateadores gana la tanda más seguido', () => {
    const fuerte = clubConPlantel('fuerte', 95, 50);
    const debil = clubConPlantel('debil', 45, 50);
    let victoriasFuerte = 0;
    const tandas = 80;
    for (let i = 0; i < tandas; i += 1) {
      if (simularTandaPenales(fuerte, debil).ganadorId === fuerte.id) victoriasFuerte += 1;
    }
    // Muestra más grande y umbral más laxo que la primera versión (30
    // tandas / 60%) — flaqueaba por variancia de a ratos sin que hubiera
    // ningún bug real detrás.
    expect(victoriasFuerte).toBeGreaterThan(tandas * 0.55);
  });
});

describe('siguientePotenciaDeDos', () => {
  it('redondea hacia arriba a la potencia de 2 más chica', () => {
    expect(siguientePotenciaDeDos(28)).toBe(32);
    expect(siguientePotenciaDeDos(16)).toBe(16);
    expect(siguientePotenciaDeDos(12)).toBe(16);
    expect(siguientePotenciaDeDos(1)).toBe(1);
  });
});

describe('nombreRonda', () => {
  it('nombra según cuántos equipos quedan', () => {
    expect(nombreRonda(2)).toBe('Final');
    expect(nombreRonda(4)).toBe('Semifinal');
    expect(nombreRonda(8)).toBe('Cuartos de final');
    expect(nombreRonda(16)).toBe('Octavos de final');
    expect(nombreRonda(32)).toBe('Dieciseisavos de final');
  });
});

describe('armarPrimeraRonda', () => {
  it('con una cantidad que no es potencia de 2, arma byes para completar', () => {
    const clubIds = Array.from({ length: 28 }, (_, i) => `c${i}`);
    const { llaves, clasificadosPendientes } = armarPrimeraRonda(clubIds, true);
    // 32 (potencia de 2 más chica ≥28) - 28 = 4 byes → 24 jugables → 12 llaves.
    expect(clasificadosPendientes).toHaveLength(4);
    expect(llaves).toHaveLength(12);
    const enLlaves = llaves.flatMap((l) => [l.localId, l.visitanteId]);
    expect(new Set([...enLlaves, ...clasificadosPendientes]).size).toBe(28);
  });

  it('con una potencia de 2 exacta, no hay byes', () => {
    const clubIds = Array.from({ length: 16 }, (_, i) => `c${i}`);
    const { llaves, clasificadosPendientes } = armarPrimeraRonda(clubIds, true);
    expect(clasificadosPendientes).toHaveLength(0);
    expect(llaves).toHaveLength(8);
  });
});

describe('armarLlave — ids únicos entre sesiones', () => {
  it('no depende de un contador de módulo: dos llaves "de sesiones distintas" no colisionan', () => {
    // Bug real reportado: el contador de ids vivía a nivel de módulo y se
    // reiniciaba en cada reload de la página, pero las Llave/Partido que
    // numeraba quedaban persistidas en localStorage — una llave generada
    // después de recargar podía repetir el id de una vieja ya guardada.
    // No hay forma de "recargar el módulo" real en un test unitario, pero
    // sí se puede probar la propiedad que importa: llamar armarLlave desde
    // cero muchas veces (como si cada una fuera la primera llamada de una
    // sesión nueva) nunca repite un id de partido ni de llave.
    const ids = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const llave = armarLlave('Octavos', 'a', 'b', false);
      [llave.id, llave.partidoIda!.id, llave.partidoVuelta.id].forEach((id) => {
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      });
    }
  });
});

describe('armarSiguienteRonda', () => {
  it('empareja ganadores + clasificados pendientes', () => {
    const llave1 = { ...armarLlave('R1', 'a', 'b', true), ganadorId: 'a' };
    const llave2 = { ...armarLlave('R1', 'c', 'd', true), ganadorId: 'c' };
    const { llaves, nombreRonda: ronda } = armarSiguienteRonda([llave1, llave2], ['e', 'f'], true);
    expect(llaves).toHaveLength(2);
    expect(ronda).toBe('Semifinal');
    const equipos = llaves.flatMap((l) => [l.localId, l.visitanteId]);
    expect(new Set(equipos)).toEqual(new Set(['a', 'c', 'e', 'f']));
  });

  it('devuelve null si sólo queda un clasificado (ya hay campeón)', () => {
    const llave1 = { ...armarLlave('Final', 'a', 'b', true), ganadorId: 'a' };
    const { llaves, nombreRonda: ronda } = armarSiguienteRonda([llave1], [], true);
    expect(llaves).toHaveLength(0);
    expect(ronda).toBeNull();
  });
});

describe('simularLlave', () => {
  it('a partido único: define ganador por el resultado de un solo partido', () => {
    const llave = armarLlave('Final', 'fuerte', 'debil', true);
    const clubes = { fuerte: clubBase('fuerte', 90), debil: clubBase('debil', 45) };
    const resuelta = simularLlave(llave, clubes);
    expect(resuelta.ganadorId).not.toBeNull();
    expect(resuelta.partidoIda).toBeNull();
    expect(resuelta.partidoVuelta.golesLocal).not.toBeNull();
  });

  it('ida y vuelta: simula ambos partidos y suma el agregado', () => {
    const llave = armarLlave('Octavos', 'a', 'b', false);
    const clubes = { a: clubBase('a', 70), b: clubBase('b', 70) };
    const resuelta = simularLlave(llave, clubes);
    expect(resuelta.partidoIda).not.toBeNull();
    expect(resuelta.partidoIda!.localId).toBe('a');
    expect(resuelta.partidoVuelta.localId).toBe('b'); // localía invertida en la vuelta
    expect(resuelta.ganadorId).not.toBeNull();
    expect([resuelta.ganadorId]).toEqual([resuelta.ganadorId]); // gana 'a' o 'b'
    expect(['a', 'b']).toContain(resuelta.ganadorId);
  });

  it('si empata en el agregado, resuelve con detallePenales (no un sorteo ciego)', () => {
    const clubes = { a: clubConPlantel('a', 70, 65), b: clubConPlantel('b', 70, 65) };
    let vistoConPenales = false;
    for (let i = 0; i < 60 && !vistoConPenales; i += 1) {
      const llave = armarLlave('Octavos', 'a', 'b', false);
      const resuelta = simularLlave(llave, clubes);
      if (resuelta.penales) {
        vistoConPenales = true;
        expect(resuelta.detallePenales).toBeDefined();
        expect(resuelta.detallePenales!.ganadorId).toBe(resuelta.ganadorId);
        expect(resuelta.detallePenales!.tiros.length).toBeGreaterThanOrEqual(10);
      }
    }
    expect(vistoConPenales).toBe(true);
  });

  it('si empata en el tiempo reglamentario, juega alargue (30\') antes de ir a penales', () => {
    const clubes = { a: clubConPlantel('a', 70, 65), b: clubConPlantel('b', 70, 65) };
    let vistoConAlargue = false;
    for (let i = 0; i < 80 && !vistoConAlargue; i += 1) {
      const llave = armarLlave('Octavos', 'a', 'b', false);
      const resuelta = simularLlave(llave, clubes);
      if (resuelta.partidoVuelta.huboAlargue) {
        vistoConAlargue = true;
        expect(resuelta.ganadorId).not.toBeNull();
        // El resultado final de la vuelta ya incluye lo jugado en el
        // alargue — golesLocal/golesVisitante son del partido extendido.
        expect(resuelta.partidoVuelta.golesLocal).not.toBeNull();
      }
    }
    expect(vistoConAlargue).toBe(true);
  });

  it('ya resuelta (con ganador), no vuelve a simular', () => {
    const llave = { ...armarLlave('Final', 'a', 'b', true), ganadorId: 'a' };
    const clubes = { a: clubBase('a', 70), b: clubBase('b', 70) };
    const resuelta = simularLlave(llave, clubes);
    expect(resuelta).toBe(llave);
  });
});
