import { useEffect, useRef } from 'react';
import type { Maze, Player, Flashlight, Item, Enemy } from '../types/game.types';
import { RenderSystem } from '../systems/RenderSystem';
import { FogSystem } from '../systems/FogSystem';
import { FlashlightController } from '../managers/FlashlightController';
import { CANVAS_CONFIG } from '../constants/game.constants';

interface GameCanvasProps {
  maze: Maze;
  player: Player;
  flashlight?: Flashlight | null;
  items?: Item[];
  enemies?: Enemy[];
  heartRate?: number;
  sanity?: number;
}

export function GameCanvas({ maze, player, flashlight, items, enemies, heartRate = 75, sanity = 100 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderSystemRef = useRef<RenderSystem | null>(null);
  const fogSystemRef = useRef<FogSystem | null>(null);
  const flashlightControllerRef = useRef<FlashlightController | null>(null);

  // 初始化渲染系统
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderSystemRef.current = new RenderSystem(ctx);
    fogSystemRef.current = new FogSystem(ctx);
    flashlightControllerRef.current = new FlashlightController();
  }, []);

  // 渲染循环
  useEffect(() => {
    if (!renderSystemRef.current || !fogSystemRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 计算手电筒抖动后的方向
    let shakeDirection = player.direction;
    if (flashlight && flashlightControllerRef.current) {
      shakeDirection = flashlightControllerRef.current.getShakeDirection(
        player.direction
      );
    }

    // 1. 渲染基础场景（迷宫、道具、玩家）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    renderSystemRef.current.renderMaze(maze);
    
    if (items) {
      renderSystemRef.current.renderItems(items);
    }
    if (enemies) {
      renderSystemRef.current.renderEnemies(enemies);
    }
    renderSystemRef.current.renderPlayer(player);

    // 2. 渲染迷雾层（在手电筒之前）
    fogSystemRef.current.renderFog(player, flashlight || undefined);
    
    // 3. 渲染手电筒光照（在迷雾之后，这样光可以照亮迷雾）
    if (flashlight && flashlight.isOn) {
      renderSystemRef.current.renderFlashlight(player, flashlight, shakeDirection);
    }
    
    // 4. 渲染暗角效果
    fogSystemRef.current.renderVignette();
    
    // 5. 渲染心率驱动的迷雾
    fogSystemRef.current.renderHeartRateFog(heartRate);
    
    // 6. 渲染理智值驱动的视觉扭曲
    fogSystemRef.current.renderSanityEffects(sanity);
  }, [maze, player, flashlight, items, enemies, heartRate, sanity]);

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
