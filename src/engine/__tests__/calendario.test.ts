import { describe, expect, it } from 'vitest';
import { construirCalendario } from '../calendario';
import { generarLigaInicial } from '../liga';
import { generarCopaNacional } from '../copaNacional';
import { CLUBES_LIGA_PROFESIONAL } from '../../data/clubesLigaProfesional';

const CLUB_USUARIO = 'boca-juniors';

function armarEscenario() {
  const { liga, clubes } = generarLigaInicial(CLUBES_LIGA_PROFESIONAL, CLUB_USUARIO, 'Marcelo Aguirre');
  return { liga, clubes };
}

describe('construirCalendario', () => {
  it('una entrada de liga por cada partido del usuario, con semana === fecha real', () => {
    const { liga, clubes } = armarEscenario();
    const entradas = construirCalendario({
      clubUsuarioId: CLUB_USUARIO,
      clubes,
      liga,
      partidosPretemporada: [],
      copaNacional: null,
      copaConmebol: null,
      copaUefa: null,
      copaMundialClubes: null,
    });

    const partidosDelUsuario = liga.fixture.filter((p) => p.localId === CLUB_USUARIO || p.visitanteId === CLUB_USUARIO);
    const entradasDeLiga = entradas.filter((e) => e.tipo === 'liga');
    expect(entradasDeLiga).toHaveLength(partidosDelUsuario.length);
    entradasDeLiga.forEach((e) => {
      const partido = liga.fixture.find((p) => p.id === e.id)!;
      expect(e.semana).toBe(partido.fecha);
      expect(e.pantalla).toBe('liga');
    });
  });

  it('incluye un recordatorio de mercado en semana 1', () => {
    const { liga, clubes } = armarEscenario();
    const entradas = construirCalendario({
      clubUsuarioId: CLUB_USUARIO,
      clubes,
      liga,
      partidosPretemporada: [],
      copaNacional: null,
      copaConmebol: null,
      copaUefa: null,
      copaMundialClubes: null,
    });

    const mercado = entradas.find((e) => e.tipo === 'mercado');
    expect(mercado).toBeDefined();
    expect(mercado!.semana).toBe(1);
    expect(mercado!.pantalla).toBe('mercado');
  });

  it('los amistosos de pretemporada quedan en semana 0, antes que cualquier otra cosa', () => {
    const { liga, clubes } = armarEscenario();
    const amistoso = {
      id: 'amistoso-test',
      fecha: 1,
      localId: CLUB_USUARIO,
      visitanteId: liga.clubIds.find((id) => id !== CLUB_USUARIO)!,
      golesLocal: null,
      golesVisitante: null,
      partidoImportante: false,
    };
    const entradas = construirCalendario({
      clubUsuarioId: CLUB_USUARIO,
      clubes,
      liga,
      partidosPretemporada: [amistoso],
      copaNacional: null,
      copaConmebol: null,
      copaUefa: null,
      copaMundialClubes: null,
    });

    const entradaAmistoso = entradas.find((e) => e.id === 'amistoso-test');
    expect(entradaAmistoso).toBeDefined();
    expect(entradaAmistoso!.semana).toBe(0);
    expect(entradaAmistoso!.tipo).toBe('pretemporada');
    // Ordenado por semana: la pretemporada tiene que aparecer primero.
    expect(entradas[0].id).toBe('amistoso-test');
  });

  it('la primera ronda de copa nacional aparece con el nombre real de la ronda y navega a copa-nacional', () => {
    const { liga, clubes } = armarEscenario();
    const copaNacional = generarCopaNacional('Copa Argentina', clubes);
    const entradas = construirCalendario({
      clubUsuarioId: CLUB_USUARIO,
      clubes,
      liga,
      partidosPretemporada: [],
      copaNacional,
      copaConmebol: null,
      copaUefa: null,
      copaMundialClubes: null,
    });

    const entradasCopa = entradas.filter((e) => e.tipo === 'copa-nacional');
    // El usuario puede haber quedado en la lista de "bye" de la primera
    // ronda (impar) — sólo se afirma algo si de verdad tiene llave.
    const llaveUsuario = copaNacional.rondas[0].llaves.find(
      (l) => l.localId === CLUB_USUARIO || l.visitanteId === CLUB_USUARIO,
    );
    if (llaveUsuario) {
      expect(entradasCopa.length).toBeGreaterThan(0);
      expect(entradasCopa[0].etiquetaRonda).toBe(copaNacional.rondas[0].nombre);
      expect(entradasCopa[0].pantalla).toBe('copa-nacional');
      expect(entradasCopa[0].semana).toBeGreaterThan(0);
    } else {
      expect(entradasCopa).toHaveLength(0);
    }
  });

  it('todo queda ordenado por semana de forma no decreciente', () => {
    const { liga, clubes } = armarEscenario();
    const copaNacional = generarCopaNacional('Copa Argentina', clubes);
    const entradas = construirCalendario({
      clubUsuarioId: CLUB_USUARIO,
      clubes,
      liga,
      partidosPretemporada: [],
      copaNacional,
      copaConmebol: null,
      copaUefa: null,
      copaMundialClubes: null,
    });

    for (let i = 1; i < entradas.length; i += 1) {
      expect(entradas[i].semana).toBeGreaterThanOrEqual(entradas[i - 1].semana);
    }
  });
});
