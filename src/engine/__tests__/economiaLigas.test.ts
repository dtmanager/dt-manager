import { describe, expect, it } from 'vitest';
import { presupuestoInicial } from '../economiaLigas';
import { calcularValorMercado } from '../jugadores';

// Jugador "de referencia" del propio nivel del club (mismo grl que el nc
// del club, 25 años — ni joven promesa ni veterano de salida — MC, la
// posición "neutra" de FACTOR_POSICION en jugadores.ts) — mismo criterio
// que la investigación previa (ver el comentario grande de
// `presupuestoInicial` en economiaLigas.ts: el bug encontrado era que ni
// el club más rico de la Liga Profesional podía pagar a un jugador de su
// propio nivel con toda su caja inicial).
function valorDeReferencia(nc: number): number {
  return calcularValorMercado({
    grl: nc, edad: 25, pot: nc, posicion: 'MC',
  });
}

const LIGAS_A_PROBAR = [
  { nombre: 'Liga Profesional', ncMax: 75 },
  { nombre: 'Premier League', ncMax: 84 },
  { nombre: 'LaLiga', ncMax: 85 },
  { nombre: 'Brasileirão Série A', ncMax: 76 },
  { nombre: 'Primera Nacional', ncMax: 55 },
];

describe('presupuestoInicial — el club top de cada liga puede comprar un jugador de su nivel', () => {
  it.each(LIGAS_A_PROBAR)('$nombre (nc $ncMax)', ({ nombre, ncMax }) => {
    const valorReferencia = valorDeReferencia(ncMax);
    // presupuestoInicial tiene un componente aleatorio (randomUniforme
    // 0.8-1.2) — se muestrea varias veces para exigir el PEOR caso, no
    // sólo el promedio.
    const muestras = Array.from({ length: 30 }, () => presupuestoInicial(ncMax, nombre));
    const minimo = Math.min(...muestras);
    expect(minimo).toBeGreaterThanOrEqual(valorReferencia);
  });
});

describe('presupuestoInicial — el piso de cada liga sigue sin poder comprar (a propósito)', () => {
  it('un club del piso de Liga Profesional no alcanza para un jugador de su propio nivel', () => {
    const valorReferencia = valorDeReferencia(63);
    const muestras = Array.from({ length: 30 }, () => presupuestoInicial(63, 'Liga Profesional'));
    const maximo = Math.max(...muestras);
    expect(maximo).toBeLessThan(valorReferencia);
  });
});
