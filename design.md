# 心率驱动迷雾迷宫潜行恐怖游戏 - 设计文档

## 📋 项目概述

一个基于心率驱动的迷雾迷宫潜行恐怖游戏。玩家在迷宫中潜行、拾取道具并躲避智能追逐者，玩家的实时心率（系统模拟）将动态影响游戏难度、视觉效果和敌人行为。

### 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **渲染**: Canvas 2D API
- **音频**: Web Audio API (待实现)

---

## 🎮 核心设计理念

### 游戏视角
- **2D 俯视图（像素风格）**
- Canvas 渲染，复古恐怖氛围
- 640x640 像素画布（20x20 格子，每格 32px）

### 迷宫系统
- **程序化生成**：使用递归回溯算法（Recursive Backtracking DFS）
- 每次游戏生成全新随机迷宫
- 起点：左上角（绿色标记）
- 终点：右下角（蓝色标记）

### 游戏机制
- **道具系统**：手电筒电池、医疗包、钥匙、干扰道具
- **生存元素**：生命值、体力系统、受伤影响移动
- **敌人AI**：简单巡逻系统（预留扩展接口）

---

## 🧩 核心模块架构

### 1. HeartRateManager - 心率数据管理器

**职责**：心率数据采集、处理和分发

#### 核心特性

##### 1.1 事件驱动响应
自动响应游戏中的关键事件，每个事件有独特的心率响应曲线：

| 事件 | 触发条件 | 心率变化 | 持续时间 |
|------|---------|---------|---------|
| `EnemySpotted` | 被敌人发现 | 急剧上升到 120 BPM | 5-10秒 |
| `ItemCollected` | 拾取道具 | 短暂下降 -5 BPM | 2秒 |
| `PlayerHit` | 受到伤害 | 飙升到 130 BPM | 8-15秒 |
| `Hiding` | 躲藏中 | 逐渐恢复到 70 BPM | 15-30秒 |
| `ChaseStarted` | 追逐开始 | 跳到 110 BPM | 持续追逐时 |
| `SafeZone` | 进入安全区 | 缓慢降至 65 BPM | 20秒 |

支持多个事件效果叠加计算。

##### 1.2 真实生理模拟

```typescript
// 呼吸周期波动
heartRate += sin(time * breathCycle) * 3  // 4秒周期，±3 BPM

// 随机微小波动
heartRate += random(-1, 1)  // ±1-2 BPM

// 平滑过渡
currentBPM = lerp(currentBPM, targetBPM, deltaTime * smoothFactor)
```

##### 1.3 情境感知自动调整

- **敌人距离**：越近心率越高（10米内开始上升）
- **环境光照**：黑暗区域 +10 BPM
- **生命值**：低于 30% 时 +15 BPM
- **空间狭窄度**：死胡同或狭窄通道 +8 BPM

##### 1.4 预设模式

| 模式 | 基础 BPM | 波动范围 | 用途 |
|------|---------|---------|------|
| `Calm` | 65 | ±2 | 安全区域、休息时 |
| `Anxious` | 85 | ±5 | 正常探索 |
| `Panicked` | 120 | ±10 | 被追逐时 |
| `Exhausted` | 130→90 | ±8 | 长时间奔跑后恢复 |
| `Recovering` | 110→70 | ±4 | 脱离危险后平静 |

#### 接口设计

```typescript
interface HeartRateManager {
  // 获取当前心率数据
  getCurrentBPM(): number;
  getHeartRateState(): 'calm' | 'anxious' | 'panicked';

  // 事件触发
  onEvent(event: GameEvent): void;

  // 手动设置预设
  setPreset(preset: HeartRatePreset): void;

  // 情境更新
  updateContext(context: GameContext): void;
}
```

---

### 2. EnemyController - 敌人AI控制器

**职责**：追逐者AI逻辑和状态机管理

#### 状态机设计

```
┌─────────┐
│  Patrol │ ◄─────┐
└────┬────┘       │
     │ 发现玩家    │
     ▼            │
┌─────────┐       │
│  Chase  │       │ 失去目标
└────┬────┘       │
     │ 接近       │
     ▼            │
┌─────────┐       │
│ Attack  │       │
└─────────┘       │
                  │
┌─────────┐       │
│ Search  ├───────┘
└─────────┘
```

#### V1.0 简单实现（当前版本）

- **Patrol（巡逻）**：沿预定义路径点循环移动
- **Chase（追击）**：发现玩家后直线追击
- **Search（搜索）**：丢失玩家后在最后位置徘徊
- **Attack（攻击）**：近距离造成伤害

#### 扩展接口（预留）

```typescript
interface EnemyBehavior {
  // 状态更新
  updateState(deltaTime: number): void;

  // 玩家检测
  onPlayerDetected(playerPos: Vector2): void;
  onPlayerLost(): void;

  // 心率影响
  onHeartRateChange(bpm: number): void;  // 高心率增加检测距离

  // 声音检测
  onNoiseDetected(source: Vector2, volume: number): void;

  // 视觉检测
  canSeePlayer(playerPos: Vector2): boolean;
}
```

#### 心率驱动AI行为

| 玩家心率 | 敌人影响 |
|---------|---------|
| 60-80 BPM | 正常视野和速度 |
| 80-100 BPM | 视野范围 +20% |
| 100-120 BPM | 视野 +40%，速度 +10% |
| 120+ BPM | 视野 +60%，速度 +25%，听觉灵敏度提高 |

---

### 3. WarpManager - 视觉扭曲效果控制器

**职责**：心率驱动的屏幕后处理效果

#### 心率与视觉效果映射

| 心率范围 | 视觉效果 |
|---------|---------|
| 60-80 BPM | 无效果（正常视觉） |
| 80-100 BPM | 轻微色差（Chromatic Aberration，RGB 偏移 2px） |
| 100-120 BPM | 边缘模糊 + 暗角（Vignette，强度 0.3） |
| 120+ BPM | 径向模糊 + 颜色饱和度降低 30% + 镜头畸变 |

#### 实现方式

```typescript
// Canvas 滤镜
ctx.filter = `blur(${blurAmount}px) saturate(${saturation}%)`;

// CSS 后处理
.warp-effect {
  filter: brightness(0.8) contrast(1.2);
  animation: pulse 0.5s ease-in-out;
}

// 帧缓冲叠加
renderToBuffer() → applyDistortion() → renderToScreen()
```

---

### 4. PlayerController - 玩家控制器

**职责**：玩家移动、交互和状态管理

#### 移动系统

| 控制 | 功能 |
|------|------|
| WASD / 方向键 | 8方向移动 |
| Shift | 奔跑（消耗体力） |
| Ctrl | 蹲伏（降低被发现概率 -50%） |
| 1-4 数字键 | 使用道具栏物品 |
| F | 手电筒开关 |

#### 生存系统

**生命值（HP）**
- 最大值：100
- 受伤来源：敌人攻击（-20）、环境陷阱（-10）
- 恢复方式：医疗包（+30）、安全区缓慢恢复（+5/秒）
- 归零：Game Over

**体力值（Stamina）**
- 最大值：100
- 消耗：奔跑（-20/秒）、攀爬（-15/秒）
- 恢复：静止（+15/秒）、行走（+5/秒）
- 影响：低于 20% 时移动速度 -30%

**噪音系统**
- 静止：0 噪音
- 行走：20 噪音（检测半径 3 格）
- 奔跑：80 噪音（检测半径 8 格）
- 蹲伏移动：5 噪音（检测半径 1 格）

---

### 5. FlashlightController - 手电筒控制器

**职责**：光照系统和心率驱动抖动

#### 手电筒特性

```typescript
interface Flashlight {
  // 光照参数
  angle: 90,           // 圆锥角度
  range: 150,          // 照射距离（像素）
  brightness: 0.8,     // 亮度

  // 电池系统
  maxBattery: 120,     // 120秒续航
  currentBattery: 120,
  drainRate: 1,        // 每秒消耗

  // 状态
  isOn: boolean,
}
```

#### 心率驱动抖动

| 心率 | 抖动效果 |
|------|---------|
| 60-80 BPM | 无抖动 |
| 80-100 BPM | 轻微抖动（±1°） |
| 100-120 BPM | 中度抖动（±3°） |
| 120+ BPM | 剧烈抖动（±8°，手电筒难以瞄准） |

#### 光照影响

- **敌人视野**：手电筒照射到敌人会立即被发现
- **环境交互**：某些物品需要手电筒才能看见
- **电池管理**：需要拾取电池道具补充

---

### 6. GameStateManager - 游戏状态管理器

**职责**：游戏状态、关卡和事件管理

#### 状态流转

```
MainMenu → Playing → Paused → GameOver
              ↓         ↑
              └─────────┘
              ↓
           Victory
```

#### 胜利条件

- ✅ 收集所有钥匙（3个）
- ✅ 到达出口位置
- ✅ 生命值 > 0

#### 失败条件

- ❌ 生命值归零
- ❌ 被敌人困住超过 30 秒（可选）

#### 计分系统

```typescript
score =
  survivalTime * 10 +           // 生存时间
  itemsCollected * 50 +          // 道具收集
  enemiesAvoided * 100 +         // 成功躲避次数
  healthRemaining * 5 -          // 剩余血量
  timesPanicked * 20             // 恐慌次数扣分
```

---

### 7. AudioManager - 音频管理器

**职责**：动态音频混合和3D空间音效

#### 音频层级

1. **环境音（循环）**
   - 低频嗡鸣（30Hz, -20dB）
   - 风声（白噪音，-15dB）
   - 远处水滴声（随机触发）

2. **心跳音（动态）**
   ```javascript
   heartbeatInterval = (60 / currentBPM) * 1000
   playHeartbeatSound(every interval)
   volume = map(bpm, 60, 150, 0.3, 1.0)
   ```

3. **脚步声**
   - 行走：轻微脚步（-10dB）
   - 奔跑：沉重脚步（-5dB）
   - 蹲伏：几乎无声（-25dB）

4. **敌人音效（3D 空间音）**
   ```javascript
   // 使用 PannerNode 实现方向感
   panner.setPosition(enemy.x, enemy.y, 0)
   distance = calculateDistance(player, enemy)
   volume = 1 / (distance * 0.1)
   ```

5. **道具音效**
   - 拾取：清脆声（200ms）
   - 使用：特定音效（医疗包、钥匙不同）

#### Web Audio API 实现

```typescript
class AudioManager {
  private context: AudioContext;
  private masterGain: GainNode;
  private layers: Map<string, AudioBufferSourceNode>;

  playSound(buffer: AudioBuffer, position?: Vector2): void;
  playAmbient(buffer: AudioBuffer, loop: boolean): void;
  updateListenerPosition(position: Vector2): void;
  setMasterVolume(volume: number): void;
}
```

---

## 🎨 UI/UX 设计

### 恐怖氛围主题

#### 配色方案

```css
--horror-bg: #0a0a0a;      /* 纯黑背景 */
--horror-red: #ff4444;     /* 血红色（警告/心率） */
--horror-gray: #888888;    /* 灰白色（普通文字） */
--horror-dark: #1a1a1a;    /* 深灰（UI背景） */
```

#### HUD 布局

```
┌────────────────────────────────────────────┐
│ ❤️ HP: ████████░░  ⚡ STAMINA: ██████░░░░  │ ← 顶部状态栏
│ 💓 85 BPM          🔋 78%                   │
└────────────────────────────────────────────┘

              [游戏画布 640x640]

┌────────────────────────────────────────────┐
│ [1.电池] [2.医疗包] [3.钥匙x2] [4.空]      │ ← 底部道具栏
└────────────────────────────────────────────┘

右下角：Debug面板（可切换显示/隐藏）
左上角：操作说明
```

### UI 组件设计

#### 1. HeartRateDisplay（心率显示）

```tsx
<div className="heart-rate">
  <span className="icon">💓</span>  {/* 心跳动画 */}
  <div>
    <span className="bpm">85 BPM</span>
    <span className="label">Heart Rate</span>
  </div>
</div>
```

- 心跳图标根据 BPM 同步跳动
- 高心率时文字发红光
- 超过 120 BPM 时抖动效果

#### 2. DebugPanel（调试面板）

显示内容：
- FPS
- 玩家坐标 (X, Y)
- 生命值/体力值
- 移动状态
- 敌人状态和位置
- 当前心率和趋势

---

## 🗺️ 迷宫生成算法

### 递归回溯算法（Recursive Backtracking DFS）

```typescript
function generateMaze(width: number, height: number): Maze {
  // 1. 初始化所有单元格，四面都是墙
  const cells = initializeCells(width, height);

  // 2. 从起点开始
  const stack = [{ x: 0, y: 0 }];
  cells[0][0].visited = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // 3. 获取未访问的邻居
    const neighbors = getUnvisitedNeighbors(current, cells);

    if (neighbors.length > 0) {
      // 4. 随机选择一个邻居
      const next = randomChoice(neighbors);

      // 5. 移除两者之间的墙
      removeWall(current, next);

      // 6. 标记为已访问并入栈
      cells[next.y][next.x].visited = true;
      stack.push(next);
    } else {
      // 7. 回溯
      stack.pop();
    }
  }

  return { cells, startPos: {x: 0, y: 0}, endPos: {x: width-1, y: height-1} };
}
```

### 优化特性

- **保证连通性**：算法确保所有格子可达
- **无环路**：生成的是完美迷宫（Perfect Maze）
- **均匀分布**：死胡同和路径分布均匀
- **性能**：20x20 迷宫生成时间 < 10ms

---

## 🎯 道具系统设计

### 道具类型

| 道具 | 效果 | 稀有度 | 生成位置 |
|------|------|--------|---------|
| 🔋 电池 | 恢复手电筒 60秒续航 | 常见 | 随机通道 |
| 💊 医疗包 | 恢复 30 HP | 稀有 | 远离起点的死胡同 |
| 🔑 钥匙 | 开启出口（需3个） | 固定3个 | 迷宫深处 |
| 📻 干扰器 | 使敌人失去方向 10秒 | 罕见 | 隐藏房间 |
| ⏱️ 怀表 | 减缓时间流速 5秒 | 罕见 | 特殊位置 |

### 道具栏系统

```typescript
interface Inventory {
  slots: [Item?, Item?, Item?, Item?];  // 4个格子
  activeSlot: number;                    // 当前选中

  addItem(item: Item): boolean;
  useItem(slot: number): void;
  dropItem(slot: number): void;
}
```

---

## 📊 游戏平衡参数

### 玩家数值

```typescript
const PLAYER_CONFIG = {
  MAX_HEALTH: 100,
  MAX_STAMINA: 100,

  // 移动速度（像素/秒）
  WALK_SPEED: 150,
  SPRINT_SPEED: 270,    // 1.8x
  CROUCH_SPEED: 80,     // 0.53x

  // 体力消耗/恢复（每秒）
  SPRINT_DRAIN: 20,
  CROUCH_DRAIN: 5,
  IDLE_RECOVER: 15,
  WALK_RECOVER: 5,
};
```

### 敌人数值

```typescript
const ENEMY_CONFIG = {
  PATROL_SPEED: 100,       // 巡逻速度
  CHASE_SPEED: 200,        // 追击速度（略快于玩家行走）

  VISION_RANGE: 150,       // 视野范围（像素）
  VISION_ANGLE: 120,       // 视锥角度
  HEARING_RANGE: 200,      // 听觉范围

  ATTACK_DAMAGE: 20,       // 攻击伤害
  ATTACK_COOLDOWN: 1.5,    // 攻击冷却（秒）
};
```

### 难度曲线

根据游戏时间动态调整：

```typescript
difficulty = {
  enemyCount: 1 + floor(time / 120),      // 每2分钟 +1 敌人
  enemySpeed: baseSpeed * (1 + time/600), // 每10分钟 +100% 速度
  itemSpawnRate: max(0.5, 1 - time/300),  // 道具生成率下降
}
```

---

## 🔧 技术实现细节

### Canvas 渲染管线

```
1. Clear Canvas（清空画布）
   ↓
2. Render Maze（绘制迷宫墙壁和通道）
   ↓
3. Render Items（绘制道具）
   ↓
4. Render Enemies（绘制敌人）
   ↓
5. Render Player（绘制玩家）
   ↓
6. Apply Lighting（应用手电筒光照遮罩）
   ↓
7. Apply Warp Effects（应用心率驱动的视觉扭曲）
   ↓
8. Render UI Overlays（绘制 UI 叠加层）
```

### 碰撞检测

使用 AABB（轴对齐包围盒）检测：

```typescript
function checkCollision(player: Circle, wall: Rect): boolean {
  // 找到矩形上最近的点
  const closestX = clamp(player.x, wall.x, wall.x + wall.width);
  const closestY = clamp(player.y, wall.y, wall.y + wall.height);

  // 计算距离
  const dx = player.x - closestX;
  const dy = player.y - closestY;

  return (dx * dx + dy * dy) < (player.radius * player.radius);
}
```

### A* 寻路算法（敌人用）

```typescript
function findPath(start: Vector2, goal: Vector2, maze: Maze): Vector2[] {
  const openSet = new PriorityQueue();
  const cameFrom = new Map();

  openSet.push(start, heuristic(start, goal));

  while (!openSet.isEmpty()) {
    const current = openSet.pop();

    if (equals(current, goal)) {
      return reconstructPath(cameFrom, current);
    }

    for (const neighbor of getNeighbors(current, maze)) {
      const tentativeGScore = gScore.get(current) + 1;

      if (tentativeGScore < gScore.get(neighbor)) {
        cameFrom.set(neighbor, current);
        gScore.set(neighbor, tentativeGScore);
        fScore = tentativeGScore + heuristic(neighbor, goal);
        openSet.push(neighbor, fScore);
      }
    }
  }

  return []; // 无路径
}

// 曼哈顿距离启发函数
function heuristic(a: Vector2, b: Vector2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
```

---

## 📈 性能优化策略

### 渲染优化

1. **脏矩形更新**：只重绘变化的区域
2. **对象池**：复用粒子效果对象
3. **视锥裁剪**：只渲染可见区域的实体
4. **分层渲染**：静态层（迷宫）只渲染一次

### 游戏循环优化

```typescript
let lastTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;

function gameLoop(currentTime: number) {
  const deltaTime = currentTime - lastTime;

  if (deltaTime >= frameTime) {
    update(deltaTime / 1000);  // 转为秒
    render();
    lastTime = currentTime - (deltaTime % frameTime);
  }

  requestAnimationFrame(gameLoop);
}
```

### 碰撞检测优化

使用空间分区（Grid Partitioning）：

```typescript
// 将实体分配到网格
const grid = new Map<string, Entity[]>();

function updateGrid(entity: Entity) {
  const cellX = Math.floor(entity.x / CELL_SIZE);
  const cellY = Math.floor(entity.y / CELL_SIZE);
  const key = `${cellX},${cellY}`;

  if (!grid.has(key)) grid.set(key, []);
  grid.get(key).push(entity);
}

// 只检测相邻格子的碰撞
function getNearbyEntities(entity: Entity): Entity[] {
  const cells = getAdjacentCells(entity);
  return cells.flatMap(cell => grid.get(cell) || []);
}
```

---

## 🎓 开发路线图

### Phase 1: 核心原型（已完成）
- ✅ 迷宫生成
- ✅ 玩家移动和碰撞
- ✅ 基础 UI（心率显示、Debug面板）
- ✅ 心率模拟（简单版）

### Phase 2: 游戏机制（进行中）
- ⬜ 手电筒系统
- ⬜ 道具系统
- ⬜ 生命值/体力系统
- ⬜ 敌人 AI（简单巡逻）

### Phase 3: 视觉增强
- ⬜ 心率驱动视觉扭曲
- ⬜ 光照系统优化
- ⬜ 粒子效果
- ⬜ 屏幕抖动

### Phase 4: 音频系统
- ⬜ 环境音
- ⬜ 心跳声同步
- ⬜ 脚步声
- ⬜ 3D 空间音效

### Phase 5: 平衡与优化
- ⬜ 难度调整
- ⬜ 性能优化
- ⬜ Bug 修复
- ⬜ 用户测试

---

## 🧪 测试策略

### 单元测试

```typescript
// 迷宫生成测试
test('迷宫必须连通', () => {
  const maze = generator.generate(20, 20);
  expect(isFullyConnected(maze)).toBe(true);
});

// 心率系统测试
test('心率响应事件正确', () => {
  heartRate.onEvent('EnemySpotted');
  expect(heartRate.getCurrentBPM()).toBeGreaterThan(100);
});
```

### 集成测试

- 玩家移动 → 碰撞检测 → 正确阻挡
- 敌人检测 → 追击行为 → 攻击判定
- 道具拾取 → 库存更新 → 使用效果

### 性能测试

- **目标 FPS**: 60
- **内存占用**: < 100MB
- **迷宫生成时间**: < 50ms（20x20）
- **最大实体数**: 50+（玩家 + 敌人 + 道具）

---

## 📝 待解决问题

1. **心率数据来源**：
   - 当前：系统模拟
   - 未来：可选接入真实心率设备（蓝牙心率带）

2. **移动端适配**：
   - 触摸控制
   - 虚拟摇杆
   - 性能优化

3. **多人模式**：
   - 协作逃脱
   - 心率数据同步
   - 网络延迟处理

4. **存档系统**：
   - LocalStorage 保存进度
   - 成就系统
   - 排行榜

---

## 🔗 参考资料

- [Maze Generation Algorithms](http://www.astrolog.org/labyrnth/algrithm.htm)
- [Web Audio API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Canvas Performance Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [A* Pathfinding](https://www.redblobgames.com/pathfinding/a-star/introduction.html)

---

**文档版本**: v1.0
**最后更新**: 2025-11-01
**作者**: Claude Code + User
