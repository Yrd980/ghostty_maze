import { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { HeartRateDisplay } from './UI/HeartRateDisplay';
import { DebugPanel } from './UI/DebugPanel';
import { BatteryDisplay } from './UI/BatteryDisplay';
import { InventoryDisplay } from './UI/InventoryDisplay';
import { MazeGenerator } from '../systems/MazeGenerator';
// import { CollisionSystem } from '../systems/CollisionSystem'; // Commented out - wall collision disabled
import { ItemSystem } from '../systems/ItemSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FlashlightController } from '../managers/FlashlightController';
import { AudioManager } from '../managers/AudioManager';
import { useKeyboard } from '../hooks/useKeyboard';
import type { Maze, Player, Flashlight, Item, Inventory, Enemy, GameState, Scene } from '../types/game.types';
import { ItemType, RandomEvent, SceneType } from '../types/game.types';
import { PLAYER_CONFIG, HEARTRATE_CONFIG, ITEM_CONFIG, LUCK_CONFIG, ENEMY_CONFIG, SANITY_CONFIG, EVENT_CONFIG, SCENE_CONFIG } from '../constants/game.constants';

export function Game() {
  const [gameState, setGameState] = useState<GameState>('playing');
  const [maze, setMaze] = useState<Maze | null>(null);
  const [scene, setScene] = useState<Scene>({
    type: SceneType.NORMAL,
    level: 1,
    itemsCollected: 0,
    timeInScene: 0,
  });
  const [showSceneTransition, setShowSceneTransition] = useState(false);
  const [nextSceneTime, setNextSceneTime] = useState(0);
  const sceneStartTimeRef = useRef(0);
  const [player, setPlayer] = useState<Player>({
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    health: PLAYER_CONFIG.MAX_HEALTH,
    luck: LUCK_CONFIG.INITIAL_LUCK,
    sanity: SANITY_CONFIG.INITIAL_SANITY,
    isMoving: false,
    isSprinting: false,
    direction: 0,
  });
  const [isDebuffed, setIsDebuffed] = useState(false);
  const [fakeItemMessage, setFakeItemMessage] = useState<string>('');
  const debuffEndTimeRef = useRef(0);
  const messageTimeoutRef = useRef<number>(0);
  const [fps, setFps] = useState(60);
  const [bpm, setBpm] = useState(HEARTRATE_CONFIG.BASE_BPM);
  const [flashlight, setFlashlight] = useState<Flashlight | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [inventory, setInventory] = useState<Inventory>({
    slots: [
      { item: null, count: 0 },
      { item: null, count: 0 },
      { item: null, count: 0 },
      { item: null, count: 0 },
    ],
    maxSlots: 4,
  });

  const keysRef = useKeyboard();
  const lastTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });
  const flashlightControllerRef = useRef<FlashlightController | null>(null);
  const itemSystemRef = useRef<ItemSystem | null>(null);
  const enemySystemRef = useRef<EnemySystem | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const lastFlashlightKeyRef = useRef(false);
  const currentPlayerPosRef = useRef({ x: 0, y: 0 });
  const lastGhostHitTime = useRef(0);

  // 生成迷宫
  const generateMaze = useCallback(() => {
    const generator = new MazeGenerator();
    const newMaze = generator.generate();
    setMaze(newMaze);

    // 生成道具
    if (!itemSystemRef.current) {
      itemSystemRef.current = new ItemSystem();
    }
    const newItems = itemSystemRef.current.generateItems(newMaze);
    setItems(newItems);

    // 生成敌人
    if (!enemySystemRef.current) {
      enemySystemRef.current = new EnemySystem();
    }
    const newEnemies = enemySystemRef.current.generateEnemies(newMaze);
    setEnemies(newEnemies);

    // 设置玩家初始位置
    setPlayer((prev) => ({
      ...prev,
      position: { ...newMaze.startPos },
      luck: LUCK_CONFIG.INITIAL_LUCK,
    }));

    // 重置场景时间
    sceneStartTimeRef.current = performance.now();
  }, []);

  // 进入新场景
  const enterNewScene = useCallback(() => {
    const sceneTypes = [SceneType.NORMAL, SceneType.DARK, SceneType.TWISTED, SceneType.CRIMSON, SceneType.VOID];
    const newSceneType = sceneTypes[Math.floor(Math.random() * sceneTypes.length)];
    
    setScene((prev) => ({
      type: newSceneType,
      level: prev.level + 1,
      itemsCollected: 0,
      timeInScene: 0,
    }));

    // 更新音乐以匹配新场景
    if (audioManagerRef.current) {
      audioManagerRef.current.onSceneTransition(newSceneType);
    }

    // 设置下一次场景转换的随机时间（6-12秒）
    const randomTime = 
      SCENE_CONFIG.MIN_TIME_TO_NEXT_SCENE + 
      Math.random() * (SCENE_CONFIG.MAX_TIME_TO_NEXT_SCENE - SCENE_CONFIG.MIN_TIME_TO_NEXT_SCENE);
    setNextSceneTime(randomTime);

    // 显示场景转换动画
    setShowSceneTransition(true);
    setTimeout(() => {
      setShowSceneTransition(false);
      generateMaze();
    }, 1500); // 缩短转换动画到1.5秒
  }, [generateMaze]);

  // 处理道具拾取
  const handleItemPickup = (item: Item) => {
    // 基础道具直接使用
    if (item.type === ItemType.BATTERY) {
      if (flashlightControllerRef.current) {
        flashlightControllerRef.current.rechargeBattery(ITEM_CONFIG.BATTERY_RESTORE);
      }
      return;
    }

    if (item.type === ItemType.MEDKIT) {
      setPlayer((prev) => ({
        ...prev,
        health: Math.min(PLAYER_CONFIG.MAX_HEALTH, prev.health + ITEM_CONFIG.MEDKIT_HEAL),
      }));
      return;
    }

    // 收藏品添加到库存
    addToInventory(item.type);

    // 增加场景收集计数
    setScene((prev) => ({
      ...prev,
      itemsCollected: prev.itemsCollected + 1,
    }));

    // 收藏品触发随机事件
    if (item.isFake || Math.random() < 0.5) {
      // 50%概率触发事件，或假道具必定触发
      triggerRandomEvent();
    }
  };

  // 触发随机事件
  const triggerRandomEvent = () => {
    const rand = Math.random();
    let event: RandomEvent;
    let message = '';
    let cumulative = 0;

    // 根据概率选择事件
    cumulative += EVENT_CONFIG.ESCAPE_PORTAL_CHANCE;
    if (rand < cumulative) {
      event = RandomEvent.ESCAPE_PORTAL;
      message = '🌀 ESCAPE PORTAL OPENED!';
      setGameState('victory'); // 直接胜利！
    } else {
      cumulative += EVENT_CONFIG.SPAWN_GHOST_CHANCE;
      if (rand < cumulative) {
        event = RandomEvent.SPAWN_GHOST;
        message = '👻 GHOST SPAWNED!';
      } else {
        cumulative += EVENT_CONFIG.DAMAGE_CHANCE;
        if (rand < cumulative) {
          event = RandomEvent.DAMAGE;
          message = '⚠️ CURSED! -20 HP';
        } else {
          cumulative += EVENT_CONFIG.SANITY_LOSS_CHANCE;
          if (rand < cumulative) {
            event = RandomEvent.SANITY_LOSS;
            message = '😱 SANITY DRAIN! -20 SAN';
          } else {
            cumulative += EVENT_CONFIG.CURSE_CHANCE;
            if (rand < cumulative) {
              event = RandomEvent.CURSE;
              message = '🐌 CURSED! Slowed';
            } else {
              cumulative += EVENT_CONFIG.HEAL_CHANCE;
              if (rand < cumulative) {
                event = RandomEvent.HEAL;
                message = '💚 BLESSED! +20 HP';
              } else {
                cumulative += EVENT_CONFIG.SANITY_RESTORE_CHANCE;
                if (rand < cumulative) {
                  event = RandomEvent.SANITY_RESTORE;
                  message = '✨ CLARITY! +20 SAN';
                } else {
                  cumulative += EVENT_CONFIG.LUCK_BOOST_CHANCE;
                  if (rand < cumulative) {
                    event = RandomEvent.LUCK_BOOST;
                    message = '🍀 LUCKY! +15 LUCK';
                  } else {
                    cumulative += EVENT_CONFIG.TREASURE_CHANCE;
                    if (rand < cumulative) {
                      event = RandomEvent.TREASURE;
                      message = '💎 TREASURE FOUND!';
                    } else {
                      cumulative += EVENT_CONFIG.SCENE_TRANSITION_CHANCE;
                      if (rand < cumulative) {
                        event = RandomEvent.SCENE_TRANSITION;
                        message = '🌀 REALITY SHIFTS...';
                      } else {
                        event = RandomEvent.NOTHING;
                        message = '...Nothing happened';
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // 显示消息
    setFakeItemMessage(message);
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    messageTimeoutRef.current = window.setTimeout(() => {
      setFakeItemMessage('');
    }, 3000);

    // 应用效果
    applyEventEffect(event);
  };

  // 应用事件效果
  const applyEventEffect = (event: RandomEvent) => {
    switch (event) {
      case RandomEvent.SPAWN_GHOST:
        if (enemySystemRef.current && maze) {
          const newGhost: Enemy = {
            id: `ghost-event-${Date.now()}`,
            type: 'ghost' as any,
            position: {
              x: player.position.x + (Math.random() - 0.5) * 100,
              y: player.position.y + (Math.random() - 0.5) * 100,
            },
            velocity: { x: 0, y: 0 },
            state: 'wander' as any,
            direction: Math.random() * Math.PI * 2,
            speed: ENEMY_CONFIG.GHOST_SPEED,
            detectionRadius: ENEMY_CONFIG.GHOST_DETECTION_RADIUS,
            canPassWalls: true,
          };
          enemySystemRef.current.getEnemies().push(newGhost);
          setEnemies([...enemySystemRef.current.getEnemies()]);
        }
        break;

      case RandomEvent.DAMAGE:
        setPlayer((prev) => ({
          ...prev,
          health: Math.max(0, prev.health - 20),
        }));
        break;

      case RandomEvent.SANITY_LOSS:
        setPlayer((prev) => ({
          ...prev,
          sanity: Math.max(0, prev.sanity - 20),
        }));
        break;

      case RandomEvent.CURSE:
        setIsDebuffed(true);
        debuffEndTimeRef.current =
          performance.now() + HEARTRATE_CONFIG.DEBUFF_DURATION * 2 * 1000;
        break;

      case RandomEvent.HEAL:
        setPlayer((prev) => ({
          ...prev,
          health: Math.min(PLAYER_CONFIG.MAX_HEALTH, prev.health + 20),
        }));
        break;

      case RandomEvent.SANITY_RESTORE:
        setPlayer((prev) => ({
          ...prev,
          sanity: Math.min(SANITY_CONFIG.MAX_SANITY, prev.sanity + 20),
        }));
        break;

      case RandomEvent.LUCK_BOOST:
        setPlayer((prev) => ({
          ...prev,
          luck: Math.min(LUCK_CONFIG.MAX_LUCK, prev.luck + 15),
        }));
        break;

      case RandomEvent.TREASURE:
        // 生成额外道具
        if (itemSystemRef.current && maze) {
          itemSystemRef.current.spawnItem(ItemType.MEDKIT, maze);
          itemSystemRef.current.spawnItem(ItemType.BATTERY, maze);
          setItems([...itemSystemRef.current.getItems()]);
        }
        break;

      case RandomEvent.ESCAPE_PORTAL:
        // 已在上面处理
        break;

      case RandomEvent.SCENE_TRANSITION:
        // 进入新场景
        enterNewScene();
        break;

      case RandomEvent.NOTHING:
        // 什么都不做
        break;
    }
  };

  // 添加道具到库存
  const addToInventory = (itemType: ItemType) => {
    setInventory((prev) => {
      const newSlots = [...prev.slots];

      // 查找已有相同道具的槽位
      const existingIndex = newSlots.findIndex((slot) => slot.item === itemType);
      if (existingIndex !== -1) {
        newSlots[existingIndex].count++;
        return { ...prev, slots: newSlots };
      }

      // 查找空槽位
      const emptyIndex = newSlots.findIndex((slot) => slot.item === null);
      if (emptyIndex !== -1) {
        newSlots[emptyIndex] = { item: itemType, count: 1 };
        return { ...prev, slots: newSlots };
      }

      // 库存已满
      return prev;
    });
  };

  // 初始化
  useEffect(() => {
    generateMaze();

    // 初始化手电筒控制器
    flashlightControllerRef.current = new FlashlightController();
    setFlashlight(flashlightControllerRef.current.getState());

    // 初始化音频管理器
    audioManagerRef.current = new AudioManager();
    
    // 尝试播放BGM（可能被浏览器阻止）
    audioManagerRef.current.playBGM();

    // 设置第一次场景转换的随机时间
    const randomTime = 
      SCENE_CONFIG.MIN_TIME_TO_NEXT_SCENE + 
      Math.random() * (SCENE_CONFIG.MAX_TIME_TO_NEXT_SCENE - SCENE_CONFIG.MIN_TIME_TO_NEXT_SCENE);
    setNextSceneTime(randomTime);

    // 清理函数
    return () => {
      if (audioManagerRef.current) {
        audioManagerRef.current.dispose();
      }
    };
  }, [generateMaze]);

  // 检测游戏结束
  useEffect(() => {
    if (player.health <= 0 && gameState === 'playing') {
      setGameState('gameOver');
    }
  }, [player.health, gameState]);

  // 胜利只能通过随机事件触发（逃脱传送门）

  // 游戏循环
  useEffect(() => {
    if (!maze || gameState !== 'playing') return;

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
        const isSprinting = keys.sprint && isMoving;

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

        // 应用 debuff（如果存在）
        if (isDebuffed) {
          speed *= HEARTRATE_CONFIG.SPEED_DEBUFF;
        }

        velocityX *= speed;
        velocityY *= speed;

        // 计算新位置
        const newPosition = {
          x: prevPlayer.position.x + velocityX * deltaTime,
          y: prevPlayer.position.y + velocityY * deltaTime,
        };

        // 碰撞检测 - COMMENTED OUT to allow free movement
        // const finalPosition = CollisionSystem.resolveCollision(
        //   maze,
        //   prevPlayer.position,
        //   newPosition,
        //   8
        // );
        const finalPosition = newPosition; // No wall collision

        // 计算方向
        let direction = prevPlayer.direction;
        if (isMoving) {
          direction = Math.atan2(velocityY, velocityX);
        }

        // 更新当前位置引用
        currentPlayerPosRef.current = finalPosition;

        return {
          position: finalPosition,
          velocity: { x: velocityX, y: velocityY },
          health: prevPlayer.health,
          luck: prevPlayer.luck,
          sanity: prevPlayer.sanity,
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
        const targetBpm = isSprinting
          ? HEARTRATE_CONFIG.SPRINTING_BPM
          : isMoving
            ? HEARTRATE_CONFIG.WALKING_BPM
            : HEARTRATE_CONFIG.BASE_BPM;
        const newBpm = prevBpm + (targetBpm - prevBpm) * deltaTime * 2;
        
        // 更新音频以匹配心率
        if (audioManagerRef.current) {
          audioManagerRef.current.updateByHeartRate(newBpm);
        }
        
        return newBpm;
      });

      // 检查 debuff 是否过期
      if (isDebuffed && performance.now() > debuffEndTimeRef.current) {
        setIsDebuffed(false);
      }

      // 根据心率阶段随机触发 debuff
      if (!isDebuffed) {
        let debuffChance = 0;
        if (bpm >= HEARTRATE_CONFIG.STAGE_3_THRESHOLD) {
          debuffChance = HEARTRATE_CONFIG.STAGE_3_DEBUFF_CHANCE * deltaTime;
        } else if (bpm >= HEARTRATE_CONFIG.STAGE_2_THRESHOLD) {
          debuffChance = HEARTRATE_CONFIG.STAGE_2_DEBUFF_CHANCE * deltaTime;
        } else if (bpm >= HEARTRATE_CONFIG.STAGE_1_THRESHOLD) {
          debuffChance = HEARTRATE_CONFIG.STAGE_1_DEBUFF_CHANCE * deltaTime;
        }

        if (Math.random() < debuffChance) {
          setIsDebuffed(true);
          debuffEndTimeRef.current =
            performance.now() + HEARTRATE_CONFIG.DEBUFF_DURATION * 1000;
        }
      }

      // 处理手电筒开关（F键）
      const currentFlashlightKey = keysRef.current.flashlight;
      if (currentFlashlightKey && !lastFlashlightKeyRef.current) {
        flashlightControllerRef.current?.toggle();
      }
      lastFlashlightKeyRef.current = currentFlashlightKey;

      // 更新手电筒状态
      if (flashlightControllerRef.current) {
        flashlightControllerRef.current.update(deltaTime, bpm);
        setFlashlight(flashlightControllerRef.current.getState());
      }

      // 更新敌人
      if (enemySystemRef.current && maze) {
        enemySystemRef.current.update(deltaTime, currentPlayerPosRef.current, maze);
        setEnemies([...enemySystemRef.current.getEnemies()]);

        // 检测幽灵碰撞
        const hitEnemy = enemySystemRef.current.checkCollision(currentPlayerPosRef.current);
        if (hitEnemy) {
          const currentTime = performance.now();
          // 每秒最多受伤一次
          if (currentTime - lastGhostHitTime.current > 1000) {
            lastGhostHitTime.current = currentTime;
            setPlayer((prev) => ({
              ...prev,
              health: Math.max(0, prev.health - ENEMY_CONFIG.DAMAGE),
              luck: Math.max(LUCK_CONFIG.MIN_LUCK, prev.luck - ENEMY_CONFIG.LUCK_PENALTY),
              sanity: Math.max(0, prev.sanity - SANITY_CONFIG.GHOST_COLLISION_LOSS),
            }));
          }
        }
      }

      // 检测道具拾取（使用最新的玩家位置）
      if (itemSystemRef.current) {
        const pickedItem = itemSystemRef.current.checkPickup(currentPlayerPosRef.current);
        if (pickedItem) {
          handleItemPickup(pickedItem);
          setItems([...itemSystemRef.current.getItems()]);
        }
      }

      // 更新音频以匹配理智值
      if (audioManagerRef.current) {
        audioManagerRef.current.updateBySanity(player.sanity);
      }

      // 更新场景时间并检查是否需要转换场景
      const timeInScene = (currentTime - sceneStartTimeRef.current) / 1000;
      setScene((prev) => ({
        ...prev,
        timeInScene,
      }));
      
      if (timeInScene >= nextSceneTime) {
        enterNewScene();
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    fpsCounterRef.current.lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationId);
  }, [maze]);

  // Victory Screen
  if (gameState === 'victory') {
    const collectedCount = inventory.slots.reduce((count, slot) => count + slot.count, 0);
    
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-purple-900 to-black">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">🌀</div>
          <div className="text-cyan-400 text-5xl font-bold animate-pulse" style={{ textShadow: '0 0 20px #22d3ee' }}>
            ESCAPED!
          </div>
          <div className="text-white text-2xl">
            You found the portal and escaped!
          </div>
          <div className="text-horror-gray text-lg space-y-2">
            <div>📦 Items Collected: {collectedCount}</div>
            <div>💚 Health Remaining: {player.health}</div>
            <div>🧠 Sanity Remaining: {Math.round(player.sanity)}</div>
            <div>🍀 Final Luck: {Math.round(player.luck)}</div>
          </div>
          <button
            onClick={() => {
              setGameState('playing');
              generateMaze();
              setPlayer((prev) => ({
                ...prev,
                health: PLAYER_CONFIG.MAX_HEALTH,
                luck: LUCK_CONFIG.INITIAL_LUCK,
                sanity: SANITY_CONFIG.INITIAL_SANITY,
              }));
            }}
            className="mt-8 bg-cyan-600 text-white px-8 py-4 rounded horror-border hover:bg-cyan-700 transition-colors font-bold text-xl"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Game Over Screen
  if (gameState === 'gameOver') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="text-center space-y-6">
          <div className="text-6xl mb-4">💀</div>
          <div className="text-horror-red text-4xl font-bold horror-glow animate-pulse">
            YOU DIED
          </div>
          <div className="text-horror-gray text-xl">
            The darkness consumed you...
          </div>
          <button
            onClick={() => {
              setGameState('playing');
              generateMaze();
              setPlayer((prev) => ({
                ...prev,
                health: PLAYER_CONFIG.MAX_HEALTH,
                luck: LUCK_CONFIG.INITIAL_LUCK,
              }));
            }}
            className="mt-8 bg-horror-red text-white px-8 py-4 rounded horror-border hover:bg-red-700 transition-colors font-bold text-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

        {flashlight && (
          <BatteryDisplay
            percentage={flashlightControllerRef.current?.getBatteryPercentage() || 0}
            isOn={flashlight.isOn}
          />
        )}

        {/* Luck is hidden from player - it affects fake item chance in backend */}

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
            <div className="text-xs text-horror-gray mb-1">Sanity</div>
            <div className="w-32 h-4 bg-gray-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  player.sanity > 50 ? 'bg-blue-500' : player.sanity > 20 ? 'bg-yellow-500' : 'bg-horror-red'
                }`}
                style={{ width: `${player.sanity}%` }}
              />
            </div>
          </div>

          {/* Debuff indicator */}
          {isDebuffed && (
            <div className="bg-horror-dark px-4 py-2 rounded horror-border border-2 border-purple-500 animate-pulse">
              <div className="text-xs text-purple-400 mb-1">Cursed</div>
              <div className="text-purple-400 text-sm">⚠️ Slowed</div>
            </div>
          )}
        </div>
      </div>

      {/* 游戏画布 */}
      <GameCanvas 
        maze={maze} 
        player={player} 
        flashlight={flashlight} 
        items={items} 
        enemies={enemies} 
        heartRate={bpm}
        sanity={player.sanity}
      />

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
          <div>F - Toggle Flashlight</div>
        </div>
        <div className="text-cyan-400 text-xs mt-3 border-t border-gray-700 pt-2">
          🌀 Collect items to trigger random events
        </div>
        <div className="text-purple-400 text-xs mt-1">
          🎲 Find the escape portal to win!
        </div>
        
        {/* 音频控制 */}
        <button
          onClick={() => {
            if (audioManagerRef.current) {
              audioManagerRef.current.toggleMute();
              // 如果是第一次点击，尝试播放BGM
              audioManagerRef.current.playBGM();
            }
          }}
          className="mt-3 w-full bg-horror-dark text-horror-gray px-3 py-2 rounded border border-gray-700 hover:bg-gray-800 hover:text-white transition-colors text-xs"
        >
          {audioManagerRef.current?.isMutedState() ? '🔇 Unmute BGM' : '🔊 Mute BGM'}
        </button>
      </div>

      {/* 库存显示 */}
      <div className="fixed top-4 right-4 space-y-2">
        <InventoryDisplay inventory={inventory} />
        
        {/* 收藏品计数 */}
        <div className="bg-horror-dark bg-opacity-90 p-3 rounded horror-border text-sm">
          <div className="text-purple-400 font-bold mb-1">📦 COLLECTION</div>
          <div className="text-horror-gray">
            Items: {inventory.slots.reduce((count, slot) => count + slot.count, 0)}
          </div>
          <div className="text-horror-gray text-xs mt-1">
            Collect items to trigger events
          </div>
        </div>
      </div>

      {/* 假道具消息 */}
      {fakeItemMessage && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="bg-horror-red bg-opacity-90 px-8 py-6 rounded-lg horror-border border-4 border-red-600 animate-pulse">
            <div className="text-white text-3xl font-bold text-center horror-glow">
              {fakeItemMessage}
            </div>
          </div>
        </div>
      )}

      {/* 场景转换警告 - 最后3秒 */}
      {!showSceneTransition && nextSceneTime - scene.timeInScene < 3 && nextSceneTime - scene.timeInScene > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div 
            className="absolute inset-0 border-8 animate-pulse"
            style={{
              borderColor: scene.type === SceneType.NORMAL ? '#4ade80' :
                          scene.type === SceneType.DARK ? '#6366f1' :
                          scene.type === SceneType.TWISTED ? '#a855f7' :
                          scene.type === SceneType.CRIMSON ? '#ef4444' :
                          '#22d3ee',
              boxShadow: `inset 0 0 50px ${
                scene.type === SceneType.NORMAL ? '#4ade80' :
                scene.type === SceneType.DARK ? '#6366f1' :
                scene.type === SceneType.TWISTED ? '#a855f7' :
                scene.type === SceneType.CRIMSON ? '#ef4444' :
                '#22d3ee'
              }`,
            }}
          />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div 
              className="text-6xl font-bold animate-bounce"
              style={{
                color: scene.type === SceneType.NORMAL ? '#4ade80' :
                       scene.type === SceneType.DARK ? '#6366f1' :
                       scene.type === SceneType.TWISTED ? '#a855f7' :
                       scene.type === SceneType.CRIMSON ? '#ef4444' :
                       '#22d3ee',
                textShadow: `0 0 40px ${
                  scene.type === SceneType.NORMAL ? '#4ade80' :
                  scene.type === SceneType.DARK ? '#6366f1' :
                  scene.type === SceneType.TWISTED ? '#a855f7' :
                  scene.type === SceneType.CRIMSON ? '#ef4444' :
                  '#22d3ee'
                }`,
              }}
            >
              {Math.ceil(nextSceneTime - scene.timeInScene)}
            </div>
          </div>
        </div>
      )}

      {/* 场景转换动画 */}
      {showSceneTransition && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000"
          style={{
            background: scene.type === SceneType.NORMAL ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' :
                       scene.type === SceneType.DARK ? 'linear-gradient(135deg, #000000 0%, #1a0a0a 100%)' :
                       scene.type === SceneType.TWISTED ? 'linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%)' :
                       scene.type === SceneType.CRIMSON ? 'linear-gradient(135deg, #4a0000 0%, #2d0000 100%)' :
                       'linear-gradient(135deg, #0a0a1a 0%, #000000 100%)',
            animation: 'sceneWarp 1.5s ease-in-out',
          }}
        >
          <style>{`
            @keyframes sceneWarp {
              0% { transform: scale(1) rotate(0deg); opacity: 0; }
              50% { transform: scale(1.2) rotate(5deg); opacity: 1; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes iconSpin {
              0% { transform: rotate(0deg) scale(1); }
              50% { transform: rotate(180deg) scale(1.3); }
              100% { transform: rotate(360deg) scale(1); }
            }
            @keyframes textGlitch {
              0%, 100% { transform: translate(0); }
              20% { transform: translate(-2px, 2px); }
              40% { transform: translate(2px, -2px); }
              60% { transform: translate(-2px, -2px); }
              80% { transform: translate(2px, 2px); }
            }
          `}</style>
          
          <div className="text-center space-y-6 relative">
            {/* 背景光晕效果 */}
            <div 
              className="absolute inset-0 blur-3xl opacity-50"
              style={{
                background: scene.type === SceneType.NORMAL ? 'radial-gradient(circle, #4ade80 0%, transparent 70%)' :
                           scene.type === SceneType.DARK ? 'radial-gradient(circle, #6366f1 0%, transparent 70%)' :
                           scene.type === SceneType.TWISTED ? 'radial-gradient(circle, #a855f7 0%, transparent 70%)' :
                           scene.type === SceneType.CRIMSON ? 'radial-gradient(circle, #ef4444 0%, transparent 70%)' :
                           'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
              }}
            />

            {/* 场景图标 */}
            <div 
              className="text-8xl mb-4 relative z-10"
              style={{ animation: 'iconSpin 1.5s ease-in-out' }}
            >
              {scene.type === SceneType.NORMAL && '🌫️'}
              {scene.type === SceneType.DARK && '🌑'}
              {scene.type === SceneType.TWISTED && '🌀'}
              {scene.type === SceneType.CRIMSON && '🩸'}
              {scene.type === SceneType.VOID && '⚫'}
            </div>

            {/* 标题 */}
            <div 
              className="text-5xl font-bold relative z-10"
              style={{
                color: scene.type === SceneType.NORMAL ? '#4ade80' :
                       scene.type === SceneType.DARK ? '#6366f1' :
                       scene.type === SceneType.TWISTED ? '#a855f7' :
                       scene.type === SceneType.CRIMSON ? '#ef4444' :
                       '#22d3ee',
                textShadow: `0 0 30px ${
                  scene.type === SceneType.NORMAL ? '#4ade80' :
                  scene.type === SceneType.DARK ? '#6366f1' :
                  scene.type === SceneType.TWISTED ? '#a855f7' :
                  scene.type === SceneType.CRIMSON ? '#ef4444' :
                  '#22d3ee'
                }`,
                animation: 'textGlitch 0.3s infinite',
              }}
            >
              {SCENE_CONFIG.SCENES[scene.type.toUpperCase() as keyof typeof SCENE_CONFIG.SCENES]?.name || 'Unknown'}
            </div>

            {/* 描述 */}
            <div className="text-white text-xl opacity-80 relative z-10">
              {SCENE_CONFIG.SCENES[scene.type.toUpperCase() as keyof typeof SCENE_CONFIG.SCENES]?.description || ''}
            </div>

            {/* 等级 */}
            <div className="text-horror-gray text-2xl font-bold relative z-10">
              LEVEL {scene.level + 1}
            </div>

            {/* 粒子效果 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    background: scene.type === SceneType.NORMAL ? '#4ade80' :
                               scene.type === SceneType.DARK ? '#6366f1' :
                               scene.type === SceneType.TWISTED ? '#a855f7' :
                               scene.type === SceneType.CRIMSON ? '#ef4444' :
                               '#22d3ee',
                    animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.6,
                  }}
                />
              ))}
            </div>
            
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0) scale(1); opacity: 0; }
                50% { transform: translateY(-50px) scale(1.5); opacity: 0.8; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* 场景信息显示 */}
      <div className="fixed bottom-4 left-4 bg-horror-dark bg-opacity-90 p-3 rounded horror-border text-sm">
        <div className="text-cyan-400 font-bold mb-1">
          {SCENE_CONFIG.SCENES[scene.type.toUpperCase() as keyof typeof SCENE_CONFIG.SCENES]?.name || 'Unknown Scene'}
        </div>
        <div className="text-horror-gray text-xs">
          Level {scene.level} | Items: {scene.itemsCollected}
        </div>
        <div className="text-horror-gray text-xs">
          {SCENE_CONFIG.SCENES[scene.type.toUpperCase() as keyof typeof SCENE_CONFIG.SCENES]?.description || ''}
        </div>
        <div className={`text-xs mt-1 font-bold ${
          nextSceneTime - scene.timeInScene < 3 ? 'text-horror-red animate-pulse' : 'text-yellow-400'
        }`}>
          ⏱️ Next scene in: {Math.max(0, Math.ceil(nextSceneTime - scene.timeInScene))}s
        </div>
      </div>
    </div>
  );
}
