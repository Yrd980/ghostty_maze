import type { Maze, Vector2 } from '../types/game.types';
import { MAZE_CONFIG } from '../constants/game.constants';

export class CollisionSystem {
  /**
   * 检查点是否与迷宫墙壁碰撞
   * COMMENTED OUT - Wall collision disabled for better user experience
   */
  static checkWallCollision(maze: Maze, position: Vector2, radius: number): boolean {
    // const cellSize = maze.cellSize;
    // const wallThickness = MAZE_CONFIG.WALL_THICKNESS;

    // // 获取玩家所在的网格坐标
    // const cellX = Math.floor(position.x / cellSize);
    // const cellY = Math.floor(position.y / cellSize);

    // // 边界检查
    // if (cellX < 0 || cellX >= maze.width || cellY < 0 || cellY >= maze.height) {
    //   return true;
    // }

    // const cell = maze.cells[cellY][cellX];

    // // 计算玩家在单元格中的相对位置
    // const relX = position.x - cellX * cellSize;
    // const relY = position.y - cellY * cellSize;

    // // 检查与四面墙的碰撞
    // // 顶部墙壁
    // if (cell.walls.top && relY - radius < wallThickness) {
    //   return true;
    // }

    // // 底部墙壁
    // if (cell.walls.bottom && relY + radius > cellSize - wallThickness) {
    //   return true;
    // }

    // // 左侧墙壁
    // if (cell.walls.left && relX - radius < wallThickness) {
    //   return true;
    // }

    // // 右侧墙壁
    // if (cell.walls.right && relX + radius > cellSize - wallThickness) {
    //   return true;
    // }

    return false; // Always return false - no wall collision
  }

  /**
   * 获取修正后的位置（避免穿墙）
   * COMMENTED OUT - Wall collision disabled for better user experience
   */
  static resolveCollision(
    maze: Maze,
    oldPos: Vector2,
    newPos: Vector2,
    radius: number
  ): Vector2 {
    // // 先尝试完整移动
    // if (!this.checkWallCollision(maze, newPos, radius)) {
    //   return newPos;
    // }

    // // 尝试只在X轴移动
    // const tryX: Vector2 = { x: newPos.x, y: oldPos.y };
    // if (!this.checkWallCollision(maze, tryX, radius)) {
    //   return tryX;
    // }

    // // 尝试只在Y轴移动
    // const tryY: Vector2 = { x: oldPos.x, y: newPos.y };
    // if (!this.checkWallCollision(maze, tryY, radius)) {
    //   return tryY;
    // }

    // // 都不行则保持原位置
    // return oldPos;
    
    // Always allow movement - no wall collision
    return newPos;
  }
}
