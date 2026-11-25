// InteractionManager: identificação centralizada de objetos clicáveis.
// Todo objeto interativo usa `useInteractive`, que cuida de hover, cursor, rótulo
// contextual e da ação — assim não existe objeto "decorativo" que pareça clicável.

import type { ThreeEvent } from '@react-three/fiber';
import { useExperience } from '../stores/useExperience';

export interface InteractiveHandlers {
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

export function useInteractive(label: string, action: () => void, enabled = true): InteractiveHandlers {
  const setHovered = useExperience((s) => s.setHovered);
  const phase = useExperience((s) => s.phase);
  if (!enabled || phase !== 'pub') return {};
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      setHovered(label);
      document.body.style.cursor = 'pointer';
    },
    onPointerOut: () => {
      setHovered(null);
      document.body.style.cursor = '';
    },
    onClick: (e) => {
      e.stopPropagation();
      document.body.style.cursor = '';
      action();
    },
  };
}
