// 迷宫配置
export const MAZE_CONFIG = {
  WIDTH: 20,           // 迷宫宽度（格子数）
  HEIGHT: 20,          // 迷宫高度（格子数）
  CELL_SIZE: 32,       // 每个格子的像素大小
  WALL_THICKNESS: 4,   // 墙体厚度
};

// 玩家配置
export const PLAYER_CONFIG = {
  SIZE: 16,                    // 玩家大小
  SPEED: 150,                  // 基础移动速度 (像素/秒)
  SPRINT_MULTIPLIER: 1.8,      // 奔跑速度倍数
  MAX_HEALTH: 100,             // 最大生命值
  MAX_STAMINA: 100,            // 最大体力值
  STAMINA_DRAIN_RATE: 20,      // 奔跑体力消耗速度（每秒）
  STAMINA_RECOVER_RATE: 15,    // 体力恢复速度（每秒）
};

// 渲染配置
export const RENDER_CONFIG = {
  BACKGROUND_COLOR: '#1a1a1a',
  WALL_COLOR: '#606060',       // 明亮的墙壁（亮灰色）
  WALL_BORDER_COLOR: '#888888', // 很明显的边框
  PATH_COLOR: '#252525',        // 通道（中灰）
  PLAYER_COLOR: '#ff4444',
  START_COLOR: '#44ff44',
  END_COLOR: '#4444ff',
};

// 心率配置（占位）
export const HEARTRATE_CONFIG = {
  BASE_BPM: 75,
  MIN_BPM: 60,
  MAX_BPM: 150,
};

// 手电筒配置
export const FLASHLIGHT_CONFIG = {
  ANGLE: 90,              // 圆锥角度（度）
  RANGE: 150,             // 照射距离（像素）
  BRIGHTNESS: 0.8,        // 亮度
  MAX_BATTERY: 100,       // 最大电量
  DRAIN_RATE: 10,         // 消耗速度（每秒）
  // 心率驱动抖动
  SHAKE_BPM_THRESHOLD: 80,  // 开始抖动的心率阈值
  SHAKE_MAX: 8,             // 最大抖动角度
};

// Canvas 配置
export const CANVAS_CONFIG = {
  WIDTH: MAZE_CONFIG.WIDTH * MAZE_CONFIG.CELL_SIZE,
  HEIGHT: MAZE_CONFIG.HEIGHT * MAZE_CONFIG.CELL_SIZE,
};
