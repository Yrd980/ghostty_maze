import type { Maze, Player, Flashlight, Item, Enemy } from '../types/game.types';
import { ItemType } from '../types/game.types';
import { MAZE_CONFIG, RENDER_CONFIG, ITEM_CONFIG } from '../constants/game.constants';

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

    // 不再绘制固定的起点和终点标记
    // 玩家每次随机生成位置
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
   * 渲染手电筒光照
   */
  renderFlashlight(
    player: Player,
    flashlight: Flashlight,
    shakeDirection: number
  ): void {
    if (!flashlight.isOn) return;

    const { position } = player;
    const angleRad = (flashlight.angle / 2) * (Math.PI / 180);

    // 创建径向渐变光照
    const gradient = this.ctx.createRadialGradient(
      position.x,
      position.y,
      0,
      position.x,
      position.y,
      flashlight.range
    );

    gradient.addColorStop(0, `rgba(255, 255, 200, ${flashlight.brightness})`);
    gradient.addColorStop(
      0.5,
      `rgba(255, 255, 180, ${flashlight.brightness * 0.5})`
    );
    gradient.addColorStop(1, 'rgba(255, 255, 150, 0)');

    // 保存当前状态
    this.ctx.save();

    // 绘制圆锥形光照区域
    this.ctx.beginPath();
    this.ctx.moveTo(position.x, position.y);

    // 圆锥左边缘
    const leftAngle = shakeDirection - angleRad;
    this.ctx.lineTo(
      position.x + Math.cos(leftAngle) * flashlight.range,
      position.y + Math.sin(leftAngle) * flashlight.range
    );

    // 圆弧
    this.ctx.arc(
      position.x,
      position.y,
      flashlight.range,
      leftAngle,
      shakeDirection + angleRad
    );

    // 圆锥右边缘
    this.ctx.lineTo(position.x, position.y);
    this.ctx.closePath();

    // 使用混合模式创建光照效果
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // 恢复状态
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.restore();
  }

  /**
   * 渲染道具
   */
  renderItems(items: Item[]): void {
    const size = ITEM_CONFIG.ITEM_SIZE;

    for (const item of items) {
      if (item.isCollected) continue;

      const { position, type } = item;

      // 根据道具类型选择颜色和图标
      let color = '#ffffff';
      let symbol = '?';

      switch (type) {
        case ItemType.BATTERY:
          color = '#4affff';
          symbol = '🔋';
          break;
        case ItemType.MEDKIT:
          color = '#ff4444';
          symbol = '💊';
          break;
        // 收藏品/物种
        case ItemType.ANCIENT_COIN:
          color = '#ffd700';
          symbol = '🪙';
          break;
        case ItemType.CRYSTAL:
          color = '#00ffff';
          symbol = '💎';
          break;
        case ItemType.SKULL:
          color = '#ffffff';
          symbol = '💀';
          break;
        case ItemType.BOOK:
          color = '#8b4513';
          symbol = '📖';
          break;
        case ItemType.POTION:
          color = '#9370db';
          symbol = '🧪';
          break;
        case ItemType.ARTIFACT:
          color = '#ff6347';
          symbol = '🗿';
          break;
        case ItemType.MUSHROOM:
          color = '#ff1493';
          symbol = '🍄';
          break;
        case ItemType.FEATHER:
          color = '#87ceeb';
          symbol = '🪶';
          break;
        case ItemType.STONE:
          color = '#708090';
          symbol = '🗝️';
          break;
        case ItemType.FLOWER:
          color = '#ff69b4';
          symbol = '🌸';
          break;
        case ItemType.EYE:
          color = '#00ff00';
          symbol = '👁️';
          break;
        case ItemType.TOOTH:
          color = '#f0e68c';
          symbol = '🦷';
          break;
      }

      // 绘制道具背景圆
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.3;
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;

      // 绘制道具图标（使用emoji）
      this.ctx.font = `${size * 1.5}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // 如果是假道具，添加闪烁效果
      if (item.isFake) {
        const flicker = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        this.ctx.globalAlpha = flicker;
      }
      
      this.ctx.fillText(symbol, position.x, position.y);

      // 添加发光效果
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = color;
      this.ctx.fillText(symbol, position.x, position.y);
      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1.0;
    }

    // 重置文本对齐
    this.ctx.textAlign = 'start';
    this.ctx.textBaseline = 'alphabetic';
  }

  /**
   * 渲染敌人（幽灵）
   */
  renderEnemies(enemies: Enemy[]): void {
    for (const enemy of enemies) {
      const { position } = enemy;

      // 绘制幽灵半透明圆形
      this.ctx.save();
      this.ctx.globalAlpha = 0.7;
      
      // 幽灵发光效果
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#8844ff';
      
      // 绘制幽灵身体
      this.ctx.fillStyle = '#aa88ff';
      this.ctx.beginPath();
      this.ctx.arc(position.x, position.y, 12, 0, Math.PI * 2);
      this.ctx.fill();

      // 绘制幽灵图标
      this.ctx.globalAlpha = 1.0;
      this.ctx.font = '24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('👻', position.x, position.y);

      this.ctx.shadowBlur = 0;
      this.ctx.restore();
    }

    // 重置文本对齐
    this.ctx.textAlign = 'start';
    this.ctx.textBaseline = 'alphabetic';
  }

  /**
   * 渲染激活的出口（收集所有钥匙后）
   */
  renderActiveExit(maze: Maze): void {
    const cellSize = maze.cellSize;
    const exitX = (maze.width - 1) * cellSize + cellSize / 2;
    const exitY = (maze.height - 1) * cellSize + cellSize / 2;

    // 绘制脉冲光环
    this.ctx.save();
    const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
    this.ctx.globalAlpha = pulse * 0.5;
    
    const gradient = this.ctx.createRadialGradient(
      exitX, exitY, 0,
      exitX, exitY, 40
    );
    gradient.addColorStop(0, 'rgba(100, 255, 100, 0.8)');
    gradient.addColorStop(1, 'rgba(100, 255, 100, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(exitX, exitY, 40, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();

    // 绘制发光的出口图标
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#44ff44';
    this.ctx.fillStyle = '#44ff44';
    this.ctx.fillText('🚪', exitX, exitY);
    this.ctx.shadowBlur = 0;
  }

  /**
   * 完整渲染管线
   */
  render(
    maze: Maze,
    player: Player,
    flashlight?: Flashlight,
    shakeDirection?: number,
    items?: Item[],
    heartRate?: number,
    hasAllKeys?: boolean
  ): void {
    this.clear();
    this.renderMaze(maze);

    // 如果收集了所有钥匙，渲染激活的出口
    if (hasAllKeys) {
      this.renderActiveExit(maze);
    }

    // 渲染道具
    if (items) {
      this.renderItems(items);
    }

    this.renderPlayer(player);

    // 渲染手电筒（如果提供）
    if (flashlight && shakeDirection !== undefined) {
      this.renderFlashlight(player, flashlight, shakeDirection);
    }
  }
}
