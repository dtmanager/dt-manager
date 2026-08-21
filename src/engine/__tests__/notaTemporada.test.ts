import { describe, expect, it } from 'vitest';
import { bajadaTemporada, calcularNotaTemporada, tituloTemporada } from '../notaTemporada';
import type { ResumenTemporada } from '../economia';

function resumen(over: Partial<ResumenTemporada> = {}): ResumenTemporada {
  return {
    temporada: 1,
    posicion: 10,
    totalClubes: 20,
    campeon: false,
    descendido: false,
    ascendido: false,
    nuevaLiga: null,
    premio: 0,
    taquilla: 0,
    sueldosPagados: 0,
    sueldoDT: 0,
    presupuestoAnterior: 0,
    presupuestoNuevo: 0,
    objetivoDescripcion: 'Terminar entre los primeros 10',
    objetivoCumplido: true,
    confianzaAnterior: 50,
    confianzaNueva: 50,
    record: { pj: 20, pg: 10, pe: 5, pp: 5, gf: 30, gc: 20 },
    goleadorPropio: null,
    ...over,
  };
}

describe('calcularNotaTemporada', () => {
  it('un campeón siempre saca 10, sin importar el objetivo', () => {
    expect(calcularNotaTemporada(resumen({ campeon: true, posicion: 1, objetivoCumplido: false }))).toBe(10);
  });

  it('un descendido nunca pasa de 3, aunque haya cumplido el objetivo', () => {
    const nota = calcularNotaTemporada(resumen({
      descendido: true, posicion: 18, totalClubes: 20, objetivoCumplido: true,
    }));
    expect(nota).toBeLessThanOrEqual(3);
  });

  it('un ascenso nunca baja de 8, aunque el objetivo no se haya cumplido', () => {
    const nota = calcularNotaTemporada(resumen({
      ascendido: true, posicion: 2, totalClubes: 20, objetivoCumplido: false,
    }));
    expect(nota).toBeGreaterThanOrEqual(8);
  });

  it('mejor posición da mejor nota, a igualdad de objetivo cumplido', () => {
    const notaArriba = calcularNotaTemporada(resumen({ posicion: 2, totalClubes: 20 }));
    const notaAbajo = calcularNotaTemporada(resumen({ posicion: 19, totalClubes: 20 }));
    expect(notaArriba).toBeGreaterThan(notaAbajo);
  });

  it('no cumplir el objetivo baja la nota respecto a cumplirlo, a igual posición', () => {
    const cumplido = calcularNotaTemporada(resumen({ posicion: 10, totalClubes: 20, objetivoCumplido: true }));
    const incumplido = calcularNotaTemporada(resumen({ posicion: 10, totalClubes: 20, objetivoCumplido: false }));
    expect(cumplido).toBeGreaterThan(incumplido);
  });

  it('la nota siempre queda entre 0 y 10', () => {
    const notaMin = calcularNotaTemporada(resumen({
      posicion: 20, totalClubes: 20, objetivoCumplido: false, descendido: true,
    }));
    const notaMax = calcularNotaTemporada(resumen({ campeon: true }));
    expect(notaMin).toBeGreaterThanOrEqual(0);
    expect(notaMax).toBeLessThanOrEqual(10);
  });
});

describe('tituloTemporada', () => {
  it('campeón', () => {
    expect(tituloTemporada(resumen({ campeon: true }))).toBe('¡CAMPEÓN!');
  });

  it('ascenso', () => {
    expect(tituloTemporada(resumen({ ascendido: true }))).toBe('¡ASCENSO LOGRADO!');
  });

  it('descenso', () => {
    expect(tituloTemporada(resumen({ descendido: true }))).toBe('TEMPORADA PARA OLVIDAR');
  });

  it('objetivo cumplido en el tercio de arriba de la tabla', () => {
    expect(tituloTemporada(resumen({ posicion: 2, totalClubes: 20, objetivoCumplido: true }))).toBe('TEMPORADA SÓLIDA');
  });

  it('objetivo cumplido fuera del tercio de arriba', () => {
    expect(tituloTemporada(resumen({ posicion: 12, totalClubes: 20, objetivoCumplido: true }))).toBe('OBJETIVO CUMPLIDO');
  });

  it('objetivo no cumplido, sin descenso ni ascenso', () => {
    expect(tituloTemporada(resumen({ posicion: 12, totalClubes: 20, objetivoCumplido: false }))).toBe('TEMPORADA IRREGULAR');
  });
});

describe('bajadaTemporada', () => {
  it('arma la oración con posición y récord', () => {
    const texto = bajadaTemporada(
      resumen({ posicion: 3, totalClubes: 20, record: { pj: 20, pg: 10, pe: 5, pp: 5, gf: 30, gc: 20 } }),
      'Boca Juniors',
    );
    expect(texto).toBe('Boca Juniors terminó 3° de 20 con 10V-5E-5D y 30 goles a favor.');
  });
});
