// Clubes reales de Brasileirão Série A para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/brasileirao/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_BRASILEIRAO = '/assets/escudos/brasileirao/';

export const CLUBES_BRASILEIRAO: ClubBase[] = [
  { id: 'brasil-flamengo', nombre: 'Flamengo', nc: 76, archivo: 'flamengo.png' },
  { id: 'brasil-palmeiras', nombre: 'Palmeiras', nc: 75, archivo: 'palmeiras.png' },
  { id: 'brasil-atletico-mg', nombre: 'Atlético-MG', nc: 75, archivo: 'atletico-mg.png' },
  { id: 'brasil-botafogo', nombre: 'Botafogo', nc: 75, archivo: 'botafogo.png' },
  { id: 'brasil-internacional', nombre: 'Internacional', nc: 74, archivo: 'internacional.png' },
  { id: 'brasil-sao-paulo', nombre: 'São Paulo', nc: 73, archivo: 'sao-paulo.png' },
  { id: 'brasil-corinthians', nombre: 'Corinthians', nc: 73, archivo: 'corinthians.png' },
  { id: 'brasil-bahia', nombre: 'Bahia', nc: 72, archivo: 'bahia.png' },
  { id: 'brasil-fluminense', nombre: 'Fluminense', nc: 72, archivo: 'fluminense.png' },
  { id: 'brasil-cruzeiro', nombre: 'Cruzeiro', nc: 72, archivo: 'cruzeiro.png' },
  { id: 'brasil-gremio', nombre: 'Grêmio', nc: 72, archivo: 'gremio.png' },
  { id: 'brasil-red-bull-bragantino', nombre: 'Red Bull Bragantino', nc: 70, archivo: 'red-bull-bragantino.png' },
  { id: 'brasil-vasco-da-gama', nombre: 'Vasco da Gama', nc: 70, archivo: 'vasco-da-gama.png' },
  { id: 'brasil-santos', nombre: 'Santos', nc: 69, archivo: 'santos.png' },
  { id: 'brasil-vitoria', nombre: 'Vitória', nc: 69, archivo: 'vitoria.png' },
  { id: 'brasil-athletico-pr', nombre: 'Athletico-PR', nc: 68, archivo: 'athletico-pr.png' },
  { id: 'brasil-mirassol', nombre: 'Mirassol', nc: 65, archivo: 'mirassol.png' },
  { id: 'brasil-coritiba', nombre: 'Coritiba', nc: 64, archivo: 'coritiba.png' },
  { id: 'brasil-chapecoense', nombre: 'Chapecoense', nc: 61, archivo: 'chapecoense.png' },
  { id: 'brasil-remo', nombre: 'Remo', nc: 60, archivo: 'remo.png' },
];
