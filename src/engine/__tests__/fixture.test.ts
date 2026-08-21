import { describe, expect, it } from 'vitest';
import { calcularTabla, generarFixture } from '../fixture';

describe('generarFixture', () => {
  it('cada club juega contra todos los demás, ida y vuelta', () => {
    const clubIds = ['a', 'b', 'c', 'd'];
    const fixture = generarFixture(clubIds);

    // 4 clubes → 3 rondas de ida + 3 de vuelta, 2 partidos por ronda = 12.
    expect(fixture.length).toBe(12);

    clubIds.forEach((id) => {
      const partidos = fixture.filter((p) => p.localId === id || p.visitanteId === id);
      expect(partidos.length).toBe(6); // 3 rivales × ida y vuelta
    });

    // Contra cada rival: un partido de local y uno de visitante.
    const rivalesDeA = fixture.filter((p) => p.localId === 'a' || p.visitanteId === 'a');
    ['b', 'c', 'd'].forEach((rival) => {
      const comoLocal = rivalesDeA.some((p) => p.localId === 'a' && p.visitanteId === rival);
      const comoVisitante = rivalesDeA.some((p) => p.localId === rival && p.visitanteId === 'a');
      expect(comoLocal).toBe(true);
      expect(comoVisitante).toBe(true);
    });
  });

  it('en cada fecha, cada club juega como máximo un partido', () => {
    const clubIds = ['a', 'b', 'c', 'd', 'e', 'f'];
    const fixture = generarFixture(clubIds);
    const fechas = new Set(fixture.map((p) => p.fecha));

    fechas.forEach((fecha) => {
      const partidosFecha = fixture.filter((p) => p.fecha === fecha);
      const clubesJugando = partidosFecha.flatMap((p) => [p.localId, p.visitanteId]);
      expect(new Set(clubesJugando).size).toBe(clubesJugando.length);
    });
  });
});

describe('calcularTabla', () => {
  it('suma puntos 3-1-0 y ordena por puntos', () => {
    const clubIds = ['a', 'b'];
    const fixture = [
      { id: '1', fecha: 1, localId: 'a', visitanteId: 'b', golesLocal: 2, golesVisitante: 0, partidoImportante: false },
      { id: '2', fecha: 2, localId: 'b', visitanteId: 'a', golesLocal: 1, golesVisitante: 1, partidoImportante: false },
    ];
    const tabla = calcularTabla(fixture, clubIds);

    const filaA = tabla.find((f) => f.clubId === 'a')!;
    const filaB = tabla.find((f) => f.clubId === 'b')!;

    expect(filaA.pts).toBe(4); // 3 (ganó) + 1 (empató)
    expect(filaB.pts).toBe(1); // 0 + 1
    expect(tabla[0].clubId).toBe('a');
  });

  it('ignora partidos todavía no jugados (golesLocal null)', () => {
    const clubIds = ['a', 'b'];
    const fixture = [
      { id: '1', fecha: 1, localId: 'a', visitanteId: 'b', golesLocal: null, golesVisitante: null, partidoImportante: false },
    ];
    const tabla = calcularTabla(fixture, clubIds);
    expect(tabla.every((f) => f.pj === 0)).toBe(true);
  });
});
