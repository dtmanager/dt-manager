import { describe, expect, it } from 'vitest';
import {
  abrirEtapaClub, actualizarCarreraPorPartidos, actualizarIdolatria, calcularApodo, carreraDTVacia, cerrarEtapaClub, nivelIdolatria,
  registrarCanterano, registrarFichaje, registrarTituloLigaSiCorresponde, registrarTituloSiCorresponde, titulosNuevosDesde,
} from '../carreraDT';
import type { Partido } from '../../types';

function partido(over: Partial<Partido> = {}): Partido {
  return {
    id: 'p', fecha: 1, localId: 'usuario', visitanteId: 'rival', golesLocal: 1, golesVisitante: 0, partidoImportante: false,
    ...over,
  };
}

describe('actualizarCarreraPorPartidos', () => {
  it('no cuenta nada si ninguno de los partidos nuevos era del club del usuario', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(
      carrera, [partido({ localId: 'rivalA', visitanteId: 'rivalB' })], 'usuario', 'equilibrado',
    );
    expect(resultado.partidosDirigidos).toBe(0);
  });

  it('cuenta un partido dirigido cuando el club del usuario jugó', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(carrera, [partido()], 'usuario', 'equilibrado');
    expect(resultado.partidosDirigidos).toBe(1);
  });

  it('cuenta un solo partido dirigido aunque haya varios partidos nuevos en la tanda (sólo uno propio)', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(
      carrera,
      [partido({ id: 'p1' }), partido({ id: 'p2', localId: 'rivalA', visitanteId: 'rivalB' })],
      'usuario',
      'equilibrado',
    );
    expect(resultado.partidosDirigidos).toBe(1);
  });

  it('suma al contador de mentalidad correcto', () => {
    const carrera = carreraDTVacia();
    const conOfensivo = actualizarCarreraPorPartidos(carrera, [partido()], 'usuario', 'ofensivo');
    expect(conOfensivo.vecesOfensivo).toBe(1);
    expect(conOfensivo.vecesDefensivo).toBe(0);
    expect(conOfensivo.vecesEquilibrado).toBe(0);
  });

  it('sin mentalidad definida cuenta como equilibrado', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(carrera, [partido()], 'usuario', undefined);
    expect(resultado.vecesEquilibrado).toBe(1);
  });

  it('suma los goles a favor del club del usuario', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(carrera, [partido({ golesLocal: 3 })], 'usuario', 'equilibrado');
    expect(resultado.golesAFavorCarrera).toBe(3);
  });

  it('usa golesVisitante cuando el club del usuario jugó de visitante', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(
      carrera,
      [partido({ localId: 'rival', visitanteId: 'usuario', golesLocal: 1, golesVisitante: 2 })],
      'usuario',
      'equilibrado',
    );
    expect(resultado.golesAFavorCarrera).toBe(2);
  });

  it('suma los goles de varios partidos propios en la misma tanda', () => {
    const carrera = carreraDTVacia();
    const resultado = actualizarCarreraPorPartidos(
      carrera,
      [partido({ id: 'p1', golesLocal: 2 }), partido({ id: 'p2', golesLocal: 1 })],
      'usuario',
      'equilibrado',
    );
    expect(resultado.golesAFavorCarrera).toBe(3);
  });
});

describe('nivelIdolatria', () => {
  it('devuelve Querido para valores bajos', () => {
    expect(nivelIdolatria(0).nombre).toBe('Querido');
    expect(nivelIdolatria(39).nombre).toBe('Querido');
  });

  it('devuelve Referente, Ídolo y Leyenda en los umbrales correctos', () => {
    expect(nivelIdolatria(40).nombre).toBe('Referente');
    expect(nivelIdolatria(65).nombre).toBe('Ídolo');
    expect(nivelIdolatria(85).nombre).toBe('Leyenda');
    expect(nivelIdolatria(100).nombre).toBe('Leyenda');
  });
});

describe('registrarTituloSiCorresponde', () => {
  it('agrega un título cuando el campeonId pasa de otro club (o null) al usuario', () => {
    const carrera = carreraDTVacia();
    const resultado = registrarTituloSiCorresponde(carrera, null, 'usuario', 'usuario', 'Copa Argentina', 1);
    expect(resultado.titulos).toEqual([{ competencia: 'Copa Argentina', temporada: 1 }]);
  });

  it('no agrega nada si el campeón sigue siendo otro club', () => {
    const carrera = carreraDTVacia();
    const resultado = registrarTituloSiCorresponde(carrera, null, 'rival', 'usuario', 'Copa Argentina', 1);
    expect(resultado.titulos).toHaveLength(0);
  });

  it('no agrega nada si el usuario YA era campeón antes (evita duplicar en llamadas repetidas)', () => {
    const carrera = carreraDTVacia();
    const resultado = registrarTituloSiCorresponde(carrera, 'usuario', 'usuario', 'usuario', 'Copa Argentina', 1);
    expect(resultado.titulos).toHaveLength(0);
  });
});

describe('registrarTituloLigaSiCorresponde', () => {
  it('no agrega nada si no es campeón', () => {
    const carrera = carreraDTVacia();
    const resultado = registrarTituloLigaSiCorresponde(carrera, false, 'Liga Profesional', 3);
    expect(resultado.titulos).toHaveLength(0);
  });

  it('agrega el título si es campeón', () => {
    const carrera = carreraDTVacia();
    const resultado = registrarTituloLigaSiCorresponde(carrera, true, 'Liga Profesional', 3);
    expect(resultado.titulos).toEqual([{ competencia: 'Liga Profesional', temporada: 3 }]);
  });

  it('es idempotente: no duplica si ya estaba registrado (mismo título, misma temporada)', () => {
    const conUno = registrarTituloLigaSiCorresponde(carreraDTVacia(), true, 'Liga Profesional', 3);
    const conDos = registrarTituloLigaSiCorresponde(conUno, true, 'Liga Profesional', 3);
    expect(conDos.titulos).toHaveLength(1);
  });

  it('sí agrega un título nuevo de la misma liga en otra temporada', () => {
    const conUno = registrarTituloLigaSiCorresponde(carreraDTVacia(), true, 'Liga Profesional', 3);
    const conDos = registrarTituloLigaSiCorresponde(conUno, true, 'Liga Profesional', 4);
    expect(conDos.titulos).toEqual([
      { competencia: 'Liga Profesional', temporada: 3 },
      { competencia: 'Liga Profesional', temporada: 4 },
    ]);
  });
});

describe('titulosNuevosDesde', () => {
  it('devuelve vacío si no se agregó ningún título', () => {
    const carrera = carreraDTVacia();
    expect(titulosNuevosDesde(carrera, carrera)).toEqual([]);
  });

  it('devuelve el título agregado', () => {
    const antes = carreraDTVacia();
    const despues = registrarTituloSiCorresponde(antes, null, 'usuario', 'usuario', 'Copa Argentina', 2);
    expect(titulosNuevosDesde(antes, despues)).toEqual([{ competencia: 'Copa Argentina', temporada: 2 }]);
  });

  it('devuelve sólo el título nuevo cuando ya había uno previo (no repite el viejo)', () => {
    const conUno = registrarTituloSiCorresponde(carreraDTVacia(), null, 'usuario', 'usuario', 'Copa Argentina', 1);
    const conDos = registrarTituloSiCorresponde(conUno, null, 'usuario', 'usuario', 'Liga Profesional', 2);
    expect(titulosNuevosDesde(conUno, conDos)).toEqual([{ competencia: 'Liga Profesional', temporada: 2 }]);
  });
});

describe('actualizarIdolatria', () => {
  it('sube fuerte al salir campeón', () => {
    const resultado = actualizarIdolatria(50, { campeon: true, objetivoCumplido: true, descendido: false });
    expect(resultado).toBeGreaterThan(60);
  });

  it('baja al no cumplir el objetivo', () => {
    const resultado = actualizarIdolatria(50, { campeon: false, objetivoCumplido: false, descendido: false });
    expect(resultado).toBeLessThan(50);
  });

  it('el descenso pega más fuerte todavía', () => {
    const conDescenso = actualizarIdolatria(50, { campeon: false, objetivoCumplido: false, descendido: true });
    const sinDescenso = actualizarIdolatria(50, { campeon: false, objetivoCumplido: false, descendido: false });
    expect(conDescenso).toBeLessThan(sinDescenso);
  });

  it('nunca sale del rango 0-100', () => {
    expect(actualizarIdolatria(95, { campeon: true, objetivoCumplido: true, descendido: false })).toBeLessThanOrEqual(100);
    expect(actualizarIdolatria(5, { campeon: false, objetivoCumplido: false, descendido: true })).toBeGreaterThanOrEqual(0);
  });
});

describe('calcularApodo', () => {
  it('no asigna apodo antes del mínimo de partidos', () => {
    const carrera = { ...carreraDTVacia(), partidosDirigidos: 5, titulos: [{ competencia: 'x', temporada: 1 }] };
    expect(calcularApodo(carrera)).toBeNull();
  });

  it('multicampeón le gana a campeón con 3+ títulos', () => {
    const carrera = {
      ...carreraDTVacia(),
      partidosDirigidos: 20,
      titulos: [{ competencia: 'a', temporada: 1 }, { competencia: 'b', temporada: 2 }, { competencia: 'c', temporada: 3 }],
    };
    expect(calcularApodo(carrera)?.id).toBe('multicampeon');
  });

  it('el tiburón sale cuando fichaste mucho más de lo que formaste cantera', () => {
    const carrera = {
      ...carreraDTVacia(), partidosDirigidos: 20, fichajesCarrera: 10, canteranosCarrera: 1, idolatria: 50,
    };
    expect(calcularApodo(carrera)?.id).toBe('tiburon');
  });

  it('el formador sale cuando formaste mucha más cantera que fichajes', () => {
    const carrera = {
      ...carreraDTVacia(), partidosDirigidos: 20, fichajesCarrera: 1, canteranosCarrera: 10, idolatria: 50,
    };
    expect(calcularApodo(carrera)?.id).toBe('formador');
  });

  it('el profesor es el default cuando no destacás en nada puntual', () => {
    const carrera = { ...carreraDTVacia(), partidosDirigidos: 20, idolatria: 50 };
    expect(calcularApodo(carrera)?.id).toBe('profesor');
  });

  it('el bicampeón sale con exactamente 2 títulos (no multicampeón)', () => {
    const carrera = {
      ...carreraDTVacia(),
      partidosDirigidos: 20,
      titulos: [{ competencia: 'a', temporada: 1 }, { competencia: 'b', temporada: 2 }],
    };
    expect(calcularApodo(carrera)?.id).toBe('bicampeon');
  });

  it('la leyenda le gana al ídolo con idolatría 85+', () => {
    const carrera = { ...carreraDTVacia(), partidosDirigidos: 20, idolatria: 85 };
    expect(calcularApodo(carrera)?.id).toBe('leyenda');
  });

  it('el ídolo sale entre 65 y 84 de idolatría', () => {
    const carrera = { ...carreraDTVacia(), partidosDirigidos: 20, idolatria: 70 };
    expect(calcularApodo(carrera)?.id).toBe('idolo');
  });

  it('el trotamundos sale con 3 clubes o más en el historial', () => {
    const etapa = {
      clubId: 'x', clubNombre: 'X', ligaNombre: 'L', temporadaInicio: 1, temporadaFin: 2, partidos: 20, goles: 5, idolatriaFinal: 50, titulos: [],
    };
    const carrera = {
      ...carreraDTVacia(), partidosDirigidos: 20, idolatria: 50, historialClubes: [etapa, etapa, etapa],
    };
    expect(calcularApodo(carrera)?.id).toBe('trotamundos');
  });

  it('el fiel sale con 100+ partidos y ningún club en el historial', () => {
    const carrera = { ...carreraDTVacia(), partidosDirigidos: 100, idolatria: 50, historialClubes: [] };
    expect(calcularApodo(carrera)?.id).toBe('fiel');
  });

  it('el artillero sale con 250+ goles a favor en la carrera', () => {
    const carrera = {
      ...carreraDTVacia(), partidosDirigidos: 20, idolatria: 50, golesAFavorCarrera: 250,
    };
    expect(calcularApodo(carrera)?.id).toBe('artillero');
  });

  it('el estratega sale jugando equilibrado casi siempre', () => {
    const carrera = {
      ...carreraDTVacia(), partidosDirigidos: 20, idolatria: 50, vecesEquilibrado: 15, vecesOfensivo: 2, vecesDefensivo: 2,
    };
    expect(calcularApodo(carrera)?.id).toBe('estratega');
  });
});

describe('abrirEtapaClub / cerrarEtapaClub', () => {
  it('cerrarEtapaClub no hace nada si no hay etapa en curso', () => {
    const carrera = carreraDTVacia();
    const resultado = cerrarEtapaClub(carrera, 50, 3);
    expect(resultado).toBe(carrera);
  });

  it('abre una etapa guardando el snapshot de los contadores actuales', () => {
    const carrera = {
      ...carreraDTVacia(), partidosDirigidos: 10, golesAFavorCarrera: 4, titulos: [{ competencia: 'x', temporada: 1 }],
    };
    const resultado = abrirEtapaClub(carrera, 'boca', 'Boca', 'Liga Profesional', 2);
    expect(resultado.etapaActual).toEqual({
      clubId: 'boca',
      clubNombre: 'Boca',
      ligaNombre: 'Liga Profesional',
      temporadaInicio: 2,
      partidosInicio: 10,
      golesInicio: 4,
      titulosInicioCount: 1,
    });
  });

  it('cierra la etapa calculando sólo lo que pasó en ese club (resta contra el snapshot)', () => {
    const abierta = abrirEtapaClub(carreraDTVacia(), 'boca', 'Boca', 'Liga Profesional', 2);
    const conProgreso = {
      ...abierta,
      partidosDirigidos: 30,
      golesAFavorCarrera: 45,
      titulos: [{ competencia: 'Liga Profesional', temporada: 3 }],
    };
    const cerrada = cerrarEtapaClub(conProgreso, 72, 4);
    expect(cerrada.historialClubes).toEqual([{
      clubId: 'boca',
      clubNombre: 'Boca',
      ligaNombre: 'Liga Profesional',
      temporadaInicio: 2,
      temporadaFin: 4,
      partidos: 30,
      goles: 45,
      idolatriaFinal: 72,
      titulos: [{ competencia: 'Liga Profesional', temporada: 3 }],
    }]);
    expect(cerrada.etapaActual).toBeNull();
  });

  it('resta correctamente contra el snapshot cuando ya venías con progreso acumulado de otro club', () => {
    const conRiver = {
      ...carreraDTVacia(), partidosDirigidos: 50, golesAFavorCarrera: 70, titulos: [{ competencia: 'Liga', temporada: 1 }],
    };
    const abiertaBoca = abrirEtapaClub(conRiver, 'boca', 'Boca', 'Liga Profesional', 3);
    const conProgresoBoca = { ...abiertaBoca, partidosDirigidos: 65, golesAFavorCarrera: 90 };
    const cerrada = cerrarEtapaClub(conProgresoBoca, 60, 5);
    expect(cerrada.historialClubes[0].partidos).toBe(15);
    expect(cerrada.historialClubes[0].goles).toBe(20);
    expect(cerrada.historialClubes[0].titulos).toEqual([]);
  });

  it('acumula varias etapas cerradas en orden', () => {
    let carrera = abrirEtapaClub(carreraDTVacia(), 'boca', 'Boca', 'Liga Profesional', 1);
    carrera = { ...carrera, partidosDirigidos: 20 };
    carrera = cerrarEtapaClub(carrera, 60, 2);
    carrera = abrirEtapaClub(carrera, 'river', 'River', 'Liga Profesional', 3);
    carrera = { ...carrera, partidosDirigidos: 35 };
    carrera = cerrarEtapaClub(carrera, 40, 4);
    expect(carrera.historialClubes.map((e) => e.clubNombre)).toEqual(['Boca', 'River']);
  });
});

describe('registrarFichaje / registrarCanterano', () => {
  it('suman uno a su contador respectivo sin tocar el otro', () => {
    const carrera = carreraDTVacia();
    const conFichaje = registrarFichaje(carrera);
    expect(conFichaje.fichajesCarrera).toBe(1);
    expect(conFichaje.canteranosCarrera).toBe(0);
    const conCanterano = registrarCanterano(carrera);
    expect(conCanterano.canteranosCarrera).toBe(1);
    expect(conCanterano.fichajesCarrera).toBe(0);
  });
});
