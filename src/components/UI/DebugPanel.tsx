import { useState } from 'react';
import type { Player } from '../../types/game.types';

interface DebugPanelProps {
  player: Player;
  fps?: number;
}

export function DebugPanel({ player, fps = 60 }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-horror-dark text-horror-gray px-3 py-2 rounded horror-border hover:bg-horror-red hover:text-white transition-colors"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-horror-dark bg-opacity-90 p-4 rounded horror-border text-sm font-mono min-w-64">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-horror-red font-bold">DEBUG PANEL</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-horror-gray hover:text-horror-red transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-horror-gray">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className="text-white">{fps.toFixed(1)}</span>
        </div>

        <div className="border-t border-gray-700 pt-2">
          <div className="text-horror-red mb-1">Player:</div>
          <div className="flex justify-between ml-2">
            <span>X:</span>
            <span className="text-white">{player.position.x.toFixed(1)}</span>
          </div>
          <div className="flex justify-between ml-2">
            <span>Y:</span>
            <span className="text-white">{player.position.y.toFixed(1)}</span>
          </div>
          <div className="flex justify-between ml-2">
            <span>Health:</span>
            <span className="text-white">{player.health}</span>
          </div>
          <div className="flex justify-between ml-2">
            <span>Luck:</span>
            <span className="text-yellow-400">{player.luck.toFixed(0)} 🍀</span>
          </div>
          <div className="flex justify-between ml-2">
            <span>Moving:</span>
            <span className="text-white">{player.isMoving ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between ml-2">
            <span>Sprint:</span>
            <span className="text-white">
              {player.isSprinting ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
