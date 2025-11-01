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
