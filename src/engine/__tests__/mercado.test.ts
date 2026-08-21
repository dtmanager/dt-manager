import { describe, expect, it } from 'vitest';
import {
  calcularNecesidad, calcularVentanaMercado, evaluarOfertasIA, generarClubesExtranjeros, probabilidadAceptarOferta,
  semanaActualDeLiga, semanaAperturaVentanaInvierno,
} from '../mercado';
import { hayCupo } from '../contratos';
import { generarLigaInicial } from '../liga';
import { CLUBES_LIGA_PROFESIONAL } from '../../data/clubesLigaProfesional';
import type { Club, DT, Jugador, Partido } from '../../types';

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

describe('calcularNecesidad', () => {
  it('es alta cuando la posición está muy por debajo del promedio del plantel', () => {
    const club = clubBase({
      plantel: [
        jugadorBase({ id: '1', posicion: 'DEL', grl: 40 }),
        jugadorBase({ id: '2', posicion: 'MC', grl: 80 }),
        jugadorBase({ id: '3', posicion: 'DFC', grl: 80 }),
      ],
    });
    expect(calcularNecesidad(club, 'DEL')).toBeGreaterThan(0.5);
  });

  it('es 0 cuando la posición está en el promedio o por arriba', () => {
    const club = clubBase({
      plantel: [
        jugadorBase({ id: '1', posicion: 'DEL', grl: 80 }),
        jugadorBase({ id: '2', posicion: 'MC', grl: 70 }),
      ],
    });
    expect(calcularNecesidad(club, 'DEL')).toBe(0);
  });
});

describe('evaluarOfertasIA', () => {
  it('no genera oferta de un club sin presupuesto suficiente', () => {
    const jugador = jugadorBase({ posicion: 'DEL', valorMercado: 100000 });
    const clubNecesitado = clubBase({
      id: 'pobre',
      presupuesto: 1000,
      plantel: [jugadorBase({ id: '1', posicion: 'DEL', grl: 40 }), jugadorBase({ id: '2', posicion: 'MC', grl: 80 })],
    });
    const ofertas = evaluarOfertasIA(jugador, 'vendedor', { pobre: clubNecesitado });
    expect(ofertas).toHaveLength(0);
  });

  it('genera oferta entre 0.8x y 1.2x el valor de mercado cuando hay necesidad y plata', () => {
    const jugador = jugadorBase({ posicion: 'DEL', valorMercado: 100000 });
    const clubInteresado = clubBase({
      id: 'rico',
      presupuesto: 1_000_000,
      plantel: [jugadorBase({ id: '1', posicion: 'DEL', grl: 40 }), jugadorBase({ id: '2', posicion: 'MC', grl: 80 })],
    });
    const ofertas = evaluarOfertasIA(jugador, 'vendedor', { rico: clubInteresado });
    expect(ofertas).toHaveLength(1);
    expect(ofertas[0].monto).toBeGreaterThanOrEqual(80000);
    expect(ofertas[0].monto).toBeLessThanOrEqual(120000);
  });

  it('nunca se genera una oferta del propio club vendedor', () => {
    const jugador = jugadorBase({ posicion: 'DEL', valorMercado: 100000 });
    const club = clubBase({
      id: 'vendedor',
      presupuesto: 1_000_000,
      plantel: [jugadorBase({ id: '1', posicion: 'DEL', grl: 40 })],
    });
    const ofertas = evaluarOfertasIA(jugador, 'vendedor', { vendedor: club });
    expect(ofertas).toHaveLength(0);
  });
});

describe('probabilidadAceptarOferta', () => {
  it('una oferta al valor de mercado exacto con DT neutro tiene chances razonables', () => {
    const prob = probabilidadAceptarOferta(100000, 100000, dtBase({ mercado: 50 }));
    expect(prob).toBeGreaterThan(0.5);
  });

  it('un DT con mercado alto exige más antes de aceptar', () => {
    const probMercadoAlto = probabilidadAceptarOferta(100000, 100000, dtBase({ mercado: 90 }));
    const probMercadoBajo = probabilidadAceptarOferta(100000, 100000, dtBase({ mercado: 10 }));
    expect(probMercadoAlto).toBeLessThan(probMercadoBajo);
  });

  it('siempre queda entre 0 y 1', () => {
    expect(probabilidadAceptarOferta(0, 100000, dtBase({ mercado: 99 }))).toBeGreaterThanOrEqual(0);
    expect(probabilidadAceptarOferta(1_000_000, 100000, dtBase({ mercado: 0 }))).toBeLessThanOrEqual(1);
  });
});

// 58 fechas (2 ruedas x 29 clubes, mismo tamaño que la Liga Profesional
// real que ya usa el juego) — suficiente para probar los tres tramos de
// la ventana (verano/cerrado/invierno/cerrado) sin datos mágicos.
function fixtureDeLiga(fechasJugadas: number, totalFechas = 58): Partido[] {
  return Array.from({ length: totalFechas }, (_, i) => {
    const fecha = i + 1;
    const jugado = fecha <= fechasJugadas;
    return {
      id: `p${fecha}`,
      fecha,
      localId: 'a',
      visitanteId: 'b',
      golesLocal: jugado ? 1 : null,
      golesVisitante: jugado ? 0 : null,
      partidoImportante: false,
    };
  });
}

describe('semanaActualDeLiga', () => {
  it('es 0 si todavía no se jugó ninguna fecha', () => {
    expect(semanaActualDeLiga(fixtureDeLiga(0))).toBe(0);
  });

  it('es la fecha más alta ya jugada', () => {
    expect(semanaActualDeLiga(fixtureDeLiga(12))).toBe(12);
  });
});

describe('semanaAperturaVentanaInvierno', () => {
  it('cae aproximadamente a mitad del fixture', () => {
    const fixture = fixtureDeLiga(0, 58);
    const apertura = semanaAperturaVentanaInvierno(fixture);
    expect(apertura).toBeGreaterThan(20);
    expect(apertura).toBeLessThan(35);
  });
});

describe('calcularVentanaMercado', () => {
  it('está en verano en pretemporada y las primeras fechas de liga', () => {
    expect(calcularVentanaMercado(fixtureDeLiga(0)).ventana).toBe('verano');
    expect(calcularVentanaMercado(fixtureDeLiga(2)).ventana).toBe('verano');
  });

  it('está cerrada entre el fin del verano y la apertura de invierno', () => {
    expect(calcularVentanaMercado(fixtureDeLiga(15)).ventana).toBe('cerrado');
  });

  it('está en invierno a mitad de temporada', () => {
    const fixture = fixtureDeLiga(0, 58);
    const apertura = semanaAperturaVentanaInvierno(fixture);
    expect(calcularVentanaMercado(fixtureDeLiga(apertura, 58)).ventana).toBe('invierno');
  });

  it('vuelve a cerrarse después de la ventana de invierno', () => {
    expect(calcularVentanaMercado(fixtureDeLiga(50)).ventana).toBe('cerrado');
  });
});

// Regresión (pedido explícito, ver docs/calendario-real-y-ventanas-de-
// mercado.md): con COMPOSICION_PLANTEL sumando 26 (el mismo TOPE_PLANTEL),
// TODOS los clubes generados nacían ya al tope — `hayCupo` bloqueaba a la
// IA de ofertar por CUALQUIER jugador desde el primer día de cada
// carrera, sin importar cuánta necesidad/presupuesto tuviera el rival.
// Bajar a 22 le deja 4 lugares libres a cada club — estos tests usan datos
// REALES de `generarLigaInicial` (no fixtures a medida) para que si algún
// cambio futuro vuelve a llevar el plantel inicial al tope, se note acá
// mismo en vez de en el juego, con el jugador preguntando "¿llegan
// ofertas?" otra vez.
describe('cupo de plantel al arrancar una liga', () => {
  it('los clubes recién generados por generarLigaInicial tienen cupo libre', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');
    const rivales = Object.values(clubes).filter((c) => c.id !== 'boca-juniors');
    expect(rivales.length).toBeGreaterThan(0);
    rivales.forEach((c) => expect(hayCupo(c)).toBe(true));
  });

  it('evaluarOfertasIA puede generar ofertas reales apenas arranca la liga', () => {
    const { clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, 'boca-juniors', 'Marcelo Aguirre');
    const club = clubes['boca-juniors'];
    // Alcanza con que UN jugador del plantel del usuario despierte
    // interés en algún rival — antes esto era matemáticamente imposible
    // (0 clubes con cupo), ahora depende de necesidad/presupuesto real.
    const huboAlgunaOferta = club.plantel.some((jugador) => evaluarOfertasIA(jugador, club.id, clubes).length > 0);
    expect(huboAlgunaOferta).toBe(true);
  });
});

describe('generarClubesExtranjeros', () => {
  it('genera clubes con plantel completo y al menos un jugador transferible cada uno', () => {
    const clubes = generarClubesExtranjeros('Liga Profesional');
    expect(Object.keys(clubes).length).toBeGreaterThan(0);
    Object.values(clubes).forEach((club) => {
      expect(club.plantel.length).toBeGreaterThan(0);
      const enVenta = club.plantel.filter((j) => j.transferible);
      expect(enVenta.length).toBeGreaterThanOrEqual(1);
      expect(enVenta.length).toBeLessThanOrEqual(2);
      expect(club.liga).not.toBe('Liga Profesional');
    });
  });
});
