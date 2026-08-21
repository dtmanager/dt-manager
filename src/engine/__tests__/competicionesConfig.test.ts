import { describe, expect, it } from 'vitest';
import { ligaInferiorDe, ligaSuperiorDe } from '../competicionesConfig';

describe('ligaSuperiorDe', () => {
  it('sigue funcionando 1 a 1 para los países con sólo 2 divisiones (Premier League, LaLiga, etc.)', () => {
    expect(ligaSuperiorDe('Championship (2ª división)')).toBe('Premier League');
    expect(ligaSuperiorDe('Segunda División (2ª división)')).toBe('LaLiga');
  });

  it('Torneo Federal A y Primera B Metropolitana ascienden a Primera Nacional (pedido explícito: "los equipos del federal A y la b metropolitana no ascienden")', () => {
    expect(ligaSuperiorDe('Torneo Federal A')).toBe('Primera Nacional');
    expect(ligaSuperiorDe('Primera B Metropolitana')).toBe('Primera Nacional');
  });

  it('null para una liga sin superior configurada', () => {
    expect(ligaSuperiorDe('Liga Profesional')).toBeNull();
  });
});

describe('ligaInferiorDe', () => {
  it('Primera Nacional sigue sin descenso configurado (no hay forma de elegir entre las dos terceras divisiones en paralelo)', () => {
    expect(ligaInferiorDe('Primera Nacional')).toBeNull();
  });

  it('Liga Profesional sigue bajando a Primera Nacional, sin cambios', () => {
    expect(ligaInferiorDe('Liga Profesional')).toBe('Primera Nacional');
  });
});
