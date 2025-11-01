// 迷宫配置
export const MAZE_CONFIG = {
  WIDTH: 12,           // 迷宫宽度（格子数）- 减小以便测试
  HEIGHT: 12,          // 迷宫高度（格子数）- 减小以便测试
  CELL_SIZE: 32,       // 每个格子的像素大小
  WALL_THICKNESS: 4,   // 墙体厚度
};

// 玩家配置
export const PLAYER_CONFIG = {
  SIZE: 16,                    // 玩家大小
  SPEED: 150,                  // 基础移动速度 (像素/秒)
  SPRINT_MULTIPLIER: 1.8,      // 奔跑速度倍数
  MAX_HEALTH: 100,             // 最大生命值
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

// 心率配置
export const HEARTRATE_CONFIG = {
  BASE_BPM: 75,
  WALKING_BPM: 85,
  SPRINTING_BPM: 110,
  MIN_BPM: 60,
  MAX_BPM: 150,
  // 心率阶段 debuff
  STAGE_1_THRESHOLD: 80,       // 80+ BPM: 轻微影响
  STAGE_2_THRESHOLD: 100,      // 100+ BPM: 中度影响
  STAGE_3_THRESHOLD: 120,      // 120+ BPM: 严重影响
  // Debuff 概率（每秒）
  STAGE_1_DEBUFF_CHANCE: 0.05, // 5% 每秒
  STAGE_2_DEBUFF_CHANCE: 0.15, // 15% 每秒
  STAGE_3_DEBUFF_CHANCE: 0.30, // 30% 每秒
  // Debuff 效果
  SPEED_DEBUFF: 0.7,           // 速度降低到70%
  DEBUFF_DURATION: 2,          // 持续2秒
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

// 道具配置
export const ITEM_CONFIG = {
  BATTERY_RESTORE: 50,      // 电池恢复量
  MEDKIT_HEAL: 30,          // 医疗包恢复量
  PICKUP_RADIUS: 30,        // 拾取半径（像素）
  ITEM_SIZE: 12,            // 道具显示大小
  // 生成数量
  BATTERY_COUNT: 2,
  MEDKIT_COUNT: 2,
  SPECIES_COUNT: 15,        // 收藏品总数
};

// 理智值配置
export const SANITY_CONFIG = {
  MAX_SANITY: 100,
  INITIAL_SANITY: 80,
  // 理智影响
  GHOST_COLLISION_LOSS: 15,     // 碰到幽灵 -15
  LOW_SANITY_THRESHOLD: 30,     // 低理智阈值
  CRITICAL_SANITY_THRESHOLD: 10,// 极低理智阈值
  // 视觉效果
  DISTORTION_START: 50,         // 开始扭曲的理智值
  HALLUCINATION_CHANCE: 0.02,   // 幻觉概率（低理智时）
};

// 敌人配置
export const ENEMY_CONFIG = {
  GHOST_COUNT: 4,                   // 幽灵数量 - 增加到4个
  GHOST_SPEED: 40,                  // 幽灵速度（像素/秒）- 降低速度
  GHOST_DETECTION_RADIUS: 120,      // 检测半径（暂未使用）
  COLLISION_RADIUS: 20,             // 碰撞半径
  DAMAGE: 15,                       // 碰撞伤害
  LUCK_PENALTY: 10,                 // 碰撞运气惩罚
  DIRECTION_CHANGE_CHANCE: 0.03,    // 每帧改变方向的概率
};

// 运气系统配置
export const LUCK_CONFIG = {
  INITIAL_LUCK: 80,                 // 初始运气值
  MAX_LUCK: 100,                    // 最大运气值
  MIN_LUCK: 0,                      // 最小运气值
  FAKE_ITEM_BASE_CHANCE: 0.15,      // 基础假道具概率 15%
};

// 随机事件配置
export const EVENT_CONFIG = {
  // 负面事件概率
  SPAWN_GHOST_CHANCE: 0.15,
  DAMAGE_CHANCE: 0.20,
  SANITY_LOSS_CHANCE: 0.15,
  CURSE_CHANCE: 0.10,
  HALLUCINATION_CHANCE: 0.05,
  
  // 正面事件概率
  HEAL_CHANCE: 0.10,
  SANITY_RESTORE_CHANCE: 0.10,
  LUCK_BOOST_CHANCE: 0.05,
  VISION_BOOST_CHANCE: 0.03,
  
  // 特殊事件概率
  ESCAPE_PORTAL_CHANCE: 0.02,       // 2% 逃脱传送门！
  TREASURE_CHANCE: 0.03,
  SCENE_TRANSITION_CHANCE: 0.05,    // 5% 场景转换
  NOTHING_CHANCE: 0.02,
};

// Canvas 配置
export const CANVAS_CONFIG = {
  WIDTH: MAZE_CONFIG.WIDTH * MAZE_CONFIG.CELL_SIZE,
  HEIGHT: MAZE_CONFIG.HEIGHT * MAZE_CONFIG.CELL_SIZE,
};

// 迷雾配置
export const FOG_CONFIG = {
  GLOBAL_DARKNESS: 0.7,           // 全局暗度 (0-1) - 降低以便看清
  VISIBLE_RADIUS: 200,            // 手电筒开启时的可见半径 - 增大
  MIN_VISIBLE_RADIUS: 80,         // 手电筒关闭时的最小可见半径 - 增大
  CENTER_VISIBILITY: 1.0,         // 中心区域透明度
  EDGE_VISIBILITY: 0.4,           // 边缘区域透明度 - 增加
  NO_LIGHT_VISIBILITY: 0.6,       // 无光照时的可见度 - 增加
  VIGNETTE_INTENSITY: 0.3,        // 暗角强度 - 降低
  HEARTRATE_FOG_THRESHOLD: 100,   // 心率迷雾触发阈值
  MAX_HEARTRATE_FOG: 0.15,        // 最大心率迷雾强度 - 降低
};

// 场景配置
export const SCENE_CONFIG = {
  MIN_TIME_TO_NEXT_SCENE: 6,      // 最短6秒后转换场景
  MAX_TIME_TO_NEXT_SCENE: 12,     // 最长12秒后转换场景
  SCENE_TRANSITION_CHANCE: 0.10,  // 收集物品时10%概率立即触发场景转换
  
  // 场景特性
  SCENES: {
    NORMAL: {
      name: 'Normal Maze',
      darkness: 0.7,
      ghostSpeed: 40,
      description: 'A standard haunted maze',
    },
    DARK: {
      name: 'Dark Abyss',
      darkness: 0.85,
      ghostSpeed: 50,
      description: 'Darkness consumes everything',
    },
    TWISTED: {
      name: 'Twisted Reality',
      darkness: 0.75,
      ghostSpeed: 45,
      description: 'Reality bends and warps',
    },
    CRIMSON: {
      name: 'Crimson Nightmare',
      darkness: 0.8,
      ghostSpeed: 55,
      description: 'Blood-soaked corridors',
    },
    VOID: {
      name: 'The Void',
      darkness: 0.9,
      ghostSpeed: 60,
      description: 'Nothing exists here',
    },
  },
};
