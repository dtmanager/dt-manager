// Clubes reales de Serie A (Italia) para el modo carrera. `nc` sale de una
// planilla de referencia (escala FIFA/EA FC 0-100) que pasó el usuario —
// mismo criterio que las ligas argentinas. `archivo` apunta a /assets/escudos/serie-a/
// (los escudos todavía no están — hay que agregarlos ahí con ese nombre).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_SERIE_A = '/assets/escudos/serie-a/';

export const CLUBES_SERIE_A: ClubBase[] = [
  { id: 'seriea-inter', nombre: 'Inter', nc: 83, archivo: 'inter.png' },
  { id: 'seriea-napoli', nombre: 'Napoli', nc: 81, archivo: 'napoli.png' },
  { id: 'seriea-milan', nombre: 'Milan', nc: 81, archivo: 'milan.png' },
  { id: 'seriea-juventus', nombre: 'Juventus', nc: 80, archivo: 'juventus.png' },
  { id: 'seriea-roma', nombre: 'Roma', nc: 80, archivo: 'roma.png' },
  { id: 'seriea-atalanta', nombre: 'Atalanta', nc: 79, archivo: 'atalanta.png' },
  { id: 'seriea-lazio', nombre: 'Lazio', nc: 78, archivo: 'lazio.png' },
  { id: 'seriea-como', nombre: 'Como', nc: 77, archivo: 'como.png' },
  { id: 'seriea-bologna', nombre: 'Bologna', nc: 76, archivo: 'bologna.png' },
  { id: 'seriea-fiorentina', nombre: 'Fiorentina', nc: 76, archivo: 'fiorentina.png' },
  { id: 'seriea-torino', nombre: 'Torino', nc: 75, archivo: 'torino.png' },
  { id: 'seriea-sassuolo', nombre: 'Sassuolo', nc: 74, archivo: 'sassuolo.png' },
  { id: 'seriea-parma', nombre: 'Parma', nc: 73, archivo: 'parma.png' },
  { id: 'seriea-udinese', nombre: 'Udinese', nc: 73, archivo: 'udinese.png' },
  { id: 'seriea-hellas-verona', nombre: 'Hellas Verona', nc: 73, archivo: 'hellas-verona.svg' },
  { id: 'seriea-cagliari', nombre: 'Cagliari', nc: 73, archivo: 'cagliari.png' },
  { id: 'seriea-genoa', nombre: 'Genoa', nc: 73, archivo: 'genoa.png' },
  { id: 'seriea-cremonese', nombre: 'Cremonese', nc: 73, archivo: 'cremonese.svg' },
  { id: 'seriea-pisa', nombre: 'Pisa', nc: 72, archivo: 'pisa.svg' },
  { id: 'seriea-lecce', nombre: 'Lecce', nc: 71, archivo: 'lecce.png' },
];
