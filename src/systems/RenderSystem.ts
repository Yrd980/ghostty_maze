import type { Maze, Player } from '../types/game.types';
import { MAZE_CONFIG, RENDER_CONFIG } from '../constants/game.constants';

export class RenderSystem {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.fillStyle = RENDER_CONFIG.BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  /**
   * 渲染迷宫
   */
  renderMaze(maze: Maze): void {
    const { cells, cellSize } = maze;
    const wallThickness = MAZE_CONFIG.WALL_THICKNESS;

    // 绘制通道（背景）
    this.ctx.fillStyle = RENDER_CONFIG.PATH_COLOR;
    for (let y = 0; y < cells.length; y++) {
      for (let x = 0; x < cells[y].length; x++) {
        this.ctx.fillRect(
          x * cellSize,
          y * cellSize,
          cellSize,
          cellSize
        );
      }
    }

    // 绘制墙壁
    this.ctx.strokeStyle = RENDER_CONFIG.WALL_BORDER_COLOR;
    this.ctx.fillStyle = RENDER_CONFIG.WALL_COLOR;
    this.ctx.lineWidth = 1;

    for (let y = 0; y < cells.length; y++) {
      for (let x = 0; x < cells[y].length; x++) {
        const cell = cells[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // 绘制顶部墙壁
        if (cell.walls.top) {
          this.ctx.fillRect(px, py, cellSize, wallThickness);
          this.ctx.strokeRect(px, py, cellSize, wallThickness);
        }

        // 绘制右侧墙壁
        if (cell.walls.right) {
          this.ctx.fillRect(
            px + cellSize - wallThickness,
            py,
            wallThickness,
            cellSize
          );
          this.ctx.strokeRect(
            px + cellSize - wallThickness,
            py,
            wallThickness,
            cellSize
          );
        }

        // 绘制底部墙壁
        if (cell.walls.bottom) {
          this.ctx.fillRect(
            px,
            py + cellSize - wallThickness,
            cellSize,
            wallThickness
          );
          this.ctx.strokeRect(
            px,
            py + cellSize - wallThickness,
            cellSize,
            wallThickness
          );
        }

        // 绘制左侧墙壁
        if (cell.walls.left) {
          this.ctx.fillRect(px, py, wallThickness, cellSize);
          this.ctx.strokeRect(px, py, wallThickness, cellSize);
        }
      }
    }

    // 绘制起点标记（绿色）
    this.ctx.fillStyle = RENDER_CONFIG.START_COLOR;
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillRect(0, 0, cellSize, cellSize);
    this.ctx.globalAlpha = 1.0;

    // 绘制终点标记（蓝色）
    this.ctx.fillStyle = RENDER_CONFIG.END_COLOR;
    this.ctx.globalAlpha = 0.3;
    this.ctx.fillRect(
      (maze.width - 1) * cellSize,
      (maze.height - 1) * cellSize,
      cellSize,
      cellSize
    );
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * 渲染玩家
   */
  renderPlayer(player: Player): void {
    const { position } = player;

    // 绘制玩家圆形
    this.ctx.fillStyle = RENDER_CONFIG.PLAYER_COLOR;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 8, 0, Math.PI * 2);
    this.ctx.fill();

    // 绘制方向指示器
    this.ctx.strokeStyle = RENDER_CONFIG.PLAYER_COLOR;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(position.x, position.y);
    this.ctx.lineTo(
      position.x + Math.cos(player.direction) * 12,
      position.y + Math.sin(player.direction) * 12
    );
    this.ctx.stroke();

    // 添加发光效果
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = RENDER_CONFIG.PLAYER_COLOR;
    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  /**
   * 完整渲染管线
   */
  render(maze: Maze, player: Player): void {
    this.clear();
    this.renderMaze(maze);
    this.renderPlayer(player);
  }
}
