import type { Enemy, EnemyType, EnemyState, Maze, Vector2 } from '../types/game.types';
import { EnemyType as EnemyTypeEnum, EnemyState as EnemyStateEnum } from '../types/game.types';
import { ENEMY_CONFIG } from '../constants/game.constants';

/**
 * 敌人系统 - 管理幽灵AI
 */
export class EnemySystem {
  private enemies: Enemy[] = [];
  private idCounter = 0;

  /**
   * 生成敌人
   */
  generateEnemies(maze: Maze): Enemy[] {
    this.enemies = [];
    this.idCounter = 0;

    // 生成幽灵
    for (let i = 0; i < ENEMY_CONFIG.GHOST_COUNT; i++) {
      this.spawnGhost(maze);
    }

    return this.enemies;
  }

  /**
   * 生成幽灵
   */
  private spawnGhost(maze: Maze): void {
    const position = this.getRandomPosition(maze);

    const ghost: Enemy = {
      id: `ghost-${this.idCounter++}`,
      type: EnemyTypeEnum.GHOST,
      position,
      velocity: { x: 0, y: 0 },
      state: EnemyStateEnum.WANDER,
      direction: Math.random() * Math.PI * 2,
      speed: ENEMY_CONFIG.GHOST_SPEED,
      detectionRadius: ENEMY_CONFIG.GHOST_DETECTION_RADIUS,
      canPassWalls: true, // 幽灵可以穿墙
    };

    this.enemies.push(ghost);
  }

  /**
   * 获取随机位置（避开起点）
   */
  private getRandomPosition(maze: Maze): Vector2 {
    const cellSize = maze.cellSize;
    const margin = cellSize / 2;

    // 避开起点区域
    let cellX, cellY;
    do {
      cellX = Math.floor(Math.random() * maze.width);
      cellY = Math.floor(Math.random() * maze.height);
    } while (cellX < 3 && cellY < 3); // 避开左上角3x3区域

    return {
      x: cellX * cellSize + margin,
      y: cellY * cellSize + margin,
    };
  }

  /**
   * 更新所有敌人
   */
  update(deltaTime: number, playerPos: Vector2, maze: Maze): void {
    for (const enemy of this.enemies) {
      this.updateEnemy(enemy, deltaTime, playerPos, maze);
    }
  }

  /**
   * 更新单个敌人
   */
  private updateEnemy(enemy: Enemy, deltaTime: number, playerPos: Vector2, maze: Maze): void {
    // ===== 追击逻辑（已禁用，保留供将来使用）=====
    // const distanceToPlayer = this.getDistance(enemy.position, playerPos);
    // if (distanceToPlayer < enemy.detectionRadius) {
    //   enemy.state = EnemyStateEnum.CHASE;
    //   enemy.targetPosition = { ...playerPos };
    // } else if (enemy.state === EnemyStateEnum.CHASE) {
    //   enemy.state = EnemyStateEnum.WANDER;
    //   enemy.targetPosition = undefined;
    // }
    // ===== 追击逻辑结束 =====

    // 幽灵只会随机游荡
    enemy.state = EnemyStateEnum.WANDER;
    this.wander(enemy, deltaTime, maze);

    // 更新位置
    enemy.position.x += enemy.velocity.x * deltaTime;
    enemy.position.y += enemy.velocity.y * deltaTime;

    // 幽灵可以穿墙，但限制在地图范围内
    const maxX = maze.width * maze.cellSize;
    const maxY = maze.height * maze.cellSize;
    enemy.position.x = Math.max(0, Math.min(maxX, enemy.position.x));
    enemy.position.y = Math.max(0, Math.min(maxY, enemy.position.y));
  }

  /**
   * 追击玩家
   */
  private chasePlayer(enemy: Enemy, deltaTime: number): void {
    if (!enemy.targetPosition) return;

    const dx = enemy.targetPosition.x - enemy.position.x;
    const dy = enemy.targetPosition.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      enemy.velocity.x = (dx / distance) * enemy.speed;
      enemy.velocity.y = (dy / distance) * enemy.speed;
      enemy.direction = Math.atan2(dy, dx);
    } else {
      enemy.velocity.x = 0;
      enemy.velocity.y = 0;
    }
  }

  /**
   * 随机游荡
   */
  private wander(enemy: Enemy, deltaTime: number, maze: Maze): void {
    // 随机改变方向（更频繁，更随机）
    if (Math.random() < ENEMY_CONFIG.DIRECTION_CHANGE_CHANCE) {
      enemy.direction = Math.random() * Math.PI * 2;
    }

    // 按当前方向缓慢移动
    enemy.velocity.x = Math.cos(enemy.direction) * enemy.speed;
    enemy.velocity.y = Math.sin(enemy.direction) * enemy.speed;
  }

  /**
   * 计算距离
   */
  private getDistance(pos1: Vector2, pos2: Vector2): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 检测玩家是否碰到敌人
   */
  checkCollision(playerPos: Vector2): Enemy | null {
    for (const enemy of this.enemies) {
      const distance = this.getDistance(enemy.position, playerPos);
      if (distance < ENEMY_CONFIG.COLLISION_RADIUS) {
        return enemy;
      }
    }
    return null;
  }

  /**
   * 获取所有敌人
   */
  getEnemies(): Enemy[] {
    return this.enemies;
  }
}
