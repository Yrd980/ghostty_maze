import type { Cell, Maze, Vector2 } from '../types/game.types';
import { MAZE_CONFIG } from '../constants/game.constants';

export class MazeGenerator {
  private width: number;
  private height: number;
  private cellSize: number;

  constructor(width = MAZE_CONFIG.WIDTH, height = MAZE_CONFIG.HEIGHT, cellSize = MAZE_CONFIG.CELL_SIZE) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
  }

  /**
   * 生成迷宫 - 使用递归回溯算法
   */
  generate(): Maze {
    // 初始化网格
    const cells = this.initializeCells();

    // 从起点开始生成迷宫
    const startX = 0;
    const startY = 0;
    this.recursiveBacktrack(cells, startX, startY);

    // 设置起点和终点
    const startPos: Vector2 = {
      x: startX * this.cellSize + this.cellSize / 2,
      y: startY * this.cellSize + this.cellSize / 2,
    };

    const endPos: Vector2 = {
      x: (this.width - 1) * this.cellSize + this.cellSize / 2,
      y: (this.height - 1) * this.cellSize + this.cellSize / 2,
    };

    return {
      width: this.width,
      height: this.height,
      cellSize: this.cellSize,
      cells,
      startPos,
      endPos,
    };
  }

  /**
   * 初始化所有单元格
   */
  private initializeCells(): Cell[][] {
    const cells: Cell[][] = [];

    for (let y = 0; y < this.height; y++) {
      cells[y] = [];
      for (let x = 0; x < this.width; x++) {
        cells[y][x] = {
          x,
          y,
          walls: {
            top: true,
            right: true,
            bottom: true,
            left: true,
          },
          visited: false,
        };
      }
    }

    return cells;
  }

  /**
   * 递归回溯算法生成迷宫
   */
  private recursiveBacktrack(cells: Cell[][], x: number, y: number): void {
    const current = cells[y][x];
    current.visited = true;

    // 获取所有未访问的邻居
    const neighbors = this.getUnvisitedNeighbors(cells, x, y);

    // 随机打乱邻居顺序
    this.shuffleArray(neighbors);

    for (const neighbor of neighbors) {
      const [nx, ny] = neighbor;

      if (!cells[ny][nx].visited) {
        // 移除当前单元格和邻居之间的墙
        this.removeWall(current, cells[ny][nx]);

        // 递归访问邻居
        this.recursiveBacktrack(cells, nx, ny);
      }
    }
  }

  /**
   * 获取未访问的邻居
   */
  private getUnvisitedNeighbors(cells: Cell[][], x: number, y: number): [number, number][] {
    const neighbors: [number, number][] = [];

    // 上
    if (y > 0 && !cells[y - 1][x].visited) {
      neighbors.push([x, y - 1]);
    }
    // 右
    if (x < this.width - 1 && !cells[y][x + 1].visited) {
      neighbors.push([x + 1, y]);
    }
    // 下
    if (y < this.height - 1 && !cells[y + 1][x].visited) {
      neighbors.push([x, y + 1]);
    }
    // 左
    if (x > 0 && !cells[y][x - 1].visited) {
      neighbors.push([x - 1, y]);
    }

    return neighbors;
  }

  /**
   * 移除两个相邻单元格之间的墙
   */
  private removeWall(current: Cell, neighbor: Cell): void {
    const dx = neighbor.x - current.x;
    const dy = neighbor.y - current.y;

    if (dx === 1) {
      // 邻居在右边
      current.walls.right = false;
      neighbor.walls.left = false;
    } else if (dx === -1) {
      // 邻居在左边
      current.walls.left = false;
      neighbor.walls.right = false;
    } else if (dy === 1) {
      // 邻居在下边
      current.walls.bottom = false;
      neighbor.walls.top = false;
    } else if (dy === -1) {
      // 邻居在上边
      current.walls.top = false;
      neighbor.walls.bottom = false;
    }
  }

  /**
   * 随机打乱数组（Fisher-Yates shuffle）
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
