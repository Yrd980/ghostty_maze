// 二维向量
export interface Vector2 {
  x: number;
  y: number;
}

// 迷宫单元格
export interface Cell {
  x: number;
  y: number;
  walls: {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  };
  visited: boolean;
}

// 迷宫数据结构
export interface Maze {
  width: number;
  height: number;
  cellSize: number;
  cells: Cell[][];
  startPos: Vector2;
  endPos: Vector2;
}

// 玩家状态
export interface Player {
  position: Vector2;
  velocity: Vector2;
  health: number;
  luck: number;             // 运气值
  sanity: number;           // 理智值 (SAN)
  isMoving: boolean;
  isSprinting: boolean;
  direction: number; // 角度
}

// 游戏状态
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

// 场景类型
export enum SceneType {
  NORMAL = 'normal',          // 普通迷宫
  DARK = 'dark',              // 黑暗迷宫
  TWISTED = 'twisted',        // 扭曲迷宫
  CRIMSON = 'crimson',        // 血色迷宫
  VOID = 'void',              // 虚空迷宫
}

// 场景数据
export interface Scene {
  type: SceneType;
  level: number;              // 场景层级
  itemsCollected: number;     // 本场景收集的物品数
  timeInScene: number;        // 在场景中的时间（秒）
}

// 随机事件类型
export enum RandomEvent {
  // 负面事件
  SPAWN_GHOST = 'spawn_ghost',      // 生成幽灵
  DAMAGE = 'damage',                // 受伤
  SANITY_LOSS = 'sanity_loss',      // 理智下降
  CURSE = 'curse',                  // 诅咒（减速）
  HALLUCINATION = 'hallucination',  // 幻觉
  
  // 正面事件
  HEAL = 'heal',                    // 治疗
  SANITY_RESTORE = 'sanity_restore',// 理智恢复
  LUCK_BOOST = 'luck_boost',        // 运气提升
  VISION_BOOST = 'vision_boost',    // 视野提升
  
  // 特殊事件
  ESCAPE_PORTAL = 'escape_portal',  // 逃脱传送门
  TREASURE = 'treasure',            // 宝藏（多个道具）
  SCENE_TRANSITION = 'scene_transition', // 场景转换
  NOTHING = 'nothing',              // 什么都没发生
}

// 键盘输入
export interface KeyboardInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  flashlight: boolean;
}

// 手电筒状态
export interface Flashlight {
  isOn: boolean;
  angle: number;           // 圆锥角度（度）
  range: number;           // 照射距离（像素）
  brightness: number;      // 亮度 (0-1)
  battery: number;         // 电池电量 (0-100)
  maxBattery: number;      // 最大电量
  drainRate: number;       // 消耗速度（每秒）
  shake: number;           // 当前抖动角度
}

// 道具类型 - 扩展为收藏品系统
export enum ItemType {
  // 基础道具
  BATTERY = 'battery',          // 电池
  MEDKIT = 'medkit',            // 医疗包
  
  // 收藏品/物种 (Species)
  ANCIENT_COIN = 'ancient_coin',        // 古币
  CRYSTAL = 'crystal',                  // 水晶
  SKULL = 'skull',                      // 骷髅
  BOOK = 'book',                        // 古书
  POTION = 'potion',                    // 药水
  ARTIFACT = 'artifact',                // 神器
  MUSHROOM = 'mushroom',                // 蘑菇
  FEATHER = 'feather',                  // 羽毛
  STONE = 'stone',                      // 符文石
  FLOWER = 'flower',                    // 诡异花朵
  EYE = 'eye',                          // 眼球
  TOOTH = 'tooth',                      // 牙齿
}

// 道具实体
export interface Item {
  id: string;
  type: ItemType;
  position: Vector2;
  isCollected: boolean;
  isFake?: boolean;         // 是否是假道具（陷阱）
}

// 敌人类型
export enum EnemyType {
  GHOST = 'ghost',          // 幽灵
}

// 敌人状态
export enum EnemyState {
  PATROL = 'patrol',        // 巡逻
  CHASE = 'chase',          // 追击
  WANDER = 'wander',        // 游荡
}

// 敌人实体
export interface Enemy {
  id: string;
  type: EnemyType;
  position: Vector2;
  velocity: Vector2;
  state: EnemyState;
  direction: number;
  speed: number;
  detectionRadius: number;  // 检测半径
  canPassWalls: boolean;    // 是否可以穿墙
  targetPosition?: Vector2; // 目标位置
}

// 玩家运气系统
export interface LuckSystem {
  luck: number;             // 运气值 (0-100)
  maxLuck: number;          // 最大运气值
  luckDecayRate: number;    // 运气衰减速度（每次遇到幽灵）
}

// 库存槽位
export interface InventorySlot {
  item: ItemType | null;
  count: number;
}

// 玩家库存
export interface Inventory {
  slots: InventorySlot[];
  maxSlots: number;
}
