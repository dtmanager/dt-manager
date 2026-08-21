import { describe, expect, it } from 'vitest';
import {
  agregarNoticias, generarNoticiaConfianzaDirectiva, generarNoticiasContrato, generarNoticiasDestacado, generarNoticiasFichaje,
  generarNoticiasGoleador, generarNoticiasJoya, generarNoticiasResultado, generarRumoresMercado, TOPE_NOTICIAS,
} from '../noticias';
import type { FilaGoleador } from '../estadisticasPartido';
import type { MovimientoMercadoIA } from '../mercadoIA';
import type {
  Club, DT, GolPartido, Jugador, NoticiaItem, Partido,
} from '../../types';

function jugadorBase(over: Partial<Jugador>): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 1000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 0, salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    ...over,
  };
}

function dtBase(over: Partial<DT>): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
    ...over,
  };
}

function clubBase(over: Partial<Club>): Club {
  return {
    id: 'c', nombre: 'Test FC', liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel: [], formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase({}),
    esControladoPorUsuario: false,
    ...over,
  };
}

function partidoBase(over: Partial<Partido>): Partido {
  return {
    id: 'p1', fecha: 5, localId: 'local', visitanteId: 'visitante', golesLocal: 1, golesVisitante: 0,
    partidoImportante: false,
    ...over,
  };
}

describe('generarNoticiasResultado', () => {
  it('siempre genera noticia del partido del usuario, aunque no sea sorpresa', () => {
    const local = clubBase({ id: 'local', nombre: 'Mi Club', nc: 70 });
    const visitante = clubBase({ id: 'visitante', nombre: 'Rival', nc: 72 });
    const partido = partidoBase({ golesLocal: 1, golesVisitante: 0 });
    const noticias = generarNoticiasResultado([partido], { local, visitante }, 'local', 1);
    expect(noticias).toHaveLength(1);
    expect(noticias[0].categoria).toBe('resultado');
  });

  it('no genera noticia de un partido ajeno sin sorpresa (nc parejo)', () => {
    const local = clubBase({ id: 'local', nombre: 'A', nc: 70 });
    const visitante = clubBase({ id: 'visitante', nombre: 'B', nc: 72 });
    const partido = partidoBase({ golesLocal: 2, golesVisitante: 1 });
    const noticias = generarNoticiasResultado([partido], { local, visitante }, 'otro-club', 1);
    expect(noticias).toHaveLength(0);
  });

  it('genera noticia "grande" cuando un equipo muy inferior le gana al favorito', () => {
    const local = clubBase({ id: 'local', nombre: 'Chico', nc: 45 });
    const visitante = clubBase({ id: 'visitante', nombre: 'Grande', nc: 85 });
    const partido = partidoBase({ golesLocal: 2, golesVisitante: 1 });
    const noticias = generarNoticiasResultado([partido], { local, visitante }, 'otro-club', 1);
    expect(noticias).toHaveLength(1);
    expect(noticias[0].peso).toBe('grande');
    expect(noticias[0].titulo).toContain('Sorpresa');
  });
});

describe('generarNoticiasGoleador', () => {
  const fila = (over: Partial<FilaGoleador>): FilaGoleador => ({
    jugadorId: 'j1', nombre: 'Fulano', clubId: 'c1', clubNombre: 'Club 1', pj: 5, goles: 5, asistencias: 1, ...over,
  });

  it('detecta cambio de líder', () => {
    const antes = [fila({ jugadorId: 'j1', goles: 5 }), fila({ jugadorId: 'j2', nombre: 'Mengano', goles: 4 })];
    const despues = [fila({ jugadorId: 'j2', nombre: 'Mengano', goles: 6 }), fila({ jugadorId: 'j1', goles: 5 })];
    const noticias = generarNoticiasGoleador(antes, despues, 1, 10);
    const deLider = noticias.filter((n) => n.id.startsWith('goleador-lider'));
    expect(deLider).toHaveLength(1);
    expect(deLider[0].jugadorId).toBe('j2');
  });

  it('detecta hito redondo de goles (10)', () => {
    const antes = [fila({ jugadorId: 'j1', goles: 9 })];
    const despues = [fila({ jugadorId: 'j1', goles: 10 })];
    const noticias = generarNoticiasGoleador(antes, despues, 1, 10);
    const deHito = noticias.filter((n) => n.id.includes('hito'));
    expect(deHito).toHaveLength(1);
    expect(deHito[0].titulo).toContain('10 goles');
  });

  it('no genera nada si no hay cambio de líder ni hito', () => {
    const antes = [fila({ jugadorId: 'j1', goles: 5 })];
    const despues = [fila({ jugadorId: 'j1', goles: 6 })];
    expect(generarNoticiasGoleador(antes, despues, 1, 10)).toHaveLength(0);
  });
});

describe('generarNoticiasDestacado', () => {
  it('detecta un hat-trick', () => {
    const local = clubBase({
      id: 'local',
      nombre: 'Local FC',
      plantel: [jugadorBase({ id: 'j1', nombre: 'Crack' })],
    });
    const visitante = clubBase({ id: 'visitante', nombre: 'Visitante FC' });
    const goles: GolPartido[] = [
      { equipo: 'local', jugadorId: 'j1', minuto: 10 },
      { equipo: 'local', jugadorId: 'j1', minuto: 40 },
      { equipo: 'local', jugadorId: 'j1', minuto: 70 },
    ];
    const partido = partidoBase({ golesLocal: 3, golesVisitante: 0, goles });
    // clubUsuarioId 'otro-club' (ninguno de los dos que jugaron) a propósito:
    // el hat-trick tiene que verse aunque el partido sea ajeno al usuario.
    const noticias = generarNoticiasDestacado([partido], { local, visitante }, 'otro-club', 1);
    const hattrick = noticias.filter((n) => n.id.includes('hattrick'));
    expect(hattrick).toHaveLength(1);
    expect(hattrick[0].peso).toBe('grande');
    expect(hattrick[0].jugadorId).toBe('j1');
  });

  it('detecta gol + asistencia del mismo jugador en el partido', () => {
    const local = clubBase({
      id: 'local',
      nombre: 'Local FC',
      plantel: [
        jugadorBase({ id: 'j1', nombre: 'Goleador' }),
        jugadorBase({ id: 'j2', nombre: 'Asistidor' }),
      ],
    });
    const visitante = clubBase({ id: 'visitante', nombre: 'Visitante FC' });
    const goles: GolPartido[] = [
      { equipo: 'local', jugadorId: 'j1', asistenciaId: 'j2', minuto: 10 },
      { equipo: 'local', jugadorId: 'j2', asistenciaId: 'j1', minuto: 50 },
    ];
    const partido = partidoBase({ golesLocal: 2, golesVisitante: 0, goles });
    const noticias = generarNoticiasDestacado([partido], { local, visitante }, 'local', 1);
    const combo = noticias.filter((n) => n.id.includes('golyasistencia'));
    // j1 metió 1 y asistió 1, j2 metió 1 y asistió 1 -> ambos califican
    expect(combo.length).toBeGreaterThanOrEqual(1);
  });

  it('NO genera gol+asistencia si el partido es ajeno al club del usuario (evita ruido)', () => {
    const local = clubBase({
      id: 'local',
      nombre: 'Local FC',
      plantel: [
        jugadorBase({ id: 'j1', nombre: 'Goleador' }),
        jugadorBase({ id: 'j2', nombre: 'Asistidor' }),
      ],
    });
    const visitante = clubBase({ id: 'visitante', nombre: 'Visitante FC' });
    const goles: GolPartido[] = [
      { equipo: 'local', jugadorId: 'j1', asistenciaId: 'j2', minuto: 10 },
      { equipo: 'local', jugadorId: 'j2', asistenciaId: 'j1', minuto: 50 },
    ];
    const partido = partidoBase({ golesLocal: 2, golesVisitante: 0, goles });
    const noticias = generarNoticiasDestacado([partido], { local, visitante }, 'otro-club', 1);
    expect(noticias.filter((n) => n.id.includes('golyasistencia'))).toHaveLength(0);
  });

  it('detecta valla invicta del arquero en una victoria del club del usuario', () => {
    const local = clubBase({
      id: 'local',
      nombre: 'Local FC',
      titularesIds: ['arq1'],
      plantel: [jugadorBase({ id: 'arq1', nombre: 'Golero', posicion: 'ARQ' })],
    });
    const visitante = clubBase({ id: 'visitante', nombre: 'Visitante FC' });
    const partido = partidoBase({ golesLocal: 1, golesVisitante: 0, goles: [{ equipo: 'local', jugadorId: 'x', minuto: 30 }] });
    const noticias = generarNoticiasDestacado([partido], { local, visitante }, 'local', 1);
    const valla = noticias.filter((n) => n.id.includes('valla'));
    expect(valla).toHaveLength(1);
    expect(valla[0].jugadorId).toBe('arq1');
  });

  it('NO genera valla invicta si el partido es ajeno al club del usuario (evita ruido)', () => {
    const local = clubBase({
      id: 'local',
      nombre: 'Local FC',
      titularesIds: ['arq1'],
      plantel: [jugadorBase({ id: 'arq1', nombre: 'Golero', posicion: 'ARQ' })],
    });
    const visitante = clubBase({ id: 'visitante', nombre: 'Visitante FC' });
    const partido = partidoBase({ golesLocal: 1, golesVisitante: 0, goles: [{ equipo: 'local', jugadorId: 'x', minuto: 30 }] });
    const noticias = generarNoticiasDestacado([partido], { local, visitante }, 'otro-club', 1);
    expect(noticias.filter((n) => n.id.includes('valla'))).toHaveLength(0);
  });
});

describe('generarNoticiasFichaje', () => {
  it('escala el peso según el monto', () => {
    const movs: MovimientoMercadoIA[] = [
      {
        jugadorId: 'j1', jugadorNombre: 'Barato', clubOrigenId: 'a', clubOrigenNombre: 'A',
        clubDestinoNombre: 'B', monto: 500_000, tipo: 'domestico',
      },
      {
        jugadorId: 'j2', jugadorNombre: 'Carazo', clubOrigenId: 'c', clubOrigenNombre: 'C',
        clubDestinoNombre: 'D', monto: 20_000_000, tipo: 'domestico',
      },
    ];
    const noticias = generarNoticiasFichaje(movs, 1, 10);
    expect(noticias.find((n) => n.jugadorId === 'j1')?.peso).toBe('rutinario');
    expect(noticias.find((n) => n.jugadorId === 'j2')?.peso).toBe('grande');
  });

  it('se queda sólo con los de mayor monto si hay muchos movimientos (evita ruido)', () => {
    const movs: MovimientoMercadoIA[] = Array.from({ length: 20 }, (_, i) => ({
      jugadorId: `j${i}`, jugadorNombre: `Jugador ${i}`, clubOrigenId: `c${i}`, clubOrigenNombre: `Club ${i}`,
      clubDestinoNombre: 'Destino', monto: i * 1_000_000, tipo: 'domestico' as const,
    }));
    const noticias = generarNoticiasFichaje(movs, 1, 10);
    expect(noticias).toHaveLength(5);
    // Los 5 de mayor monto: j19..j15.
    expect(noticias.map((n) => n.jugadorId).sort()).toEqual(['j15', 'j16', 'j17', 'j18', 'j19'].sort());
  });
});

describe('generarRumoresMercado', () => {
  it('sólo sortea entre jugadores transferibles sin movimiento real esta ventana', () => {
    const clubUsuario = clubBase({ id: 'usuario', nombre: 'Mi club', plantel: [jugadorBase({ id: 'ju', transferible: true })] });
    const rival = clubBase({
      id: 'rival',
      nombre: 'Rival FC',
      plantel: [
        jugadorBase({ id: 'j1', nombre: 'Listado', transferible: true }),
        jugadorBase({ id: 'j2', nombre: 'NoListado', transferible: false }),
        jugadorBase({ id: 'j3', nombre: 'YaSeFue', transferible: true }),
      ],
    });
    const movimientos: MovimientoMercadoIA[] = [
      { jugadorId: 'j3', jugadorNombre: 'YaSeFue', clubOrigenId: 'rival', clubOrigenNombre: 'Rival FC', clubDestinoNombre: 'X', monto: 1000, tipo: 'domestico' },
    ];
    const clubes = { usuario: clubUsuario, rival };
    const rumores = generarRumoresMercado(clubes, ['usuario', 'rival'], 'usuario', movimientos, 1, 10);
    // El club del usuario nunca aporta candidatos, y j3 (con movimiento real) tampoco.
    expect(rumores.every((r) => r.jugadorId !== 'j3')).toBe(true);
    expect(rumores.every((r) => r.jugadorId !== 'ju')).toBe(true);
    rumores.forEach((r) => expect(r.esRumor).toBe(true));
  });

  it('no revienta si no hay candidatos', () => {
    const clubUsuario = clubBase({ id: 'usuario' });
    expect(generarRumoresMercado({ usuario: clubUsuario }, ['usuario'], 'usuario', [], 1, 10)).toHaveLength(0);
  });
});

describe('generarNoticiasJoya', () => {
  it('detecta una suba fuerte de grl en un jugador joven', () => {
    const antes = clubBase({
      id: 'c1',
      plantel: [jugadorBase({ id: 'j1', nombre: 'Pibe', edad: 18, grl: 60 })],
    });
    const despues = clubBase({
      id: 'c1',
      plantel: [jugadorBase({ id: 'j1', nombre: 'Pibe', edad: 19, grl: 67 })],
    });
    const noticias = generarNoticiasJoya(antes, despues, 1);
    expect(noticias).toHaveLength(1);
    expect(noticias[0].categoria).toBe('joya');
  });

  it('no genera nada si la suba es chica', () => {
    const antes = clubBase({ plantel: [jugadorBase({ id: 'j1', edad: 18, grl: 60 })] });
    const despues = clubBase({ plantel: [jugadorBase({ id: 'j1', edad: 19, grl: 62 })] });
    expect(generarNoticiasJoya(antes, despues, 1)).toHaveLength(0);
  });

  it('no genera nada para un jugador grande (no joven, no esJoya) aunque suba fuerte', () => {
    const antes = clubBase({ plantel: [jugadorBase({ id: 'j1', edad: 30, grl: 70, esJoya: false })] });
    const despues = clubBase({ plantel: [jugadorBase({ id: 'j1', edad: 31, grl: 78, esJoya: false })] });
    expect(generarNoticiasJoya(antes, despues, 1)).toHaveLength(0);
  });
});

describe('agregarNoticias', () => {
  const noticia = (id: string): NoticiaItem => ({
    id, categoria: 'resultado', peso: 'rutinario', temporada: 1, fecha: 1, titulo: id, cuerpo: id, clubIds: [],
  });

  it('antepone las nuevas y recorta al tope', () => {
    const actuales = [noticia('vieja-1'), noticia('vieja-2')];
    const nuevas = [noticia('nueva-1')];
    const resultado = agregarNoticias(actuales, nuevas);
    expect(resultado[0].id).toBe('nueva-1');
    expect(resultado).toHaveLength(3);
  });

  it('nunca supera TOPE_NOTICIAS', () => {
    const actuales = Array.from({ length: TOPE_NOTICIAS }, (_, i) => noticia(`vieja-${i}`));
    const nuevas = [noticia('nueva-1'), noticia('nueva-2')];
    const resultado = agregarNoticias(actuales, nuevas);
    expect(resultado).toHaveLength(TOPE_NOTICIAS);
    expect(resultado[0].id).toBe('nueva-1');
  });

  it('si no hay noticias nuevas, devuelve las actuales sin cambios', () => {
    const actuales = [noticia('a')];
    expect(agregarNoticias(actuales, [])).toBe(actuales);
  });
});

describe('generarNoticiaConfianzaDirectiva', () => {
  it('genera una noticia cuando la confianza cruza el umbral hacia abajo', () => {
    const noticias = generarNoticiaConfianzaDirectiva(50, 25, 'club-usuario', 1);
    expect(noticias).toHaveLength(1);
    expect(noticias[0].categoria).toBe('directiva');
    expect(noticias[0].clubIds).toEqual(['club-usuario']);
  });

  it('no genera nada si la confianza ya estaba baja (no es un cruce nuevo)', () => {
    expect(generarNoticiaConfianzaDirectiva(20, 10, 'club-usuario', 1)).toHaveLength(0);
  });

  it('no genera nada si la confianza baja pero se mantiene sobre el umbral', () => {
    expect(generarNoticiaConfianzaDirectiva(80, 65, 'club-usuario', 1)).toHaveLength(0);
  });

  it('no genera nada si la confianza sube', () => {
    expect(generarNoticiaConfianzaDirectiva(20, 40, 'club-usuario', 1)).toHaveLength(0);
  });
});

describe('generarNoticiasContrato', () => {
  it('no genera nada si no hubo renovaciones ni vencimientos', () => {
    expect(generarNoticiasContrato([], [], 'club-usuario', 3)).toHaveLength(0);
  });

  it('genera una noticia de categoría "contrato" por cada renovación automática', () => {
    const renovados = [jugadorBase({ id: 'j1', nombre: 'Arquero Salvado', posicion: 'ARQ' })];
    const noticias = generarNoticiasContrato(renovados, [], 'club-usuario', 3);
    expect(noticias).toHaveLength(1);
    expect(noticias[0].categoria).toBe('contrato');
    expect(noticias[0].jugadorId).toBe('j1');
    expect(noticias[0].clubIds).toEqual(['club-usuario']);
    expect(noticias[0].titulo).toContain('Arquero Salvado');
  });

  it('genera una noticia por cada vencimiento', () => {
    const liberados = [jugadorBase({ id: 'j2', nombre: 'Se Fue Libre' })];
    const noticias = generarNoticiasContrato([], liberados, 'club-usuario', 3);
    expect(noticias).toHaveLength(1);
    expect(noticias[0].categoria).toBe('contrato');
    expect(noticias[0].jugadorId).toBe('j2');
    expect(noticias[0].titulo).toContain('Se Fue Libre');
  });

  it('combina renovaciones y vencimientos en la misma llamada', () => {
    const renovados = [jugadorBase({ id: 'j1', nombre: 'Renovado' })];
    const liberados = [jugadorBase({ id: 'j2', nombre: 'Liberado' })];
    const noticias = generarNoticiasContrato(renovados, liberados, 'club-usuario', 3);
    expect(noticias).toHaveLength(2);
    expect(noticias.map((n) => n.jugadorId).sort()).toEqual(['j1', 'j2']);
  });
});
