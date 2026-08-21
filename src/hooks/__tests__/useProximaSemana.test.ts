import { describe, expect, it } from 'vitest';
import { proximaSemanaPendiente } from '../useProximaSemana';
import type { EntradaCalendario } from '../../engine/calendario';

function entrada(over: Partial<EntradaCalendario>): EntradaCalendario {
  return {
    id: 'e', semana: 1, tipo: 'liga', competencia: 'Liga', etiquetaRonda: 'Fecha 1', jugado: false,
    golesPropios: null, golesRival: null, goles: null, pantalla: 'liga',
    ...over,
  };
}

describe('proximaSemanaPendiente', () => {
  it('devuelve null si no hay nada pendiente', () => {
    expect(proximaSemanaPendiente([entrada({ jugado: true })])).toBeNull();
  });

  it('ignora las entradas de mercado (nunca pasan a jugado)', () => {
    expect(proximaSemanaPendiente([entrada({ tipo: 'mercado', jugado: false })])).toBeNull();
  });

  it('elige la semana más temprana sin jugar', () => {
    const resultado = proximaSemanaPendiente([
      entrada({ id: 'a', semana: 3 }),
      entrada({ id: 'b', semana: 1 }),
      entrada({ id: 'c', semana: 2 }),
    ]);
    expect(resultado?.semana).toBe(1);
  });

  // Bug reportado: "los partidos de copas y liga los simula a la vez, no
  // los separa" — cuando la semana más temprana tiene MÁS DE UNA
  // competencia pendiente, sólo se devuelve UNA (no las dos juntas).
  it('cuando coinciden liga y copa en la misma semana, elige sólo una (liga primero)', () => {
    const resultado = proximaSemanaPendiente([
      entrada({ id: 'liga-1', semana: 5, tipo: 'liga' }),
      entrada({ id: 'copa-1', semana: 5, tipo: 'copa-nacional' }),
    ]);
    expect(resultado).toEqual({ semana: 5, tipo: 'liga' });
  });

  it('si liga ya está jugada esa semana, elige la copa pendiente en su lugar', () => {
    const resultado = proximaSemanaPendiente([
      entrada({ id: 'liga-1', semana: 5, tipo: 'liga', jugado: true }),
      entrada({ id: 'copa-1', semana: 5, tipo: 'copa-nacional' }),
    ]);
    expect(resultado).toEqual({ semana: 5, tipo: 'copa-nacional' });
  });

  it('pretemporada queda last en la prioridad si coincide con otra competencia', () => {
    const resultado = proximaSemanaPendiente([
      entrada({ id: 'pre-1', semana: 1, tipo: 'pretemporada' }),
      entrada({ id: 'copa-1', semana: 1, tipo: 'copa-uefa' }),
    ]);
    expect(resultado).toEqual({ semana: 1, tipo: 'copa-uefa' });
  });
});
