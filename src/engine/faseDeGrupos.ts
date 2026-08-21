// Fase de grupos múltiples (8 grupos de 4 — Copa Libertadores y Copa
// Sudamericana). Reusa generarFixture/simularJornada/calcularTabla de
// fixture.ts para cada grupo por separado — no hace falta un motor de
// todos-contra-todos nuevo, sólo la orquestación de varios grupos a la
// vez.

import type { Club, Partido } from '../types';
import {
  calcularTabla, generarFixture, proximaFechaSinJugar, simularJornada,
} from './fixture';
import type { TablaPosiciones } from '../types';

export interface Grupo {
  nombre: string;
  clubIds: string[];
  fixture: Partido[];
}

const NOMBRES_GRUPO = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

// Arma N grupos de 4 a partir de una lista de clubIds (debe ser múltiplo
// de 4). Sorteo aleatorio simple — simplificación explícita (sin bombos
// ni protección de país, permitida en prompt-copas-manager-app.md).
export function armarGrupos(clubIds: string[]): Grupo[] {
  const mezclados = [...clubIds].sort(() => Math.random() - 0.5);
  const grupos: Grupo[] = [];
  for (let i = 0; i < mezclados.length; i += 4) {
    const clubIdsGrupo = mezclados.slice(i, i + 4);
    grupos.push({
      nombre: `Grupo ${NOMBRES_GRUPO[grupos.length] ?? grupos.length + 1}`,
      clubIds: clubIdsGrupo,
      fixture: generarFixture(clubIdsGrupo),
    });
  }
  return grupos;
}

// Arma N grupos de 4 a UNA SOLA RUEDA (sin ida y vuelta) — formato real de
// la Copa Mundial de Clubes de la FIFA desde 2025 (a diferencia de
// Libertadores/Sudamericana, que sí son ida y vuelta). Mismo truco que
// ligaSuiza.ts: generarFixture arma el círculo completo (ida + vuelta),
// pero la "ida" (primeras N-1 fechas, acá 3 para grupos de 4) ya contiene
// cada partido exactamente una vez, sin repetir rival — cortar ahí da un
// todos-contra-todos a una rueda sin escribir un motor de fixture nuevo.
export function armarGruposSimple(clubIds: string[]): Grupo[] {
  const mezclados = [...clubIds].sort(() => Math.random() - 0.5);
  const grupos: Grupo[] = [];
  for (let i = 0; i < mezclados.length; i += 4) {
    const clubIdsGrupo = mezclados.slice(i, i + 4);
    grupos.push({
      nombre: `Grupo ${NOMBRES_GRUPO[grupos.length] ?? grupos.length + 1}`,
      clubIds: clubIdsGrupo,
      fixture: generarFixture(clubIdsGrupo).filter((p) => p.fecha <= clubIdsGrupo.length - 1),
    });
  }
  return grupos;
}

export function grupoTerminado(grupo: Grupo): boolean {
  return proximaFechaSinJugar(grupo.fixture) == null;
}

export function todosLosGruposTerminados(grupos: Grupo[]): boolean {
  return grupos.every(grupoTerminado);
}

// Todos los grupos comparten la misma numeración de fecha (1 a 6) — la
// próxima pendiente es la misma para cualquiera de ellos que no haya
// terminado. null si ya se jugó todo.
export function proximaFechaDeGrupos(grupos: Grupo[]): number | null {
  for (const g of grupos) {
    const fecha = proximaFechaSinJugar(g.fixture);
    if (fecha != null) return fecha;
  }
  return null;
}

export function simularProximaFechaDeGrupos(
  grupos: Grupo[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
): Grupo[] {
  return grupos.map((g) => {
    const fecha = proximaFechaSinJugar(g.fixture);
    if (fecha == null) return g;
    return { ...g, fixture: simularJornada(g.fixture, fecha, clubes, clubUsuarioId) };
  });
}

export function simularGruposCompletos(
  grupos: Grupo[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
): Grupo[] {
  return grupos.map((g) => {
    let fixture = g.fixture;
    let fecha = proximaFechaSinJugar(fixture);
    while (fecha != null) {
      fixture = simularJornada(fixture, fecha, clubes, clubUsuarioId);
      fecha = proximaFechaSinJugar(fixture);
    }
    return { ...g, fixture };
  });
}

export function tablaDeGrupo(grupo: Grupo): TablaPosiciones[] {
  return calcularTabla(grupo.fixture, grupo.clubIds);
}
