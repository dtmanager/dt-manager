import { describe, expect, it } from 'vitest';
import { armarAlineacionInicial, generarLigaConClubExistente, generarLigaInicial, generarPlantelClub } from '../liga';
import { CLUBES_LIGA_PROFESIONAL } from '../../data/clubesLigaProfesional';
import { CLUBES_PRIMERA_NACIONAL } from '../../data/clubesPrimeraNacional';

describe('generarLigaInicial', () => {
  it('genera un club por cada club base, cada uno con plantel y DT', () => {
    const { liga, clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');

    expect(liga.clubIds.length).toBe(CLUBES_LIGA_PROFESIONAL.length);
    expect(Object.keys(clubes).length).toBe(CLUBES_LIGA_PROFESIONAL.length);

    CLUBES_LIGA_PROFESIONAL.forEach((base) => {
      const club = clubes[base.id];
      expect(club).toBeDefined();
      expect(club.plantel.length).toBe(22); // ver COMPOSICION_PLANTEL en engine/liga.ts
      expect(club.titularesIds.length).toBe(11);
      // El resto del plantel, sin cupo fijo (pedido explícito).
      expect(club.suplentesIds.length).toBe(club.plantel.length - 11);
      expect(club.dt).toBeDefined();
    });
  });

  it('marca esControladoPorUsuario sólo en el club elegido, con el DT del usuario', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'river-plate', 'Marcelo Aguirre');

    expect(clubes['river-plate'].esControladoPorUsuario).toBe(true);
    expect(clubes['river-plate'].dt.nombre).toBe('Marcelo Aguirre');

    const otros = Object.values(clubes).filter((c) => c.id !== 'river-plate');
    otros.forEach((c) => {
      expect(c.esControladoPorUsuario).toBe(false);
      expect(c.dt.nombre).not.toBe('Marcelo Aguirre');
    });
  });

  it('los titulares elegidos son los de mejor GRL de cada puesto', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');
    const club = clubes['boca-juniors'];

    const arqueros = club.plantel.filter((j) => j.posicion === 'ARQ').sort((a, b) => b.grl - a.grl);
    const mejorArquero = arqueros[0];
    const arquerosTitulares = club.titularesIds
      .map((id) => club.plantel.find((j) => j.id === id)!)
      .filter((j) => j.posicion === 'ARQ');

    expect(arquerosTitulares).toHaveLength(1);
    expect(arquerosTitulares[0].id).toBe(mejorArquero.id);
  });

  it('cada plantel tiene dorsales únicos 1-99 (sistema de dorsales)', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');

    Object.values(clubes).forEach((club) => {
      const dorsales = club.plantel.map((j) => j.dorsal);
      expect(dorsales.every((d) => d != null && d >= 1 && d <= 99)).toBe(true);
      expect(new Set(dorsales).size).toBe(club.plantel.length);
    });
  });

  // Pedido explícito: "que las alineaciones del rival se sorteen cuando se
  // genere el club" — antes todos (IA incluida) arrancaban fijos en 4-4-2.
  it('sortea la formación de los clubes de la IA (no todos arrancan en 4-4-2)', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');

    const formacionesIA = Object.values(clubes)
      .filter((c) => !c.esControladoPorUsuario)
      .map((c) => c.formacion);
    // 30 clubes sorteando entre 21 formaciones — la chance de que salgan
    // los 30 exactamente iguales es ~0, así que más de una distinta es la
    // señal de que el sorteo está andando (no un valor fijo pisando todo).
    expect(new Set(formacionesIA).size).toBeGreaterThan(1);
  });

  it('el club del usuario siempre arranca en 4-4-2, elija lo que elija el sorteo para los demás', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');
    expect(clubes['boca-juniors'].formacion).toBe('4-4-2');
  });
});

describe('armarAlineacionInicial', () => {
  it('con una formación de línea de 3 sin carrileros (3-2-4-1), elige 3 DFC y ningún LI/LD', () => {
    const plantel = generarPlantelClub(75);
    const { titularesIds } = armarAlineacionInicial(plantel, '3-2-4-1');
    const titulares = titularesIds.map((id) => plantel.find((j) => j.id === id)!);

    expect(titulares.filter((j) => j.posicion === 'DFC')).toHaveLength(3);
    expect(titulares.filter((j) => j.posicion === 'LI')).toHaveLength(0);
    expect(titulares.filter((j) => j.posicion === 'LD')).toHaveLength(0);
    expect(titulares).toHaveLength(11);
  });

  it('sin formación explícita, arma la misma alineación que un 4-4-2', () => {
    const plantel = generarPlantelClub(75);
    const { titularesIds: titularesDefault } = armarAlineacionInicial(plantel);
    const { titularesIds: titulares442 } = armarAlineacionInicial(plantel, '4-4-2');
    expect(new Set(titularesDefault)).toEqual(new Set(titulares442));
  });
});

describe('generarLigaConClubExistente', () => {
  it('mete al club existente (con su plantel intacto) y saca a uno de la nueva liga para hacerle lugar', () => {
    const { clubes: clubesOriginales } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');
    const clubUsuario = clubesOriginales['boca-juniors'];
    const plantelOriginal = clubUsuario.plantel.map((j) => j.id);

    const { liga, clubes } = generarLigaConClubExistente(CLUBES_PRIMERA_NACIONAL, clubUsuario, 'Primera Nacional', 3);

    // Mismo tamaño que la liga de destino (uno sale, entra el del usuario).
    expect(liga.clubIds.length).toBe(CLUBES_PRIMERA_NACIONAL.length);
    expect(liga.temporadaActual).toBe(3);
    expect(liga.clubIds).toContain('boca-juniors');

    // El plantel del usuario no se regeneró.
    expect(clubes['boca-juniors'].plantel.map((j) => j.id)).toEqual(plantelOriginal);
    expect(clubes['boca-juniors'].esControladoPorUsuario).toBe(true);
    expect(clubes['boca-juniors'].liga).toBe('Primera Nacional');

    // Exactamente un club de la Primera Nacional original no entró.
    const idsOriginales = new Set(CLUBES_PRIMERA_NACIONAL.map((c) => c.id));
    const idsNuevaLiga = new Set(liga.clubIds.filter((id) => id !== 'boca-juniors'));
    const faltantes = [...idsOriginales].filter((id) => !idsNuevaLiga.has(id));
    expect(faltantes).toHaveLength(1);
  });

  it('no pisa al club del usuario cuando ese mismo id YA está en clubesBase (bug reportado: "ofertas de otros clubes extranjeros" — aceptar una oferta de un club de otra liga pasa exactamente esto, ese club sale de la lista real de esa liga)', () => {
    // clubUsuarioExistente con el mismo id que un club REAL de la liga
    // de destino (a propósito — simula el caso de aceptar una oferta de
    // un club que ya es parte de CLUBES_PRIMERA_NACIONAL).
    const idExistente = CLUBES_PRIMERA_NACIONAL[0].id;
    const { clubes: clubesOriginales } = generarLigaInicial(CLUBES_PRIMERA_NACIONAL, idExistente, 'DT Existente');
    const clubUsuario = { ...clubesOriginales[idExistente], esControladoPorUsuario: true };
    const plantelOriginal = clubUsuario.plantel.map((j) => j.id);

    const { liga, clubes } = generarLigaConClubExistente(CLUBES_PRIMERA_NACIONAL, clubUsuario, 'Primera Nacional', 5);

    // El club del usuario sigue siendo suyo — no lo pisó generarClub()
    // al procesar el resto de la lista.
    expect(clubes[idExistente].esControladoPorUsuario).toBe(true);
    expect(clubes[idExistente].plantel.map((j) => j.id)).toEqual(plantelOriginal);
    // No aparece duplicado ni contado dos veces en clubIds.
    expect(liga.clubIds.filter((id) => id === idExistente)).toHaveLength(1);
  });
});
