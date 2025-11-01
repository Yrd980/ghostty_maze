import { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { HeartRateDisplay } from './UI/HeartRateDisplay';
import { DebugPanel } from './UI/DebugPanel';
import { MazeGenerator } from '../systems/MazeGenerator';
import { CollisionSystem } from '../systems/CollisionSystem';
import { useKeyboard } from '../hooks/useKeyboard';
import type { Maze, Player } from '../types/game.types';
import { PLAYER_CONFIG, HEARTRATE_CONFIG } from '../constants/game.constants';

export function Game() {
  const [maze, setMaze] = useState<Maze | null>(null);
  const [player, setPlayer] = useState<Player>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    health: PLAYER_CONFIG.MAX_HEALTH,
    stamina: PLAYER_CONFIG.MAX_STAMINA,
    isMoving: false,
    isSprinting: false,
    direction: 0,
  });
  const [fps, setFps] = useState(60);
  const [bpm, setBpm] = useState(HEARTRATE_CONFIG.BASE_BPM);

  const keysRef = useKeyboard();
  const lastTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });

  // 生成迷宫
  const generateMaze = useCallback(() => {
    const generator = new MazeGenerator();
    const newMaze = generator.generate();
    setMaze(newMaze);

    // 设置玩家初始位置
    setPlayer((prev) => ({
      ...prev,
      position: { ...newMaze.startPos },
    }));
  }, []);

  // 初始化
  useEffect(() => {
    generateMaze();
  }, [generateMaze]);

  // 游戏循环
  useEffect(() => {
    if (!maze) return;

    let animationId: number;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // FPS 计数
      fpsCounterRef.current.frames++;
      if (currentTime - fpsCounterRef.current.lastTime >= 1000) {
        setFps(fpsCounterRef.current.frames);
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = currentTime;
      }

      // 更新玩家
      setPlayer((prevPlayer) => {
        const keys = keysRef.current;
        let velocityX = 0;
        let velocityY = 0;

        // 计算移动方向
        if (keys.up) velocityY -= 1;
        if (keys.down) velocityY += 1;
        if (keys.left) velocityX -= 1;
        if (keys.right) velocityX += 1;

        const isMoving = velocityX !== 0 || velocityY !== 0;
        const isSprinting = keys.sprint && prevPlayer.stamina > 0 && isMoving;

        // 归一化对角线移动
        if (velocityX !== 0 && velocityY !== 0) {
          velocityX *= 0.707;
          velocityY *= 0.707;
        }

        // 计算速度
        let speed = PLAYER_CONFIG.SPEED;
        if (isSprinting) {
          speed *= PLAYER_CONFIG.SPRINT_MULTIPLIER;
        }

        velocityX *= speed;
        velocityY *= speed;

        // 计算新位置
        const newPosition = {
          x: prevPlayer.position.x + velocityX * deltaTime,
          y: prevPlayer.position.y + velocityY * deltaTime,
        };

        // 碰撞检测
        const finalPosition = CollisionSystem.resolveCollision(
          maze,
          prevPlayer.position,
          newPosition,
          8
        );

        // 计算方向
        let direction = prevPlayer.direction;
        if (isMoving) {
          direction = Math.atan2(velocityY, velocityX);
        }

        // 更新体力
        let newStamina = prevPlayer.stamina;
        if (isSprinting) {
          newStamina = Math.max(
            0,
            prevPlayer.stamina - PLAYER_CONFIG.STAMINA_DRAIN_RATE * deltaTime
          );
        } else if (!isMoving) {
          newStamina = Math.min(
            PLAYER_CONFIG.MAX_STAMINA,
            prevPlayer.stamina + PLAYER_CONFIG.STAMINA_RECOVER_RATE * deltaTime
          );
        }

        return {
          position: finalPosition,
          velocity: { x: velocityX, y: velocityY },
          health: prevPlayer.health,
          stamina: newStamina,
          isMoving,
          isSprinting,
          direction,
        };
      });

      // 更新心率
      setBpm((prevBpm) => {
        const keys = keysRef.current;
        const isMoving = keys.up || keys.down || keys.left || keys.right;
        const isSprinting = keys.sprint && isMoving;
        const targetBpm = isSprinting ? 110 : isMoving ? 85 : 75;
        return prevBpm + (targetBpm - prevBpm) * deltaTime * 2;
      });

      animationId = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    fpsCounterRef.current.lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [maze]);

  if (!maze) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-horror-red text-2xl font-bold horror-glow">
          Generating Maze...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
      {/* 顶部 HUD */}
      <div className="flex gap-4 items-center">
        <HeartRateDisplay bpm={Math.round(bpm)} />

        <div className="flex gap-2">
          <div className="bg-horror-dark px-4 py-2 rounded horror-border">
            <div className="text-xs text-horror-gray mb-1">Health</div>
            <div className="w-32 h-4 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-horror-red transition-all duration-300"
                style={{ width: `${player.health}%` }}
              />
            </div>
          </div>

          <div className="bg-horror-dark px-4 py-2 rounded horror-border">
            <div className="text-xs text-horror-gray mb-1">Stamina</div>
            <div className="w-32 h-4 bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${player.stamina}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 游戏画布 */}
      <GameCanvas maze={maze} player={player} />

      {/* 控制按钮 */}
      <div className="flex gap-4">
        <button
          onClick={generateMaze}
          className="bg-horror-dark text-horror-red px-6 py-3 rounded horror-border hover:bg-horror-red hover:text-white transition-colors font-bold"
        >
          Regenerate Maze
        </button>
      </div>

      {/* Debug 面板 */}
      <DebugPanel player={player} fps={fps} />

      {/* 控制说明 */}
      <div className="fixed top-4 left-4 bg-horror-dark bg-opacity-90 p-4 rounded horror-border text-sm">
        <div className="text-horror-red font-bold mb-2">CONTROLS</div>
        <div className="text-horror-gray space-y-1">
          <div>WASD / Arrows - Move</div>
          <div>Shift - Sprint</div>
          <div>F - Flashlight (TBD)</div>
        </div>
      </div>
    </div>
  );
}
