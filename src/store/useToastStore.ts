// Toasts (pedido explícito: "sistema de notificaciones... la animacion
// como el ejemplo de html el cuadrado ese" — mockup de referencia,
// rediseno-ui-mockup_2.html, función lanzarToast/.toast: tarjeta que
// entra deslizándose desde la derecha arriba, se queda unos segundos, y
// se va). Store SEPARADO de useGameStore.ts a propósito — es puramente
// de UI efímera (no forma parte de la carrera, no tiene sentido que
// persista en localStorage ni que sobreviva a un reload), así que NO usa
// el middleware `persist`.
import { create } from 'zustand';
import { idUnico } from '../engine/nombres';

export interface ToastItem {
  id: string;
  titulo: string;
  texto: string;
}

interface ToastState {
  toasts: ToastItem[];
  mostrarToast: (titulo: string, texto: string) => void;
  descartarToast: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  mostrarToast: (titulo, texto) => {
    const id = idUnico('toast');
    set((state) => ({ toasts: [...state.toasts, { id, titulo, texto }] }));
  },
  descartarToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
