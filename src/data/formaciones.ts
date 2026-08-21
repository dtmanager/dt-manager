// Layout de las 21 formaciones reales del fútbol moderno (pedido explícito:
// "investigá todas las formaciones para agregarlas con este sistema" — ver
// FourFourTwo/PFSA/Wikipedia, fuentes en la investigación que se le pasó al
// usuario en el chat). Cada slot tiene una posición puntual (para la
// advertencia de "fuera de puesto" del sistema granular) y una coordenada
// en % sobre una cancha vertical (arquero cerca de y=94, delanteros cerca
// de y=12-20 — mismo criterio "arquero abajo" de la spec). Quedó afuera a
// propósito el 4-6-0 (falso 9 puro, cero delanteros de área): es real pero
// tan poco jugado en la práctica, y tan raro para el sorteo de goleador de
// estadisticasPartido.ts (que asume que casi siempre hay un DEL en cancha),
// que no vale la pena meterlo por ahora.
import type { Posicion } from '../types';

export interface SlotFormacion {
  id: string;
  posicion: Posicion;
  x: number; // 0-100, % del ancho de la cancha
  y: number; // 0-100, % del alto (0 arriba, 100 abajo)
}

export type NombreFormacion =
  // Línea de 4 en el fondo
  | '4-4-2'
  | '4-4-1-1'
  | '4-1-2-1-2' // rombo
  | '4-1-3-2'
  | '4-2-3-1'
  | '4-2-2-2'
  | '4-2-4'
  | '4-3-3'
  | '4-1-4-1'
  | '4-3-2-1' // árbol de navidad
  | '4-5-1'
  // Línea de 3 (o 5 cuando los carrileros retroceden)
  | '3-4-3'
  | '3-4-2-1'
  | '3-4-1-2'
  | '3-2-4-1'
  | '3-1-3-3'
  | '3-5-2'
  | '3-5-1-1'
  | '5-2-2-1'
  | '5-4-1'
  | '5-3-2';

// Cada slot de la fila lleva SU posición puntual (no una sola repetida) —
// pedido explícito del sistema de posiciones granular: en un 4-4-2 el
// lateral izquierdo (LI) y el central (DFC) ya no son "lo mismo" (DEF) a
// los ojos del juego. El orden del array es de izquierda a derecha de la
// cancha, así que alcanza con listarlas en ese orden (ej.: LI, DFC, DFC,
// LD para una línea de 4).
function filaPosiciones(posiciones: Posicion[], y: number, prefijo: string): SlotFormacion[] {
  const cantidad = posiciones.length;
  return posiciones.map((posicion, i) => {
    const paso = 70 / (cantidad + 1);
    return { id: `${prefijo}-${i}`, posicion, x: 15 + paso * (i + 1), y };
  });
}

// Para líneas de un solo jugador (segundo delantero escalonado, enganche
// solitario, falso 9, etc.) — centrado, sin necesidad de repartir varios x.
function jugadorSuelto(posicion: Posicion, y: number, id: string): SlotFormacion[] {
  return [{ id, posicion, x: 50, y }];
}

function arquero(): SlotFormacion[] {
  return [{ id: 'arq-0', posicion: 'ARQ', x: 50, y: 94 }];
}

export const FORMACIONES: Record<NombreFormacion, SlotFormacion[]> = {
  // -------------------- línea de 4 --------------------
  '4-4-2': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['EI', 'MC', 'MC', 'ED'], 48, 'med'),
    ...filaPosiciones(['DEL', 'DEL'], 20, 'del'),
  ],
  // Segunda punta retrasada (MCO) + un único 9 de área — "adorada por
  // Simeone" (FourFourTwo).
  '4-4-1-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['EI', 'MC', 'MC', 'ED'], 50, 'med'),
    ...jugadorSuelto('MCO', 30, 'seg-0'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  // Rombo: "a mitad de camino entre un 4-4-2 y un 4-3-3" (FourFourTwo).
  '4-1-2-1-2': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...jugadorSuelto('MCD', 56, 'piv-0'),
    ...filaPosiciones(['MC', 'MC'], 42, 'med'),
    ...jugadorSuelto('MCO', 28, 'mco-0'),
    ...filaPosiciones(['DEL', 'DEL'], 14, 'del'),
  ],
  '4-1-3-2': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...jugadorSuelto('MCD', 56, 'piv-0'),
    ...filaPosiciones(['EI', 'MC', 'ED'], 40, 'med'),
    ...filaPosiciones(['DEL', 'DEL'], 16, 'del'),
  ],
  // Uno de los más jugados del siglo XXI (FourFourTwo) — doble 5 + tridente
  // de enganche/extremos detrás del 9.
  '4-2-3-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['MCD', 'MCD'], 58, 'piv'),
    ...filaPosiciones(['EI', 'MCO', 'ED'], 34, 'med'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  // Sobrecarga central: doble 5 + 2 enganches en los medios espacios.
  '4-2-2-2': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['MCD', 'MCD'], 56, 'piv'),
    ...filaPosiciones(['MCO', 'MCO'], 36, 'med'),
    ...filaPosiciones(['DEL', 'DEL'], 16, 'del'),
  ],
  // Muy ofensiva/rara en el fútbol moderno — pide "un mediocampista de
  // clase mundial" que cubra solo el medio (FourFourTwo).
  '4-2-4': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['MCD', 'MC'], 54, 'med'),
    ...filaPosiciones(['EI', 'DEL', 'DEL', 'ED'], 18, 'del'),
  ],
  '4-3-3': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['MC', 'MCD', 'MC'], 50, 'med'),
    ...filaPosiciones(['EI', 'DEL', 'ED'], 20, 'del'),
  ],
  // "Versión más conservadora del 4-3-3" (FourFourTwo) — línea de 4 plana
  // en el medio con un solo pivote por delante de la defensa.
  '4-1-4-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...jugadorSuelto('MCD', 58, 'piv-0'),
    ...filaPosiciones(['EI', 'MC', 'MC', 'ED'], 40, 'med'),
    ...jugadorSuelto('DEL', 16, 'del-0'),
  ],
  // "Árbol de navidad": forma que se va angostando línea a línea
  // (FourFourTwo).
  '4-3-2-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['MCD', 'MC', 'MC'], 54, 'med'),
    ...filaPosiciones(['MCO', 'MCO'], 32, 'mco'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  '4-5-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'LD'], 74, 'def'),
    ...filaPosiciones(['EI', 'MCD', 'MC', 'MCO', 'ED'], 48, 'med'),
    ...jugadorSuelto('DEL', 18, 'del-0'),
  ],
  // -------------------- línea de 3 / 5 --------------------
  // Los carrileros (LI/LD) dan ancho desde el medio, no desde el fondo.
  '3-4-3': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 76, 'def'),
    ...filaPosiciones(['LI', 'MC', 'MC', 'LD'], 50, 'med'),
    ...filaPosiciones(['EI', 'DEL', 'ED'], 20, 'del'),
  ],
  // "La formación de 3 en el fondo elegida en el fútbol moderno"
  // (FourFourTwo).
  '3-4-2-1': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 76, 'def'),
    ...filaPosiciones(['LI', 'MC', 'MC', 'LD'], 52, 'med'),
    ...filaPosiciones(['MCO', 'MCO'], 30, 'mco'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  // Deja lugar a un "jugador de lujo" único en la mediapunta
  // (FourFourTwo).
  '3-4-1-2': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 76, 'def'),
    ...filaPosiciones(['LI', 'MC', 'MC', 'LD'], 52, 'med'),
    ...jugadorSuelto('MCO', 30, 'mco-0'),
    ...filaPosiciones(['DEL', 'DEL'], 14, 'del'),
  ],
  // "Super ofensiva" — sin carrileros de ancho, todo el mediocampo
  // empujado hacia adelante (FourFourTwo).
  '3-2-4-1': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 78, 'def'),
    ...filaPosiciones(['MCD', 'MCD'], 58, 'piv'),
    ...filaPosiciones(['EI', 'MCO', 'MCO', 'ED'], 34, 'med'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  // Rombo construido sobre un único pivote central (FourFourTwo).
  '3-1-3-3': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 78, 'def'),
    ...jugadorSuelto('MCD', 58, 'piv-0'),
    ...filaPosiciones(['MC', 'MC', 'MC'], 42, 'med'),
    ...filaPosiciones(['EI', 'DEL', 'ED'], 18, 'del'),
  ],
  '3-5-2': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 76, 'def'),
    ...filaPosiciones(['LI', 'MCD', 'MCO', 'MC', 'LD'], 48, 'med'),
    ...filaPosiciones(['DEL', 'DEL'], 20, 'del'),
  ],
  // Igual que el 3-5-2 pero con un delantero de enlace retrasado en vez de
  // dos puntas parejos — "un poco más de creatividad" a costa de que el
  // de área quede más solo (FourFourTwo).
  '3-5-1-1': [
    ...arquero(),
    ...filaPosiciones(['DFC', 'DFC', 'DFC'], 76, 'def'),
    ...filaPosiciones(['LI', 'MCD', 'MC', 'MCO', 'LD'], 50, 'med'),
    ...jugadorSuelto('MCO', 28, 'seg-0'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  // Bloque bajo defensivo clásico — carrileros retroceden a línea de 5
  // (FourFourTwo).
  '5-2-2-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'DFC', 'LD'], 78, 'def'),
    ...filaPosiciones(['MCD', 'MCD'], 56, 'piv'),
    ...filaPosiciones(['MCO', 'MCO'], 34, 'med'),
    ...jugadorSuelto('DEL', 14, 'del-0'),
  ],
  '5-4-1': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'DFC', 'LD'], 78, 'def'),
    ...filaPosiciones(['EI', 'MC', 'MC', 'ED'], 48, 'med'),
    ...jugadorSuelto('DEL', 16, 'del-0'),
  ],
  '5-3-2': [
    ...arquero(),
    ...filaPosiciones(['LI', 'DFC', 'DFC', 'DFC', 'LD'], 76, 'def'),
    ...filaPosiciones(['MCD', 'MC', 'MCO'], 50, 'med'),
    ...filaPosiciones(['DEL', 'DEL'], 20, 'del'),
  ],
};

export const NOMBRES_FORMACION: NombreFormacion[] = [
  '4-4-2', '4-4-1-1', '4-1-2-1-2', '4-1-3-2', '4-2-3-1', '4-2-2-2', '4-2-4', '4-3-3', '4-1-4-1', '4-3-2-1', '4-5-1',
  '3-4-3', '3-4-2-1', '3-4-1-2', '3-2-4-1', '3-1-3-3', '3-5-2', '3-5-1-1', '5-2-2-1', '5-4-1', '5-3-2',
];
