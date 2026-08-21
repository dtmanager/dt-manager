// Fase de "liga suiza" (formato de Champions/Europa/Conference League
// vigente desde 2024-25): cada equipo juega 8 partidos contra 8 rivales
// DISTINTOS, con una única tabla general.
//
// Simplificación explícita (permitida en prompt-copas-manager-app.md): en
// vez de un sorteo por bombos con protección de país/coeficientes reales,
// se intercalan los clubes por liga de origen (uno de cada liga por
// turno) y se los pasa por el mismo método del círculo que arma el
// fixture doméstico (generarFixture) — así los cruces de las primeras
// fechas tienden a ser entre ligas distintas sin resolver un problema de
// asignación con restricciones. Se toman sólo las primeras 8 fechas de la
// "ida" (sin vuelta): el método del círculo nunca repite rival dentro de
// esas fechas, así que da exactamente 8 rivales distintos por equipo, con
// local/visitante ya alternado.

import type { Club, Partido, TablaPosiciones } from '../types';
import {
  calcularTabla, generarFixture, proximaFechaSinJugar, simularJornada,
} from './fixture';

export const PARTIDOS_FASE_LIGA = 8;

function intercalarPorLiga(clubes: Club[]): string[] {
  const porLiga = new Map<string, Club[]>();
  clubes.forEach((c) => {
    const lista = porLiga.get(c.liga) ?? [];
    lista.push(c);
    porLiga.set(c.liga, lista);
  });
  const grupos = [...porLiga.values()];
  const resultado: string[] = [];
  let quedan = true;
  while (quedan) {
    quedan = false;
    grupos.forEach((g) => {
      const c = g.shift();
      if (c) {
        resultado.push(c.id);
        quedan = true;
      }
    });
  }
  return resultado;
}

export function armarFaseLigaSuiza(clubes: Record<string, Club>): Partido[] {
  const clubIds = intercalarPorLiga(Object.values(clubes));
  const fixtureCompleto = generarFixture(clubIds);
  return fixtureCompleto.filter((p) => p.fecha <= PARTIDOS_FASE_LIGA);
}

export function simularProximaFechaSuiza(
  fixture: Partido[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
): Partido[] {
  const fecha = proximaFechaSinJugar(fixture);
  if (fecha == null) return fixture;
  return simularJornada(fixture, fecha, clubes, clubUsuarioId);
}

export function simularFaseSuizaCompleta(
  fixture: Partido[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
): Partido[] {
  let f = fixture;
  let fecha = proximaFechaSinJugar(f);
  while (fecha != null) {
    f = simularJornada(f, fecha, clubes, clubUsuarioId);
    fecha = proximaFechaSinJugar(f);
  }
  return f;
}

export function tablaSuiza(fixture: Partido[], clubIds: string[]): TablaPosiciones[] {
  return calcularTabla(fixture, clubIds);
}
