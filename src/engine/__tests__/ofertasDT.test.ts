import { describe, expect, it } from 'vitest';
import {
  candidatosOfertaDT, candidatosRescateDT, generarOfertasDT, generarOfertasRescate,
} from '../ofertasDT';
import type { Club, DT } from '../../types';

function dtBase(over: Partial<DT> = {}): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
    ...over,
  };
}

function club(over: Partial<Club>): Club {
  return {
    id: 'c', nombre: 'Club', liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel: [], formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
    ...over,
  };
}

describe('candidatosOfertaDT', () => {
  it('excluye al propio club del usuario', () => {
    const clubes = { usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 70 }) };
    expect(candidatosOfertaDT(clubes, 'usuario', 'Liga', false)).toHaveLength(0);
  });

  it('excluye clubes de otra liga cuando incluirExtranjeros es false', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      grande: club({ id: 'grande', liga: 'Otra Liga', nc: 90 }),
    };
    expect(candidatosOfertaDT(clubes, 'usuario', 'Liga', false)).toHaveLength(0);
  });

  it('incluye clubes de otra liga cuando incluirExtranjeros es true (pedido explícito: "ofertas de otros clubes extranjeros")', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      grande: club({ id: 'grande', liga: 'Otra Liga', nc: 90 }),
    };
    expect(candidatosOfertaDT(clubes, 'usuario', 'Liga', true).map((c) => c.id)).toEqual(['grande']);
  });

  it('excluye clubes claramente más chicos (pedido explícito: "por lo menos 4, 5 opciones" ensanchó el pool, pero no infinito)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 70 }),
      chico: club({ id: 'chico', nc: 50 }),
    };
    expect(candidatosOfertaDT(clubes, 'usuario', 'Liga', false)).toHaveLength(0);
  });

  it('incluye clubes parecidos o más grandes de la misma liga (ya no hace falta ser CLARAMENTE más grande)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      parecido: club({ id: 'parecido', nc: 62 }),
      grande: club({ id: 'grande', nc: 90 }),
    };
    expect(candidatosOfertaDT(clubes, 'usuario', 'Liga', false).map((c) => c.id).sort()).toEqual(['grande', 'parecido']);
  });
});

describe('generarOfertasDT', () => {
  it('no genera nada si no hay candidatos', () => {
    const clubes = { usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 90 }) };
    expect(generarOfertasDT(clubes, 'usuario', 'Liga', dtBase(), 90, 50, 1, () => 0)).toEqual([]);
  });

  it('no genera nada si el roll de azar no favorece la oferta', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      grande: club({ id: 'grande', nc: 90 }),
    };
    expect(generarOfertasDT(clubes, 'usuario', 'Liga', dtBase({ reputacion: 0 }), 50, 0, 1, () => 0.99)).toEqual([]);
  });

  it('genera entre 4 y 5 ofertas cuando el roll favorece y hay candidatos suficientes (pedido explícito: "por lo menos 4, 5 opciones")', () => {
    const clubes: Record<string, Club> = { usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }) };
    for (let i = 0; i < 10; i += 1) {
      clubes[`rival${i}`] = club({ id: `rival${i}`, nombre: `Rival ${i}`, nc: 65 });
    }
    const ofertas = generarOfertasDT(clubes, 'usuario', 'Liga', dtBase(), 50, 50, 3, () => 0);
    expect(ofertas.length).toBeGreaterThanOrEqual(4);
    expect(ofertas.length).toBeLessThanOrEqual(5);
    ofertas.forEach((o) => {
      expect(o.temporada).toBe(3);
      // Términos de contrato reales (pedido explícito, tarjetas de oferta
      // — ver la nota en OfertaDT/contratoDTInicial): salarioOfrecido/
      // duracionOfrecida vienen de contratoDTInicial(elegido.presupuesto).
      expect(o.salarioOfrecido).toBeGreaterThan(0);
      expect(o.duracionOfrecida).toBeGreaterThanOrEqual(2);
      expect(o.duracionOfrecida).toBeLessThanOrEqual(4);
    });
  });

  it('nunca genera más ofertas que candidatos disponibles', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      grande: club({ id: 'grande', nc: 90 }),
    };
    const ofertas = generarOfertasDT(clubes, 'usuario', 'Liga', dtBase(), 50, 50, 1, () => 0);
    expect(ofertas.length).toBeLessThanOrEqual(1);
  });

  it('con idolatría alta, un roll que fallaría en el caso base igual genera ofertas (reputación/confianza en 0 para aislar el efecto)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      grande: club({ id: 'grande', nc: 90 }),
    };
    // 0.3 está entre la prob base (0.18) y la prob con idolatría alta
    // (0.18 + 0.35 = 0.53) — sólo debería generar ofertas en el segundo caso.
    const dt = dtBase({ reputacion: 0 });
    expect(generarOfertasDT(clubes, 'usuario', 'Liga', dt, 50, 0, 1, () => 0.3)).toEqual([]);
    expect(generarOfertasDT(clubes, 'usuario', 'Liga', dt, 90, 0, 1, () => 0.3).length).toBeGreaterThan(0);
  });

  it('con reputación y confianza altas, un roll que fallaría en el caso base igual genera ofertas (idolatría baja para aislar el efecto)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      grande: club({ id: 'grande', nc: 90 }),
    };
    expect(generarOfertasDT(clubes, 'usuario', 'Liga', dtBase({ reputacion: 0 }), 0, 0, 1, () => 0.3)).toEqual([]);
    expect(generarOfertasDT(clubes, 'usuario', 'Liga', dtBase({ reputacion: 99 }), 0, 100, 1, () => 0.3).length).toBeGreaterThan(0);
  });

  it('con reputación baja, sólo aparecen ofertas de la liga local (pedido explícito: "segun tu grl de dt")', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      local: club({ id: 'local', nombre: 'Local FC', nc: 65 }),
      extranjero: club({
        id: 'extranjero', nombre: 'Extranjero FC', liga: 'Otra Liga', nc: 65,
      }),
    };
    const ofertas = generarOfertasDT(clubes, 'usuario', 'Liga', dtBase({ reputacion: 30 }), 100, 100, 1, () => 0);
    expect(ofertas.every((o) => o.clubLiga === 'Liga')).toBe(true);
  });

  it('con reputación alta, pueden aparecer ofertas de otra liga (pedido explícito: "ofertas de otros clubes extranjeros... segun tu grl")', () => {
    const clubes: Record<string, Club> = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      extranjero: club({
        id: 'extranjero', nombre: 'Extranjero FC', liga: 'Otra Liga', nc: 65,
      }),
    };
    const ofertas = generarOfertasDT(clubes, 'usuario', 'Liga', dtBase({ reputacion: 90 }), 100, 100, 1, () => 0);
    expect(ofertas.some((o) => o.clubLiga === 'Otra Liga')).toBe(true);
  });

  it('cada oferta trae la liga real del club (clubLiga)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 60 }),
      local: club({ id: 'local', nombre: 'Local FC', liga: 'Liga', nc: 65 }),
    };
    const [oferta] = generarOfertasDT(clubes, 'usuario', 'Liga', dtBase(), 100, 100, 1, () => 0);
    expect(oferta.clubLiga).toBe('Liga');
  });
});

describe('candidatosRescateDT', () => {
  it('incluye clubes de cualquier tamaño de la misma liga (a diferencia de candidatosOfertaDT)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 70 }),
      chico: club({ id: 'chico', nc: 40 }),
    };
    expect(candidatosRescateDT(clubes, 'usuario', 'Liga').map((c) => c.id)).toEqual(['chico']);
  });

  it('excluye clubes de otra liga', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true, nc: 70 }),
      otro: club({ id: 'otro', liga: 'Otra Liga', nc: 40 }),
    };
    expect(candidatosRescateDT(clubes, 'usuario', 'Liga')).toHaveLength(0);
  });
});

describe('generarOfertasRescate', () => {
  it('no genera nada si no hay candidatos', () => {
    const clubes = { usuario: club({ id: 'usuario', esControladoPorUsuario: true }) };
    expect(generarOfertasRescate(clubes, 'usuario', 'Liga', dtBase(), 100, 100, false, () => 0)).toEqual([]);
  });

  it('no genera nada si el roll de azar no favorece (rendimiento en 0, mínima probabilidad)', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true }),
      otro: club({ id: 'otro' }),
    };
    const dt = dtBase({ reputacion: 0 });
    expect(generarOfertasRescate(clubes, 'usuario', 'Liga', dt, 0, 0, false, () => 0.99)).toEqual([]);
  });

  it('genera al menos una oferta cuando el roll favorece y hay candidatos', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true }),
      otro: club({ id: 'otro', nombre: 'Otro FC', nc: 55 }),
    };
    const ofertas = generarOfertasRescate(clubes, 'usuario', 'Liga', dtBase(), 50, 50, false, () => 0);
    expect(ofertas.length).toBeGreaterThan(0);
    expect(ofertas[0]).toHaveProperty('clubNombre');
  });

  it('nunca genera más ofertas que candidatos disponibles', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true }),
      otro: club({ id: 'otro' }),
    };
    const ofertas = generarOfertasRescate(clubes, 'usuario', 'Liga', dtBase({ reputacion: 99 }), 100, 100, false, () => 0);
    expect(ofertas.length).toBeLessThanOrEqual(1);
  });

  it('garantizada=true genera oferta igual aunque el roll no favorezca (pedido explícito: "que si te despiden no termine tu carrera")', () => {
    const clubes = {
      usuario: club({ id: 'usuario', esControladoPorUsuario: true }),
      otro: club({ id: 'otro', nombre: 'Otro FC', nc: 55 }),
    };
    // Mismo escenario que el test de "no genera nada" de arriba (reputación/
    // idolatría/confianza en 0, roll en 0.99 — el peor caso posible), pero
    // con garantizada=true: tiene que devolver igual al menos una oferta.
    const dt = dtBase({ reputacion: 0 });
    const ofertas = generarOfertasRescate(clubes, 'usuario', 'Liga', dt, 0, 0, true, () => 0.99);
    expect(ofertas.length).toBeGreaterThan(0);
  });

  it('garantizada=true sigue sin generar nada si no hay ningún candidato', () => {
    const clubes = { usuario: club({ id: 'usuario', esControladoPorUsuario: true }) };
    expect(generarOfertasRescate(clubes, 'usuario', 'Liga', dtBase(), 100, 100, true, () => 0.99)).toEqual([]);
  });
});
