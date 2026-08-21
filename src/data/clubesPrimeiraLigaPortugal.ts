// Clubes reales de Primeira Liga (Portugal) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/primeira-liga-portugal/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_PRIMEIRA_LIGA_PORTUGAL = '/assets/escudos/primeira-liga-portugal/';

export const CLUBES_PRIMEIRA_LIGA_PORTUGAL: ClubBase[] = [
  { id: 'portugal-sporting-cp', nombre: 'Sporting CP', pais: 'Portugal', nc: 79, archivo: 'sporting-cp.png' },
  { id: 'portugal-benfica', nombre: 'Benfica', pais: 'Portugal', nc: 78, archivo: 'benfica.png' },
  { id: 'portugal-fc-porto', nombre: 'FC Porto', pais: 'Portugal', nc: 78, archivo: 'fc-porto.png' },
  { id: 'portugal-sporting-de-braga', nombre: 'Sporting de Braga', pais: 'Portugal', nc: 75, archivo: 'sporting-de-braga.png' },
  { id: 'portugal-famalicao', nombre: 'Famalicão', pais: 'Portugal', nc: 71, archivo: 'famalicao.png' },
  { id: 'portugal-gil-vicente-fc', nombre: 'Gil Vicente FC', pais: 'Portugal', nc: 70, archivo: 'gil-vicente-fc.png' },
  { id: 'portugal-estoril', nombre: 'Estoril', pais: 'Portugal', nc: 70, archivo: 'estoril.png' },
  { id: 'portugal-casa-pia', nombre: 'Casa Pia', pais: 'Portugal', nc: 70, archivo: 'casa-pia.png' },
  { id: 'portugal-rio-ave', nombre: 'Rio Ave', pais: 'Portugal', nc: 69, archivo: 'rio-ave.png' },
  { id: 'portugal-santa-clara', nombre: 'Santa Clara', pais: 'Portugal', nc: 69, archivo: 'santa-clara.png' },
  { id: 'portugal-vitoria-de-guimaraes', nombre: 'Vitória de Guimarães', pais: 'Portugal', nc: 69, archivo: 'vitoria-de-guimaraes.png' },
  { id: 'portugal-arouca', nombre: 'Arouca', pais: 'Portugal', nc: 69, archivo: 'arouca.png' },
  { id: 'portugal-alverca', nombre: 'Alverca', pais: 'Portugal', nc: 68, archivo: 'alverca.png' },
  { id: 'portugal-estrela-da-amadora', nombre: 'Estrela da Amadora', pais: 'Portugal', nc: 68, archivo: 'estrela-da-amadora.png' },
  { id: 'portugal-nacional-da-madeira', nombre: 'Nacional da Madeira', pais: 'Portugal', nc: 68, archivo: 'nacional-da-madeira.png' },
  { id: 'portugal-moreirense', nombre: 'Moreirense', pais: 'Portugal', nc: 68, archivo: 'moreirense.png' },
  { id: 'portugal-tondela', nombre: 'Tondela', pais: 'Portugal', nc: 68, archivo: 'tondela.svg' },
  { id: 'portugal-avs-futebol-sad', nombre: 'AVS Futebol SAD', pais: 'Portugal', nc: 67, archivo: 'avs-futebol-sad.svg' },
];
