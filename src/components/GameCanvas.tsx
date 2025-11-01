import { useEffect, useRef } from 'react';
import type { Maze, Player, Flashlight, Item } from '../types/game.types';
import { RenderSystem } from '../systems/RenderSystem';
import { FlashlightController } from '../managers/FlashlightController';
import { CANVAS_CONFIG } from '../constants/game.constants';

interface GameCanvasProps {
  maze: Maze;
  player: Player;
  flashlight?: Flashlight | null;
  items?: Item[];
}

export function GameCanvas({ maze, player, flashlight, items }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSystemRef = useRef<RenderSystem | null>(null);
  const flashlightControllerRef = useRef<FlashlightController | null>(null);

  // 初始化渲染系统
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderSystemRef.current = new RenderSystem(ctx);
    flashlightControllerRef.current = new FlashlightController();
  }, []);

  // 渲染循环
  useEffect(() => {
    if (!renderSystemRef.current) return;

    // 计算手电筒抖动后的方向
    let shakeDirection = player.direction;
    if (flashlight && flashlightControllerRef.current) {
      shakeDirection = flashlightControllerRef.current.getShakeDirection(
        player.direction
      );
    }

    renderSystemRef.current.render(
      maze,
      player,
      flashlight || undefined,
      shakeDirection,
      items
    );
  }, [maze, player, flashlight, items]);

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
