import { describe, expect, it } from 'vitest';
import {
  actualizarConfianza, ajustarConfianzaPorPresupuesto, asignarObjetivoTemporada, CONFIANZA_INICIAL, evaluarObjetivoTemporada,
  INCUMPLIMIENTOS_PARA_DESPIDO,
} from '../objetivos';
import type { Club, DT } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function clubBase(id: string, nc: number): Club {
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc, presupuesto: 100000, cohesion: 55,
    plantel: [], formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
  };
}

// Liga de 10 clubes, nc descendente (c0 el mejor, c9 el peor) — para poder
// controlar el ranking del club del usuario a mano en cada test.
function ligaDePrueba(): Club[] {
  return Array.from({ length: 10 }, (_, i) => clubBase(`c${i}`, 90 - i * 5));
}

describe('asignarObjetivoTemporada', () => {
  it('le pide salir campeón al club de mayor nc de la liga', () => {
    const clubes = ligaDePrueba();
    const objetivo = asignarObjetivoTemporada(clubes[0], clubes);
    expect(objetivo.tipo).toBe('campeon');
  });

  it('le pide clasificar a copas a un club del tercio superior (sin ser el mejor)', () => {
    const clubes = ligaDePrueba();
    const objetivo = asignarObjetivoTemporada(clubes[1], clubes);
    expect(objetivo.tipo).toBe('clasificarCopa');
  });

  it('le pide evitar el descenso a un club del cuarto inferior de la tabla', () => {
    const clubes = ligaDePrueba();
    const objetivo = asignarObjetivoTemporada(clubes[9], clubes);
    expect(objetivo.tipo).toBe('evitarDescenso');
  });

  it('le pide la mitad superior de la tabla a un club de nivel intermedio', () => {
    const clubes = ligaDePrueba();
    const objetivo = asignarObjetivoTemporada(clubes[5], clubes);
    expect(objetivo.tipo).toBe('mitadTabla');
  });
});

describe('evaluarObjetivoTemporada', () => {
  it('campeón sólo se cumple terminando 1°', () => {
    const objetivo = { tipo: 'campeon' as const, descripcion: '' };
    expect(evaluarObjetivoTemporada(objetivo, 0, 10, false)).toBe(true);
    expect(evaluarObjetivoTemporada(objetivo, 1, 10, false)).toBe(false);
  });

  it('evitar el descenso se cumple con !descendido, sin importar la posición exacta', () => {
    const objetivo = { tipo: 'evitarDescenso' as const, descripcion: '' };
    expect(evaluarObjetivoTemporada(objetivo, 8, 10, false)).toBe(true);
    expect(evaluarObjetivoTemporada(objetivo, 9, 10, true)).toBe(false);
  });

  it('mitad de tabla se cumple terminando en la primera mitad', () => {
    const objetivo = { tipo: 'mitadTabla' as const, descripcion: '' };
    expect(evaluarObjetivoTemporada(objetivo, 4, 10, false)).toBe(true);
    expect(evaluarObjetivoTemporada(objetivo, 5, 10, false)).toBe(false);
  });
});

describe('actualizarConfianza', () => {
  it('sube al cumplir el objetivo, sin pasar de 100', () => {
    expect(actualizarConfianza(90, true)).toBe(100);
    expect(actualizarConfianza(50, true)).toBeGreaterThan(50);
  });

  it('baja al no cumplirlo, sin bajar de 0', () => {
    expect(actualizarConfianza(10, false)).toBe(0);
    expect(actualizarConfianza(50, false)).toBeLessThan(50);
  });

  it('arranca en un valor neutral, ni al borde del despido ni intocable', () => {
    expect(CONFIANZA_INICIAL).toBeGreaterThan(0);
    expect(CONFIANZA_INICIAL).toBeLessThan(100);
  });
});

describe('ajustarConfianzaPorPresupuesto', () => {
  it('no toca la confianza si el presupuesto no quedó negativo (pedido explícito: "no tengo penalizaciones si me paso del presupuesto")', () => {
    expect(ajustarConfianzaPorPresupuesto(70, 0)).toBe(70);
    expect(ajustarConfianzaPorPresupuesto(70, 1_000_000)).toBe(70);
  });

  it('resta si terminó en presupuesto negativo, sin bajar de 0', () => {
    expect(ajustarConfianzaPorPresupuesto(70, -1)).toBeLessThan(70);
    expect(ajustarConfianzaPorPresupuesto(5, -1_000_000)).toBe(0);
  });
});

describe('INCUMPLIMIENTOS_PARA_DESPIDO', () => {
  it('son 2 temporadas seguidas, según el documento de diseño', () => {
    expect(INCUMPLIMIENTOS_PARA_DESPIDO).toBe(2);
  });
});
