import { useEffect, useRef } from 'react';
import type { Maze, Player } from '../types/game.types';
import { RenderSystem } from '../systems/RenderSystem';
import { CANVAS_CONFIG } from '../constants/game.constants';

interface GameCanvasProps {
  maze: Maze;
  player: Player;
}

export function GameCanvas({ maze, player }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSystemRef = useRef<RenderSystem | null>(null);

  // 初始化渲染系统
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderSystemRef.current = new RenderSystem(ctx);
  }, []);

  // 渲染循环
  useEffect(() => {
    if (!renderSystemRef.current) return;

    renderSystemRef.current.render(maze, player);
  }, [maze, player]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_CONFIG.WIDTH}
      height={CANVAS_CONFIG.HEIGHT}
      className="border-4 border-horror-red shadow-lg"
      style={{
        imageRendering: 'pixelated',
      }}
    />
  );
}
