import { useEffect, useRef } from 'react';
import type { KeyboardInput } from '../types/game.types';

export function useKeyboard() {
  const keysRef = useRef<KeyboardInput>({
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
    flashlight: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          keysRef.current.up = true;
          break;
        case 's':
        case 'arrowdown':
          keysRef.current.down = true;
          break;
        case 'a':
        case 'arrowleft':
          keysRef.current.left = true;
          break;
        case 'd':
        case 'arrowright':
          keysRef.current.right = true;
          break;
        case 'shift':
          keysRef.current.sprint = true;
          break;
        case 'f':
          keysRef.current.flashlight = !keysRef.current.flashlight;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          keysRef.current.up = false;
          break;
        case 's':
        case 'arrowdown':
          keysRef.current.down = false;
          break;
        case 'a':
        case 'arrowleft':
          keysRef.current.left = false;
          break;
        case 'd':
        case 'arrowright':
          keysRef.current.right = false;
          break;
        case 'shift':
          keysRef.current.sprint = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keysRef;
}
