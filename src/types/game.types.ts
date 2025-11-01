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
  stamina: number;
  isMoving: boolean;
  isSprinting: boolean;
  direction: number; // 角度
}

// 游戏状态
export type GameState = 'menu' | 'playing' | 'paused' | 'gameOver' | 'victory';

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

// 道具类型
export enum ItemType {
  BATTERY = 'battery',      // 电池
  MEDKIT = 'medkit',        // 医疗包
  KEY = 'key',              // 钥匙
  JAMMER = 'jammer',        // 干扰器
}

// 道具实体
export interface Item {
  id: string;
  type: ItemType;
  position: Vector2;
  isCollected: boolean;
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
