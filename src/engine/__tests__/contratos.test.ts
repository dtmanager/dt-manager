import { describe, expect, it } from 'vitest';
import {
  asignarContrato, avanzarContratos, avanzarContratosIA, calcularSalarioJusto, hayCupo, PISO_ARQUEROS, probabilidadAceptarRenovacion,
  puedeLiberarSinRomperPiso, puedeRenovar, renovarContrato, TOPE_PLANTEL, TOPE_PLANTEL_MINIMO,
} from '../contratos';
import type { Club, DT, Jugador } from '../../types';

function jugadorBase(over: Partial<Jugador>): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 100000,
    clubId: 'c', esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    ...over,
  };
}

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function clubBase(over: Partial<Club>): Club {
  return {
    id: 'c', nombre: 'Test FC', liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel: [], formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
    ...over,
  };
}

// Plantel "de sobra" (2 arqueros + 15 de campo, todos con contrato largo)
// para tests que no son sobre el piso obligatorio — sin esto, liberar a
// un solo jugador de un plantel chico de test dispara el piso (ver
// describe('piso obligatorio de plantel') más abajo) y ensucia el
// resultado de tests que no lo están probando.
function plantelHolgado(): Jugador[] {
  const arqueros = [
    jugadorBase({ id: 'arq1', posicion: 'ARQ', contratoAniosRestantes: 5 }),
    jugadorBase({ id: 'arq2', posicion: 'ARQ', contratoAniosRestantes: 5 }),
  ];
  const resto = Array.from({ length: 15 }, (_, i) => jugadorBase({ id: `relleno${i}`, contratoAniosRestantes: 5 }));
  return [...arqueros, ...resto];
}

describe('avanzarContratos', () => {
  it('descuenta un año a los contratos vigentes', () => {
    const club = clubBase({ plantel: [jugadorBase({ id: '1', contratoAniosRestantes: 3 })] });
    const { club: clubNuevo } = avanzarContratos(club);
    expect(clubNuevo.plantel[0].contratoAniosRestantes).toBe(2);
  });

  it('libera a los jugadores cuyo contrato llega a 0 (con plantel de sobra, no dispara el piso)', () => {
    const club = clubBase({
      plantel: [...plantelHolgado(), jugadorBase({ id: '1', contratoAniosRestantes: 1 })],
      titularesIds: ['1'],
    });
    const { club: clubNuevo, liberados } = avanzarContratos(club);
    expect(clubNuevo.plantel.find((j) => j.id === '1')).toBeUndefined();
    expect(clubNuevo.titularesIds).toHaveLength(0);
    expect(liberados).toHaveLength(1);
    expect(liberados[0].clubId).toBeNull();
  });
});

describe('piso obligatorio de plantel (pedido explícito: "2 arqueros y 11 titulares y 5 suplentes")', () => {
  it('avanzarContratos NO libera al arquero si eso dejaría menos de 2 en el plantel', () => {
    const club = clubBase({
      plantel: [
        ...plantelHolgado().filter((j) => j.id !== 'arq2'), // sólo 1 arquero de sobra
        jugadorBase({ id: 'arq2', posicion: 'ARQ', contratoAniosRestantes: 1 }), // el 2do, a punto de vencer
      ],
    });
    const { club: clubNuevo, liberados } = avanzarContratos(club);
    expect(clubNuevo.plantel.filter((j) => j.posicion === 'ARQ')).toHaveLength(PISO_ARQUEROS);
    expect(liberados.find((j) => j.id === 'arq2')).toBeUndefined();
    // Se salva con una renovación corta, no queda con 0 años.
    expect(clubNuevo.plantel.find((j) => j.id === 'arq2')?.contratoAniosRestantes).toBeGreaterThan(0);
  });

  it('avanzarContratos NO deja el plantel por debajo de TOPE_PLANTEL_MINIMO aunque venzan varios contratos', () => {
    // Plantel de exactamente 16 (el mínimo), con contratos por vencer.
    const plantel = [
      jugadorBase({ id: 'arq1', posicion: 'ARQ', contratoAniosRestantes: 5 }),
      jugadorBase({ id: 'arq2', posicion: 'ARQ', contratoAniosRestantes: 5 }),
      ...Array.from({ length: 14 }, (_, i) => jugadorBase({ id: `j${i}`, contratoAniosRestantes: 1 })),
    ];
    const club = clubBase({ plantel });
    const { club: clubNuevo } = avanzarContratos(club);
    expect(clubNuevo.plantel.length).toBeGreaterThanOrEqual(TOPE_PLANTEL_MINIMO);
  });

  it('avanzarContratosIA también respeta el piso como backstop, después del sorteo de retención', () => {
    const club = clubBase({
      plantel: [
        jugadorBase({ id: 'arq1', posicion: 'ARQ', contratoAniosRestantes: 1 }),
        jugadorBase({ id: 'arq2', posicion: 'ARQ', contratoAniosRestantes: 1 }),
      ],
    });
    const { club: clubNuevo } = avanzarContratosIA(club);
    // Aunque el sorteo de retención (75%) falle para los dos, el piso los
    // salva igual — nunca puede terminar con menos de 2 arqueros si
    // arrancó con 2.
    expect(clubNuevo.plantel.filter((j) => j.posicion === 'ARQ')).toHaveLength(2);
  });
});

describe('puedeLiberarSinRomperPiso', () => {
  it('bloquea vender un arquero si el plantel tiene justo 2 (el piso)', () => {
    const club = clubBase({ plantel: plantelHolgado() }); // 2 arqueros exactos
    expect(puedeLiberarSinRomperPiso(club, 'arq1')).toBe(false); // dejaría sólo 1
  });

  it('permite vender un arquero si hay un tercero de sobra', () => {
    const club = clubBase({ plantel: [...plantelHolgado(), jugadorBase({ id: 'arq3', posicion: 'ARQ' })] }); // 3 arqueros
    expect(puedeLiberarSinRomperPiso(club, 'arq1')).toBe(true); // quedan 2
  });

  it('permite vender un jugador de campo si el plantel sigue por encima del mínimo', () => {
    const club = clubBase({ plantel: plantelHolgado() }); // 17 en total
    expect(puedeLiberarSinRomperPiso(club, 'relleno0')).toBe(true);
  });

  it('bloquea vender si el plantel quedaría justo por debajo de TOPE_PLANTEL_MINIMO', () => {
    const plantel = [
      jugadorBase({ id: 'arq1', posicion: 'ARQ' }),
      jugadorBase({ id: 'arq2', posicion: 'ARQ' }),
      ...Array.from({ length: 14 }, (_, i) => jugadorBase({ id: `j${i}` })), // total 16, el mínimo justo
    ];
    const club = clubBase({ plantel });
    expect(puedeLiberarSinRomperPiso(club, 'j0')).toBe(false);
  });
});

describe('asignarContrato', () => {
  it('le pone club, contrato y salario a un jugador libre', () => {
    const libre = jugadorBase({ clubId: null, contratoAniosRestantes: 0, salario: 0, valorMercado: 50000 });
    const fichado = asignarContrato(libre, 'nuevo-club');
    expect(fichado.clubId).toBe('nuevo-club');
    expect(fichado.contratoAniosRestantes).toBeGreaterThanOrEqual(1);
    expect(fichado.contratoAniosRestantes).toBeLessThanOrEqual(4);
    expect(fichado.salario).toBeGreaterThan(0);
  });

  it('usa aniosElegidos cuando se pasa (pedido explícito: elegir años al fichar)', () => {
    const libre = jugadorBase({ clubId: null, contratoAniosRestantes: 0, salario: 0 });
    expect(asignarContrato(libre, 'nuevo-club', undefined, 5).contratoAniosRestantes).toBe(5);
    expect(asignarContrato(libre, 'nuevo-club', undefined, 1).contratoAniosRestantes).toBe(1);
  });
});

describe('hayCupo', () => {
  it('es true por debajo del tope y false en el tope', () => {
    const clubChico = clubBase({ plantel: [jugadorBase({ id: '1' })] });
    expect(hayCupo(clubChico)).toBe(true);

    const plantelLleno = Array.from({ length: TOPE_PLANTEL }, (_, i) => jugadorBase({ id: `j${i}` }));
    const clubLleno = clubBase({ plantel: plantelLleno });
    expect(hayCupo(clubLleno)).toBe(false);
  });
});

describe('puedeRenovar', () => {
  it('sólo con 1 o 2 años restantes', () => {
    expect(puedeRenovar(jugadorBase({ contratoAniosRestantes: 2 }))).toBe(true);
    expect(puedeRenovar(jugadorBase({ contratoAniosRestantes: 1 }))).toBe(true);
    expect(puedeRenovar(jugadorBase({ contratoAniosRestantes: 3 }))).toBe(false);
    expect(puedeRenovar(jugadorBase({ contratoAniosRestantes: 0 }))).toBe(false);
  });
});

describe('probabilidadAceptarRenovacion', () => {
  it('una oferta acorde a lo esperado tiene buenas chances', () => {
    expect(probabilidadAceptarRenovacion(1000, 1000)).toBeGreaterThan(0.7);
  });

  it('una oferta muy baja casi no tiene chances', () => {
    expect(probabilidadAceptarRenovacion(100, 1000)).toBeLessThan(0.2);
  });

  it('siempre queda entre 0 y 1', () => {
    expect(probabilidadAceptarRenovacion(0, 1000)).toBeGreaterThanOrEqual(0);
    expect(probabilidadAceptarRenovacion(1_000_000, 1000)).toBeLessThanOrEqual(1);
  });

  it('pedir más de 3 años baja la probabilidad, mismo monto (pedido explícito: elegir años al renovar)', () => {
    const con3 = probabilidadAceptarRenovacion(1000, 1000, 3);
    const con5 = probabilidadAceptarRenovacion(1000, 1000, 5);
    expect(con5).toBeLessThan(con3);
  });

  it('pedir 3 años o menos no penaliza (3 es el punto de referencia)', () => {
    const con3 = probabilidadAceptarRenovacion(1000, 1000, 3);
    const con1 = probabilidadAceptarRenovacion(1000, 1000, 1);
    expect(con1).toBe(con3);
  });
});

describe('renovarContrato', () => {
  it('sin aniosElegidos, usa el default de 3 años (antes salía sorteado 2-4)', () => {
    const jugador = jugadorBase({ contratoAniosRestantes: 1, salario: 500 });
    const renovado = renovarContrato(jugador, 900);
    expect(renovado.contratoAniosRestantes).toBe(3);
    expect(renovado.salario).toBe(900);
  });

  it('usa aniosElegidos cuando se pasa (pedido explícito: elegir años al renovar)', () => {
    const jugador = jugadorBase({ contratoAniosRestantes: 1, salario: 500 });
    expect(renovarContrato(jugador, 900, 5).contratoAniosRestantes).toBe(5);
    expect(renovarContrato(jugador, 900, 1).contratoAniosRestantes).toBe(1);
  });
});

describe('calcularSalarioJusto', () => {
  it('es positivo y escala con el valor de mercado', () => {
    const jugador = jugadorBase({ valorMercado: 1_000_000 });
    expect(calcularSalarioJusto(jugador)).toBeGreaterThan(0);
  });
});

describe('avanzarContratosIA', () => {
  it('a diferencia de avanzarContratos, la mayoría de los que vencen se retienen (no se van todos)', () => {
    // Con 200 jugadores a punto de vencer y 75% de retención, debería
    // quedar una mayoría clara — no es exacto por el azar, pero con esta
    // muestra no debería fallar nunca en la práctica.
    const plantel = Array.from({ length: 200 }, (_, i) => jugadorBase({ id: `j${i}`, contratoAniosRestantes: 1 }));
    const club = clubBase({ plantel });
    const { club: clubNuevo, liberados } = avanzarContratosIA(club);
    expect(clubNuevo.plantel.length).toBeGreaterThan(liberados.length);
    // Los retenidos quedan con contrato nuevo (default de renovarContrato,
    // 3 años — la IA no negocia años, sólo salario), no en 0.
    clubNuevo.plantel.forEach((j) => {
      expect(j.contratoAniosRestantes).toBe(3);
    });
  });

  it('a los que todavía no vencen sólo les resta un año, no los toca la renovación', () => {
    const club = clubBase({ plantel: [jugadorBase({ id: '1', contratoAniosRestantes: 3 })] });
    const { club: clubNuevo } = avanzarContratosIA(club);
    expect(clubNuevo.plantel[0].contratoAniosRestantes).toBe(2);
  });
});
